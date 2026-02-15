import pandas as pd
import io
import re
from supabase import create_client

# CONFIG
#SUPABASE_URL = 
#SUPABASE_KEY = 
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_year_level(code):
    match = re.search(r'\d', str(code))
    return int(match.group()) if match else 9

def fetch_all_rows(table_name, columns="*"):
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

def generate_detailed_book_report(target_dept="CS"):
    print(f"Generating Detailed Report for {target_dept}...")
    output = io.BytesIO()
    
    try:
        all_courses = fetch_all_rows("courses", "id, official_code, title, department")
        all_links = fetch_all_rows("course_books", "course_id, book_id")
        all_books = fetch_all_rows("books", "id, title, author, publisher, year, call_number, volume_count")
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None
    
    df_courses = pd.DataFrame(all_courses)
    df_links = pd.DataFrame(all_links)
    df_books = pd.DataFrame(all_books)
    
    mask = df_courses['department'].apply(lambda x: target_dept in x if isinstance(x, list) else False)
    dept_courses = df_courses[mask].copy()
    
    if dept_courses.empty:
        print(f"No courses found for {target_dept}")
        return None

    dept_courses['sort_year'] = dept_courses['official_code'].apply(get_year_level)
    dept_courses = dept_courses.sort_values(by=['sort_year', 'official_code'])

    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        workbook = writer.book
        worksheet = workbook.add_worksheet("Course Book Lists")
        
        # Styles
        title_fmt = workbook.add_format({'bold': True, 'font_size': 12, 'bg_color': '#D9D9D9', 'border': 1, 'align': 'left'})
        header_fmt = workbook.add_format({'bold': True, 'font_size': 10, 'bg_color': '#BDD7EE', 'border': 1, 'align': 'center'})
        cell_fmt = workbook.add_format({'font_size': 10, 'border': 1, 'valign': 'top', 'text_wrap': True})
        center_fmt = workbook.add_format({'font_size': 10, 'border': 1, 'align': 'center', 'valign': 'top'})
        no_books_fmt = workbook.add_format({'font_size': 10, 'italic': True, 'border': 1, 'align': 'center', 'font_color': 'red'})

        worksheet.set_landscape()
        worksheet.set_paper(5) 
        worksheet.set_margins(0.5, 0.5, 0.5, 0.5)
        worksheet.fit_to_pages(1, 0)
        worksheet.set_header(f"&C&\"-,Bold\"Library Holdings: {target_dept} Department")
        worksheet.set_footer("&CPage &P of &N")

        worksheet.set_column(0, 0, 5)  # SN
        worksheet.set_column(1, 1, 25) # Author
        worksheet.set_column(2, 2, 40) # Title
        worksheet.set_column(3, 3, 20) # Publisher
        worksheet.set_column(4, 4, 8)  # Year
        worksheet.set_column(5, 5, 15) # Call #
        worksheet.set_column(6, 6, 8)  # Vols

        current_row = 0
        rows_per_page = 35 
        page_breaks = [] # LIST TO STORE BREAKS

        for _, course in dept_courses.iterrows():
            c_code = course['official_code']
            c_title = course['title']
            
            book_ids = df_links[df_links['course_id'] == c_code]['book_id']
            books_data = df_books[df_books['id'].isin(book_ids)].copy()
            
            rows_needed = len(books_data) + 3
            if (current_row % rows_per_page) + rows_needed > rows_per_page + 5:
                 page_breaks.append(current_row) # ADD TO LIST

            header_text = f"{c_code} - {c_title}"
            worksheet.merge_range(current_row, 0, current_row, 6, header_text, title_fmt)
            current_row += 1

            headers = ["SN", "AUTHOR", "TITLE", "PUBLISHER", "YEAR", "CALL #", "VOLS"]
            for col, txt in enumerate(headers):
                worksheet.write(current_row, col, txt, header_fmt)
            current_row += 1

            if books_data.empty:
                worksheet.merge_range(current_row, 0, current_row, 6, "NO HOLDINGS", no_books_fmt)
                current_row += 1
            else:
                books_data['sort_year'] = pd.to_numeric(books_data['year'], errors='coerce').fillna(0)
                books_data = books_data.sort_values(by='sort_year', ascending=False)

                sn = 1
                for _, book in books_data.iterrows():
                    worksheet.write(current_row, 0, sn, center_fmt)
                    worksheet.write(current_row, 1, book['author'], cell_fmt)
                    worksheet.write(current_row, 2, book['title'], cell_fmt)
                    worksheet.write(current_row, 3, book['publisher'], cell_fmt)
                    worksheet.write(current_row, 4, int(book['sort_year']) if book['sort_year']>0 else "", center_fmt)
                    worksheet.write(current_row, 5, book['call_number'], cell_fmt)
                    worksheet.write(current_row, 6, book['volume_count'], center_fmt)
                    current_row += 1
                    sn += 1
            
            current_row += 1 

        # APPLY BREAKS AT THE END
        if page_breaks:
            worksheet.set_h_pagebreaks(page_breaks)

    output.seek(0)
    return output

if __name__ == "__main__":
    for dept in ["CS", "IT", "IS"]:
        excel_bytes = generate_detailed_book_report(dept)
        if excel_bytes:
            with open(f"Detailed_Book_List_{dept}.xlsx", "wb") as f:
                f.write(excel_bytes.read())
            print(f"Saved Detailed_Book_List_{dept}.xlsx")