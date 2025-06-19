import sqlite3
import csv
import os

# --- CONFIGURATION ---
# Edit the filenames below to match your input and desired output files.
CONFIG = {
    'db_file': 'courses.db',
    'faculty_csv': 'faculty.csv',
    'all_catalog_csv': 'all_catalog.csv',
    'all_offerings_csv': 'all_offerings.csv'
}
# ---------------------

def create_database():
    """
    Creates a SQLite database from the configured CSV files.
    If a database file with the same name already exists, it will be
    deleted and a new one will be created.
    """
    db_name = CONFIG['db_file']

    # --- Delete existing database file to prevent UNIQUE constraint errors on re-run ---
    if os.path.exists(db_name):
        os.remove(db_name)
        print(f"Removed existing database file: '{db_name}'")

    # --- Establish connection and create cursor ---
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    print(f"Creating new database: '{db_name}'")

    # --- Create Tables ---
    # The order of creation matters for foreign key relationships, though SQLite
    # doesn't enforce them by default. We create all tables first.

    # 1. Faculty Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Faculty (
        main_faculty_id INTEGER PRIMARY KEY,
        faculty_name TEXT,
        faculty_title TEXT,
        faculty_department TEXT,
        faculty_college TEXT,
        faculty_link TEXT
    )
    ''')

    # 2. MainCourses Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS MainCourses (
        main_course_id INTEGER PRIMARY KEY,
        course_code TEXT,
        course_name TEXT
    )
    ''')

    # 3. AllCatalog Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS AllCatalog (
        main_catalog_id INTEGER PRIMARY KEY,
        main_course_id INTEGER,
        course_code TEXT,
        course_name TEXT,
        catalog_code TEXT,
        catalog_year INTEGER,
        catalog_type TEXT,
        course_link TEXT,
        course_scraped BOOLEAN,
        course_hours TEXT,
        course_description TEXT,
        course_specific_hours TEXT,
        course_prerequisites TEXT,
        course_fees TEXT,
        course_other TEXT,
        FOREIGN KEY (main_course_id) REFERENCES MainCourses(main_course_id)
    )
    ''')

    # 4. AllOfferings Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS AllOfferings (
        main_offer_id INTEGER PRIMARY KEY,
        main_catalog_id INTEGER,
        main_faculty_id INTEGER,
        year INTEGER,
        broad_semester TEXT,
        specific_semester TEXT,
        full_course_name TEXT,
        link_to_highlight TEXT,
        FOREIGN KEY (main_catalog_id) REFERENCES AllCatalog(main_catalog_id),
        FOREIGN KEY (main_faculty_id) REFERENCES Faculty(main_faculty_id)
    )
    ''')
    print("All tables created successfully.")

    # --- Populate Tables ---

    # 1. Populate Faculty Table
    try:
        with open(CONFIG['faculty_csv'], 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                cursor.execute('''
                INSERT INTO Faculty (main_faculty_id, faculty_name, faculty_title, faculty_department, faculty_college, faculty_link)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (row['Faculty ID'], row['Faculty Name'], row['Faculty Title'], row['Department'], row['College'], row['Website Link']))
        print(f"Populated 'Faculty' table from '{CONFIG['faculty_csv']}'.")
    except FileNotFoundError:
        print(f"Error: Could not find the file '{CONFIG['faculty_csv']}'. Please check the path in the CONFIG.")
        conn.close()
        return

    # 2. Populate AllCatalog Table
    try:
        with open(CONFIG['all_catalog_csv'], 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                catalog_year = int(row['Year'].split('-')[0]) if row.get('Year') else None
                course_scraped = row.get('Course Scraped', '').strip().upper() == 'TRUE'
                
                # Set scraped fields to NULL if course_scraped is False
                course_hours = row['Hours'] if course_scraped else None
                course_description = row['Description'] if course_scraped else None
                course_specific_hours = row['Specific Hours'] if course_scraped else None
                course_prerequisites = row['Prerequisite(s)'] if course_scraped else None
                course_fees = row['Course Fees'] if course_scraped else None
                course_other = row['Other'] if course_scraped else None

                cursor.execute('''
                INSERT INTO AllCatalog (main_catalog_id, main_course_id, course_code, course_name, catalog_code, catalog_year, catalog_type, course_link, course_scraped, course_hours, course_description, course_specific_hours, course_prerequisites, course_fees, course_other)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (row['Catalog ID'], row['Group ID'], row['Course Code'], row['Course Name'], row['Catalog Code'], catalog_year, row['Catalog Type'], row['Course Link'], course_scraped, course_hours, course_description, course_specific_hours, course_prerequisites, course_fees, course_other))
        print(f"Populated 'AllCatalog' table from '{CONFIG['all_catalog_csv']}'.")
    except FileNotFoundError:
        print(f"Error: Could not find the file '{CONFIG['all_catalog_csv']}'. Please check the path in the CONFIG.")
        conn.close()
        return

    # 3. Populate MainCourses Table (derived from AllCatalog)
    # This query finds the most recent catalog entry for each course group and uses its details.
    cursor.execute('''
    INSERT INTO MainCourses (main_course_id, course_code, course_name)
    SELECT
        main_course_id,
        course_code,
        course_name
    FROM (
        SELECT
            main_course_id,
            course_code,
            course_name,
            ROW_NUMBER() OVER(PARTITION BY main_course_id ORDER BY catalog_year DESC) as rn
        FROM AllCatalog
    )
    WHERE rn = 1
    ''')
    print("Populated 'MainCourses' table based on the latest data from 'AllCatalog'.")

    # 4. Populate AllOfferings Table
    try:
        with open(CONFIG['all_offerings_csv'], 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                cursor.execute('''
                INSERT INTO AllOfferings (main_offer_id, main_catalog_id, main_faculty_id, year, broad_semester, specific_semester, full_course_name, link_to_highlight)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (row['Offering ID'], row['Catalog ID'], row['Faculty ID'], row['Year'], row['Broad Semester'], row['Specific Semester'], row['Full Course Name'], row['Link To Highlight']))
        print(f"Populated 'AllOfferings' table from '{CONFIG['all_offerings_csv']}'.")
    except FileNotFoundError:
        print(f"Error: Could not find the file '{CONFIG['all_offerings_csv']}'. Please check the path in the CONFIG.")
        conn.close()
        return

    # --- Commit changes and close connection ---
    conn.commit()
    conn.close()
    print(f"\nDatabase generation complete. File '{db_name}' is ready.")

if __name__ == '__main__':
    # This main block calls the function to generate the database.
    # Make sure your CSV files are named according to the CONFIG section at the top,
    # or edit the CONFIG to match your filenames.
    create_database()
