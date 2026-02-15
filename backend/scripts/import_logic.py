import pandas as pd
import re
import math
import sys
import os
import hashlib
from supabase import create_client

# CONFIG

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ----------------------------
# UTILITIES
# ----------------------------

def get_file_hash(filepath):
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def clean_text(text):
    if pd.isna(text) or text == "": return None
    text_str = str(text).strip()
    if text_str.lower() in ["nan", "none", "null"]: return None
    return text_str

def normalize_key(code):
    if not code: return ""
    return re.sub(r'[^A-Z0-9]', '', str(code).upper())

def clean_year(value):
    if pd.isna(value) or value == "": return None
    match = re.search(r'\d{4}', str(value))
    return int(match.group(0)) if match else None

def sanitize_record(record):
    cleaned = {}
    for k, v in record.items():
        if isinstance(v, float) and math.isnan(v):
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned

def fetch_all_rows(table_name, columns="*"):
    all_data = []
    start = 0
    step = 1000
    print(f"Fetching {table_name}...")
    while True:
        try:
            res = supabase.table(table_name).select(columns).range(start, start + step - 1).execute()
            if not res.data: break
            all_data.extend(res.data)
            if len(res.data) < step: break
            start += step
        except Exception as e:
            print(f"Pagination error on {table_name}: {e}")
            break
    print(f"  > Loaded {len(all_data)} rows")
    return all_data

# ----------------------------
# MAP BUILDERS
# ----------------------------

def build_code_map():
    print("Building Course Map...")
    try:
        data = fetch_all_rows("courses", "id, official_code, aliases, department, manually_edited")
    except:
        print("Warning: 'manually_edited' column missing. Skipping safety check.")
        data = fetch_all_rows("courses", "id, official_code, aliases, department")

    key_to_data = {}
    for row in data:
        key_to_data[normalize_key(row['official_code'])] = row
        if row['aliases']:
            for a in row['aliases']:
                key_to_data[normalize_key(a)] = row
    return key_to_data

def build_book_map():
    print("Building Book Cache...")
    data = fetch_all_rows("books", "*")
    book_map = {}
    for row in data:
        if row.get('isbn'): book_map[row['isbn']] = row
        title = row.get('title') or ""
        author = row.get('author') or ""
        fp = normalize_key(title[:50] + author[:15])
        if fp not in book_map: book_map[fp] = row
    return book_map

# ----------------------------
# TEMPLATE INGEST (WITH TYPO CORRECTION)
# ----------------------------

def ingest_course_templates(file_path):
    print("Opening Course Templates File...")
    try:
        with pd.ExcelFile(file_path) as xls:
    
            # 1. Build Map
            key_to_data = build_code_map()
            updated_course_ids = set()

            # --- PHASE 1: SUMMARIES ---
            print("\n--- PHASE 1: Processing Summary Sheets (Authoritative) ---")
            for sheet in xls.sheet_names:
                if "SUMMARY" not in sheet.upper(): continue
                print(f"Processing Summary: {sheet}")

                df_raw = pd.read_excel(xls, sheet_name=sheet, header=None)
                header_row = None
                for i, row in df_raw.iterrows():
                    row_str = row.astype(str).str.cat(sep=' ').upper()
                    if "COURSE CODE" in row_str and "TITLE" in row_str:
                        header_row = i
                        break
                
                if header_row is None: continue

                df = pd.read_excel(xls, sheet_name=sheet, header=header_row)
                current_dept = "IT" if "IT" in sheet.upper() else "CS" if "CS" in sheet.upper() else "IS"

                # Smart Column Detection
                new_code_col = next((c for c in df.columns if "NEW" in str(c).upper() and "CODE" in str(c).upper()), None)
                old_code_col = next((c for c in df.columns if "COURSE CODE" in str(c).upper() and "NEW" not in str(c).upper()), None)
                
                for _, row in df.iterrows():
                    target_official_val = clean_text(row.get(new_code_col))
                    old_code_val = clean_text(row.get(old_code_col))
                    
                    if not target_official_val and not old_code_val: continue
                    if target_official_val and "YEAR" in str(target_official_val).upper(): continue
                    
                    primary_code_str = target_official_val or old_code_val
                    if not primary_code_str: continue
                    
                    desired_official_code = normalize_key(str(primary_code_str).split("/")[0]) 
                    
                    # --- TYPO CORRECTION ---
                    typo_map = {"ITS161": "ITS161L"}
                    if desired_official_code in typo_map: desired_official_code = typo_map[desired_official_code]

                    # Look up Records
                    record_new = key_to_data.get(desired_official_code)
                    
                    record_old = None
                    if old_code_val:
                        old_key = normalize_key(old_code_val.split("/")[0])
                        if old_key != desired_official_code:
                            record_old = key_to_data.get(old_key)

                    # Metadata Prep
                    aliases_found = set()
                    if old_code_val:
                        for p in str(old_code_val).split("/"): aliases_found.add(normalize_key(p.strip()))
                    if target_official_val:
                        for p in str(target_official_val).split("/"): aliases_found.add(normalize_key(p.strip()))
                    if desired_official_code in aliases_found: aliases_found.remove(desired_official_code)

                    title = clean_text(row.get("COURSE TITLE")) or clean_text(row.get("TITLE"))
                    if not title: title = f"Unknown Title ({desired_official_code})"

                    # --- LOGIC BRANCH ---
                    
                    # Scenario A: BOTH exist separately. MERGE Old -> New.
                    if record_new and record_old and record_new['id'] != record_old['id']:
                        print(f"  [MERGE] Processing duplicate {record_old['official_code']} & {record_new['official_code']}...")
                        
                        try:
                            # --- SMART LINK MIGRATION ---
                            old_links = supabase.table("course_books").select("id, book_id").eq("course_id", record_old['official_code']).execute()
                            new_links = supabase.table("course_books").select("book_id").eq("course_id", desired_official_code).execute()
                            
                            existing_book_ids = {x['book_id'] for x in new_links.data}
                            ids_to_delete = []
                            ids_to_move = []
                            
                            for link in old_links.data:
                                if link['book_id'] in existing_book_ids:
                                    ids_to_delete.append(link['id'])
                                else:
                                    ids_to_move.append(link['id'])
                            
                            if ids_to_delete:
                                supabase.table("course_books").delete().in_("id", ids_to_delete).execute()
                            if ids_to_move:
                                supabase.table("course_books").update({"course_id": desired_official_code}).in_("id", ids_to_move).execute()

                            # Merge Metadata
                            new_aliases = set(record_new.get('aliases') or [])
                            old_aliases = set(record_old.get('aliases') or [])
                            final_aliases = list(new_aliases.union(old_aliases).union(aliases_found))
                            
                            new_depts = set(record_new.get('department') or [])
                            old_depts = set(record_old.get('department') or [])
                            final_depts = list(new_depts.union(old_depts).union([current_dept]))

                            supabase.table("courses").update({
                                "title": title,
                                "department": final_depts,
                                "aliases": final_aliases
                            }).eq("id", record_new['id']).execute()
                            
                            supabase.table("courses").delete().eq("id", record_old['id']).execute()
                            
                            key_to_data[desired_official_code] = record_new
                            updated_course_ids.add(record_new['id'])
                            print("    Merge successful.")
                            
                        except Exception as e: print(f"    Merge failed: {e}")

                    # Scenario B: Only OLD exists. RENAME.
                    elif record_old and not record_new:
                        print(f"  [RENAME] {record_old['official_code']} -> {desired_official_code}...")
                        current_db_code = record_old['official_code']
                        
                        try:
                            merged_depts = list(set((record_old.get('department') or []) + [current_dept]))
                            final_aliases = list(set((record_old.get('aliases') or [])).union(aliases_found))
                            
                            res = supabase.table("courses").upsert({
                                "official_code": desired_official_code,
                                "title": title,
                                "department": merged_depts,
                                "aliases": final_aliases,
                                "manually_edited": False
                            }, on_conflict="official_code").execute()
                            
                            if res.data:
                                new_id = res.data[0]['id']
                                supabase.table("course_books").update({"course_id": desired_official_code}).eq("course_id", current_db_code).execute()
                                supabase.table("courses").delete().eq("id", record_old['id']).execute()
                                
                                key_to_data[desired_official_code] = res.data[0]
                                updated_course_ids.add(new_id)
                        except Exception as e: print(f"    Rename failed: {e}")

                    # Scenario C: Only NEW exists. UPDATE.
                    elif record_new:
                        if record_new.get('manually_edited'): continue
                        
                        existing_depts = record_new.get('department')
                        if not isinstance(existing_depts, list): existing_depts = []
                        merged_depts = list(set(existing_depts + [current_dept]))
                        
                        current_aliases = set(record_new.get('aliases') or [])
                        final_aliases = list(current_aliases.union(aliases_found))

                        if set(existing_depts) != set(merged_depts) or record_new['id'] not in updated_course_ids:
                            try:
                                supabase.table("courses").update({
                                    "title": title,
                                    "department": merged_depts,
                                    "aliases": final_aliases
                                }).eq("id", record_new['id']).execute()
                                
                                updated_course_ids.add(record_new['id'])
                                record_new['department'] = merged_depts
                            except Exception as e:
                                print(f"Error updating course {desired_official_code}: {e}")

                    # Scenario D: Neither exists. INSERT.
                    else:
                        try:
                            res = supabase.table("courses").insert({
                                "official_code": desired_official_code,
                                "title": title,
                                "department": [current_dept],
                                "aliases": list(aliases_found)
                            }).execute()
                            if res.data:
                                key_to_data[desired_official_code] = res.data[0]
                                updated_course_ids.add(res.data[0]['id'])
                        except Exception as e:
                            print(f"Error inserting course {desired_official_code}: {e}")

            # --- PHASE 2: PARSING BOOKS ---
            print("\n--- PHASE 2: Parsing Legacy Book Sheets ---")
            legacy_books_batch = {}
            links_batch = set()
            
            acqui_fingerprints = set()
            try:
                acqui_data = fetch_all_rows("books", "title, author, source_type")
                for r in acqui_data:
                    if r.get("source_type") == "acquisition":
                        fp = normalize_key((r["title"] or "")[:50] + ((r["author"] or "")[:10]))
                        acqui_fingerprints.add(fp)
            except: pass

            key_to_data = build_code_map()

            for sheet in xls.sheet_names:
                if "SUMMARY" in sheet.upper(): continue

                norm_sheet = normalize_key(sheet)
                
                # Apply Typo Correction to Sheet Matching
                typo_map = {"ITS161": "ITS161L"}
                if norm_sheet in typo_map: norm_sheet = typo_map[norm_sheet]

                target_course_code = None
                
                if norm_sheet in key_to_data:
                    target_course_code = key_to_data[norm_sheet]['official_code']
                else:
                    parts = sheet.replace("-", " ").replace("_", " ").split(" ")
                    for part in parts:
                        norm_part = normalize_key(part)
                        if norm_part in key_to_data:
                            target_course_code = key_to_data[norm_part]['official_code']
                            break
                    
                    if not target_course_code:
                        for code_key, record in key_to_data.items():
                            if len(code_key) > 4 and norm_sheet.startswith(code_key):
                                target_course_code = record['official_code']
                                break

                if not target_course_code: continue

                df_raw = pd.read_excel(xls, sheet_name=sheet, header=None)
                header_row = None
                for i, row in df_raw.iterrows():
                    row_str = str(row.values).upper()
                    if "TITLE" in row_str and ("AUTHOR" in row_str or "PUBLISHER" in row_str):
                        header_row = i
                        break
                
                if header_row is None: continue
                df = pd.read_excel(xls, sheet_name=sheet, header=header_row)

                for _, row in df.iterrows():
                    title = clean_text(row.get("TITLE"))
                    if not title: continue 

                    author = clean_text(row.get("AUTHOR"))
                    fingerprint = normalize_key(title[:50] + (author[:15] if author else ""))
                    synthetic_isbn = f"LEG-{fingerprint}"

                    if fingerprint not in acqui_fingerprints:
                        if synthetic_isbn not in legacy_books_batch:
                            try:
                                raw_vol = row.get("NO. OF VOLS.")
                                final_vol = int(float(str(raw_vol).lower().replace("c.", "").replace("v.", "").strip())) if not pd.isna(raw_vol) else 1
                            except: final_vol = 1

                            legacy_books_batch[synthetic_isbn] = {
                                "isbn": synthetic_isbn,
                                "title": title,
                                "author": author,
                                "publisher": clean_text(row.get("PUBLISHER")),
                                "year": clean_year(row.get("YEAR")),
                                "volume_count": final_vol,
                                "call_number": clean_text(row.get("CALL NUMBER")),
                                "accession_number": clean_text(row.get("ACCESSION NUMBER") or row.get("ACC. #")),
                                "source_type": "legacy_template"
                            }
                    
                    links_batch.add((synthetic_isbn, target_course_code))

            if legacy_books_batch:
                print(f"\nUploading {len(legacy_books_batch)} NEW legacy books...")
                books_list = list(legacy_books_batch.values())
                for i in range(0, len(books_list), 500):
                    chunk = [sanitize_record(b) for b in books_list[i:i + 500]]
                    try:
                        supabase.table("books").upsert(chunk, on_conflict="isbn").execute()
                    except Exception as e: print(f"Error uploading book chunk: {e}")

            print("\nLinking legacy books to courses...")
            fingerprint_to_uuid = {}
            all_books_data = fetch_all_rows("books", "id, title, author, isbn")
            for b in all_books_data:
                if b["isbn"]: fingerprint_to_uuid[b["isbn"]] = b["id"]
                fp = normalize_key((b["title"] or "")[:50] + ((b["author"] or "")[:15]))
                fingerprint_to_uuid[fp] = b["id"]

            final_links = []
            for leg_isbn, cid_string in links_batch:
                book_uuid = fingerprint_to_uuid.get(leg_isbn) or fingerprint_to_uuid.get(fp)
                if book_uuid:
                    final_links.append({"course_id": cid_string, "book_id": book_uuid})

            if final_links:
                unique_links = [dict(t) for t in {tuple(d.items()) for d in final_links}]
                print(f"Pushing {len(unique_links)} links to DB...")
                for i in range(0, len(unique_links), 500):
                    try:
                        supabase.table("course_books").upsert(unique_links[i:i + 500], on_conflict="course_id,book_id").execute()
                    except Exception as e: print(f"Error linking chunk: {e}")

            print(f"Template Import Complete.")
    
    except Exception as e:
        print(f"Error during template import: {e}")
        raise

def ingest_acquisitions(file_path):
    print(f"\nOpening Acquisitions: {file_path}...")
    try:
        try: df = pd.read_csv(file_path)
        except: df = pd.read_csv(file_path, encoding='latin1')
    except Exception as e: 
        print(f"Failed to read CSV: {e}")
        return

    df.columns = df.columns.astype(str).str.upper().str.strip().str.replace('\n', ' ')
    title_col = next((c for c in df.columns if "TITLE" in c), None)
    if not title_col: return

    author_col = next((c for c in df.columns if "AUTHOR" in c), None)
    isbn_col = next((c for c in df.columns if "ISBN" in c), None)
    pub_col = next((c for c in df.columns if "PUBLISHER" in c), None)
    year_col = next((c for c in df.columns if "YEAR" in c or "COPYRIGHT" in c), None)
    call_col = next((c for c in df.columns if "CALL" in c), None) 
    acc_col = next((c for c in df.columns if "ACC" in c), None)   
    vol_col = next((c for c in df.columns if "VOL" in c or "QTY" in c), None)
    course_col = next((c for c in df.columns if "COURSE" in c or "CODE" in c), None)

    print("Fetching aliases for acquisitions...")
    key_to_data = build_code_map()

    links_to_create = []

    print("Processing rows...")
    for _, row in df.iterrows():
        title = clean_text(row.get(title_col))
        if not title: continue
        
        author = clean_text(row.get(author_col))
        publisher = clean_text(row.get(pub_col))
        year = clean_year(row.get(year_col))
        call_number = clean_text(row.get(call_col))
        accession_number = clean_text(row.get(acc_col))
        
        fingerprint = normalize_key(title[:50] + (author[:15] if author else ""))
        real_isbn = clean_text(row.get(isbn_col))
        final_isbn = re.sub(r'[^0-9X]', '', str(real_isbn)) if (real_isbn and len(str(real_isbn)) > 5) else f"LEG-{fingerprint}"

        try: qty = int(float(row.get(vol_col, 1)))
        except: qty = 1

        # FIXED: Simple upsert - treats CSV as snapshot, not delta
        book_rec = {
            "isbn": final_isbn,
            "title": title, 
            "author": author, 
            "publisher": publisher,        
            "volume_count": qty,  # Just set it directly from CSV
            "year": year, 
            "call_number": call_number, 
            "accession_number": accession_number, 
            "source_type": "acquisition"
        }
        
        try:
            # Upsert: if exists, REPLACE with CSV values (idempotent)
            res = supabase.table("books").upsert(book_rec, on_conflict="isbn").execute()
            if res.data: 
                book_uuid = res.data[0]["id"]
            else: 
                continue
        except Exception as e:
            print(f"Error upserting book '{title}': {e}")
            continue

        if row.get(course_col):
            for c_code in re.split(r'[;,\n&]|\sand\s', str(row.get(course_col))):
                clean_c = normalize_key(c_code)
                if not clean_c: continue
                
                typo_map = {"ITS161": "ITS161L"}
                if clean_c in typo_map: clean_c = typo_map[clean_c]
                
                record = key_to_data.get(clean_c)
                
                if not record:
                    print(f"   Auto-creating placeholder for {clean_c}...")
                    try:
                        res = supabase.table("courses").upsert({
                            "official_code": clean_c, 
                            "title": f"Unknown Course ({clean_c})", 
                            "department": ["Unassigned"], 
                            "aliases": [],
                            "manually_edited": False
                        }, on_conflict="official_code").execute()
                        
                        key_to_data[clean_c] = {'official_code': clean_c}
                        official_str = clean_c
                    except Exception as e:
                        print(f"Placeholder Error: {e}")
                        continue
                else:
                    official_str = record['official_code']
                
                if official_str:
                    links_to_create.append({"course_id": official_str, "book_id": book_uuid})

    if links_to_create:
        unique_links = [dict(t) for t in {tuple(d.items()) for d in links_to_create}]
        print(f"Linking {len(unique_links)} connections...")
        for i in range(0, len(unique_links), 500):
            try:
                supabase.table("course_books").upsert(unique_links[i:i + 500], on_conflict="course_id,book_id").execute()
            except Exception as e: print(f"Link error: {e}")
    
    print("Acquisitions Import Complete.")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        cmd, path = sys.argv[1].lower(), sys.argv[2]
        if cmd == "acquisitions": ingest_acquisitions(path)
        elif cmd == "templates": ingest_course_templates(path)
    else:
        ingest_acquisitions("SOIT.csv")
        ingest_course_templates("CS, IT and IS  UPDATED NEW CURRICULUM- 1.xlsx")