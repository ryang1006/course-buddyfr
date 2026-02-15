import pandas as pd
import io
import re
import os
from supabase import create_client
from dotenv import load_dotenv

# CONFIG
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")


supabase = create_client(url, key)

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
    df_books['year'] = pd.to_numeric(df_books['year'], errors='coerce').fillna(0).astype(int)
    df_books['volume_count'] = pd.to_numeric(df_books['volume_count'], errors='coerce').fillna(1).astype(int)
    df_books = df_books.fillna("")

    if df_courses.empty:
        return None

    mask = df_courses['department'].apply(
        lambda x: target_dept in x if (x is not None and isinstance(x, list)) else False
    )
    dept_courses = df_courses[mask].copy()

    if dept_courses.empty:
        print(f"No courses found for {target_dept}")
        return None

    dept_courses['sort_year'] = dept_courses['official_code'].apply(get_year_level)
    dept_courses = dept_courses.sort_values(by=['sort_year', 'official_code'])

    # Back to normal ExcelWriter (no nan_inf_to_errors)
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

        worksheet.set_column(0, 0, 5)
        worksheet.set_column(1, 1, 25)
        worksheet.set_column(2, 2, 40)
        worksheet.set_column(3, 3, 20)
        worksheet.set_column(4, 4, 8)
        worksheet.set_column(5, 5, 15)
        worksheet.set_column(6, 6, 8)

        current_row = 0
        rows_per_page = 35
        page_breaks = []

        for _, course in dept_courses.iterrows():
            c_code = course['official_code']
            c_title = course['title']

            book_ids = df_links[df_links['course_id'] == c_code]['book_id']
            books_data = df_books[df_books['id'].isin(book_ids)].copy()
            df_merged = df_links.merge(df_books, left_on="book_id", right_on="id", how="inner")

            rows_needed = len(books_data) + 3
            if (current_row % rows_per_page) + rows_needed > rows_per_page + 5:
                page_breaks.append(current_row)

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
                books_data['sort_year'] = pd.to_numeric(
                    books_data['year'], errors='coerce'
                )
                books_data = books_data.sort_values(
                    by='sort_year', ascending=False, na_position='last'
                )

                sn = 1
                for _, book in books_data.iterrows():
                    worksheet.write(current_row, 0, sn, center_fmt)

                    worksheet.write(current_row, 1, book.get('author') or "", cell_fmt)
                    worksheet.write(current_row, 2, book.get('title') or "", cell_fmt)
                    worksheet.write(current_row, 3, book.get('publisher') or "", cell_fmt)

                    # SAFE YEAR WRITE
                    year_value = book.get('sort_year')
                    if pd.notna(year_value) and year_value > 0:
                        worksheet.write(current_row, 4, int(year_value), center_fmt)
                    else:
                        worksheet.write(current_row, 4, "", center_fmt)

                    worksheet.write(current_row, 5, book.get('call_number') or "", cell_fmt)

                    # SAFE VOLUME WRITE
                    vol_value = book.get('volume_count')
                    if pd.notna(vol_value):
                        worksheet.write(current_row, 6, vol_value, center_fmt)
                    else:
                        worksheet.write(current_row, 6, "", center_fmt)

                    current_row += 1
                    sn += 1

            current_row += 1

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