import pandas as pd
import io
import datetime
import re
from supabase import create_client

# CONFIG (Same as your import script)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_year_level(code):
    """
    Guesses year level based on the first digit found in the code.
    CS101 -> 1
    IT321 -> 3
    """
    match = re.search(r'\d', str(code))
    if match:
        return int(match.group())
    return 9 # Default to end if no number

def fetch_all_rows(table_name, columns="*"):
    """Helper to bypass 1000 row limit."""
    all_data = []
    start = 0
    step = 1000
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
    return all_data

def generate_full_library_report():
    print("Generating Full Library Report...")
    output = io.BytesIO()
    
    # 1. Fetch All Necessary Data Once
    print("Fetching courses...")
    all_courses = fetch_all_rows("courses", "id, official_code, title, department, aliases")
    
    print("Fetching links...")
    all_links = fetch_all_rows("course_books", "course_id, book_id")
    
    print("Fetching books...")
    all_books = fetch_all_rows("books", "id, year, volume_count")
    
    # Convert to DataFrames
    df_courses = pd.DataFrame(all_courses)
    df_links = pd.DataFrame(all_links)
    df_books = pd.DataFrame(all_books)
    
    # Pre-merge books and links
    df_merged = df_links.merge(df_books, left_on="book_id", right_on="id", how="inner")
    
    # Define Departments to Process
    departments = ["CS", "IT", "IS"]
    
    # 2. Setup Excel Writer
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        # --- STYLES ---
        header_fmt = workbook.add_format({
            'bold': True, 'font_color': 'white', 'bg_color': '#C00000',
            'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True, 'font_size': 9
        })
        recency_fmt = workbook.add_format({
            'bold': True, 'bg_color': '#FFC000', 'border': 1, 
            'align': 'center', 'valign': 'vcenter', 'font_size': 9
        })
        cell_fmt = workbook.add_format({
            'border': 1, 'valign': 'vcenter', 'font_size': 10
        })
        center_fmt = workbook.add_format({
            'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_size': 10
        })
        sheet_title_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'italic': True})

        # 3. Dynamic Years
        current_year = datetime.datetime.now().year
        recency_years = [current_year - i for i in range(5)] 

        # --- PROCESS EACH DEPARTMENT ---
        for dept in departments:
            print(f"Processing {dept}...")
            
            # --- CHANGED: FILTER LOGIC FOR ARRAY COLUMN ---
            # We use a lambda function to check if 'dept' is in the 'department' list
            # We also handle cases where 'department' might be None or not a list
            mask = df_courses['department'].apply(lambda x: dept in x if isinstance(x, list) else False)
            dept_courses = df_courses[mask].copy()
            
            if dept_courses.empty:
                print(f"  No courses found for {dept}")
                continue

            # Add Sort Key (Year Level)
            dept_courses['sort_year'] = dept_courses['official_code'].apply(get_year_level)
            # Sort by Year Level then Alphabetical Code
            dept_courses = dept_courses.sort_values(by=['sort_year', 'official_code'])

            # Prepare Data for Sheet
            sheet_rows = []
            
            for _, course in dept_courses.iterrows():
                c_code = course['official_code']
                
                # Get books for this course
                c_books = df_merged[df_merged['course_id'] == c_code]
                
                # Stats
                total_titles = c_books['id'].nunique()
                total_vols = c_books['volume_count'].sum()
                
                # Calculate Recency
                recency_counts = {}
                recent_titles_count = 0
                
                for y in recency_years:
                    count = c_books[pd.to_numeric(c_books['year'], errors='coerce') == y]['id'].nunique()
                    recency_counts[y] = count
                    recent_titles_count += count
                
                needed = max(0, 5 - recent_titles_count)
                
                # Determine "Old Code"
                aliases = course.get('aliases') or []
                old_code = ""
                if isinstance(aliases, list) and aliases:
                    others = [a for a in aliases if a != c_code]
                    if others: old_code = others[0]

                row_data = {
                    "NEW CODE": c_code,
                    "OLD CODE": old_code,
                    "TITLE": course['title'],
                    "TOTAL TITLES": total_titles,
                    "TOTAL VOLS": total_vols
                }
                # Add dynamic years
                for y in recency_years:
                    row_data[y] = recency_counts[y]
                
                row_data["TOTAL RECENT"] = recent_titles_count
                row_data["NEEDED"] = needed
                
                sheet_rows.append(row_data)

            # Create DataFrame for Export
            df_export = pd.DataFrame(sheet_rows)
            sheet_name = f"{dept} SUMMARY"
            
            # Write to Excel
            start_row = 8
            df_export.to_excel(writer, sheet_name=sheet_name, index=False, startrow=start_row + 1, header=False)
            
            worksheet = writer.sheets[sheet_name]
            
            # --- FORMATTING ---
            worksheet.write('B2', f"BACHELOR OF SCIENCE IN {dept} (Curriculum Summary)", sheet_title_fmt)
            
            # Merged Header
            worksheet.merge_range(start_row - 1, 5, start_row - 1, 9, "5 YEAR RECENCY", recency_fmt)
            
            # Column Headers
            col_headers = [
                "NEW CURRICULUM CODE", "OLD CODE", "COURSE TITLE", 
                "TOTAL TITLES", "TOTAL VOLUMES"
            ] + [str(y) for y in recency_years] + [
                f"WITHIN LAST 5 YEARS ({recency_years[-1]}-{recency_years[0]})", "NO. OF NEEDED TITLES"
            ]
            
            for col, text in enumerate(col_headers):
                if str(text) in [str(y) for y in recency_years] or "YEARS" in str(text):
                    style = recency_fmt
                else:
                    style = header_fmt
                worksheet.write(start_row, col, text, style)

            # Column Widths
            worksheet.set_column(0, 1, 15, cell_fmt)
            worksheet.set_column(2, 2, 45, cell_fmt)
            worksheet.set_column(3, 12, 12, center_fmt)

            # Page Setup
            worksheet.set_landscape()
            worksheet.set_paper(5) # US Legal
            worksheet.fit_to_pages(1, 0) 

    output.seek(0)
    return output

if __name__ == "__main__":
    excel_file = generate_full_library_report()
    with open("Full_Library_Summary_2026.xlsx", "wb") as f:
        f.write(excel_file.read())
    print("Export generated: Full_Library_Summary_2026.xlsx")