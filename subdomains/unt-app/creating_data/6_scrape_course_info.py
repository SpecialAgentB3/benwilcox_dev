import asyncio
import csv
import re
import os
import random
import pandas as pd
import aiohttp
from bs4 import BeautifulSoup
from tqdm.asyncio import tqdm as async_tqdm
from tqdm import tqdm

# --- Configuration ---
INPUT_CSV = '0_all_catalog2.csv'
OUTPUT_CSV = 'all_catalog.csv'
REPEAT_UNTIL_COMPLETE = True
SAVE_FREQUENCY = 100
RETRY_PAUSE_SECONDS = 10
# --- Throttling and Rate-Limiting ---
# The maximum number of requests that can be "in-flight" at any given time.
# This is the most important setting for preventing rate-limit issues.
MAX_CONCURRENT_REQUESTS = 15
# The base delay before each request begins.
REQUEST_DELAY_SECONDS = 0.25
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

FINAL_COLUMN_ORDER = [
    'Catalog ID', 'Group ID', 'Match Number', 'Course Code', 'Course Name',
    'Catalog Code', 'Year', 'Catalog Type', 'Course Link', 'Course Scraped',
    'Hours', 'Specific Hours', 'Description', 'Prerequisite(s)', 'Course Fees', 'Other'
]
SCRAPED_DATA_COLUMNS = ['Hours', 'Specific Hours', 'Description', 'Prerequisite(s)', 'Course Fees', 'Other']

def clean_text(text):
    """Normalizes whitespace in a string."""
    return ' '.join(text.split()).replace(' ,', ',')

def save_progress(df: pd.DataFrame):
    """Helper function to save the current state of the DataFrame to the output file."""
    temp_df = df.reindex(columns=FINAL_COLUMN_ORDER)
    temp_df = temp_df.drop(columns=['Year_Int'], errors='ignore')
    temp_df.fillna('', inplace=True)
    temp_df.to_csv(OUTPUT_CSV, index=False, quoting=csv.QUOTE_MINIMAL)

def parse_course_html(html_content: str) -> dict:
    """Parses course HTML with robust logic for all fields."""
    details = {key: '' for key in SCRAPED_DATA_COLUMNS}
    extracted_fragments = []
    soup = BeautifulSoup(html_content, 'html.parser')

    h1 = soup.find('h1', id='course_preview_title')
    if not h1 or not h1.parent or h1.parent.name != 'p': return details

    h1_text = h1.get_text(strip=True)
    data_text = ' '.join(h1.parent.get_text(separator='---').strip().split('---'))
    data_text = clean_text(data_text.replace(h1_text, '', 1))
    original_data_text = data_text

    hours_match = re.match(r'([\d–-]+\s+hours?(\s*\([^)]+\))?)', data_text)
    if hours_match:
        hours_block = hours_match.group(0)
        extracted_fragments.append(hours_block)
        details['Hours'] = (re.search(r'[\d–-]+', hours_block) or pd.NA).group(0) or ''
        specific_match = re.search(r'\([^)]+\)', hours_block)
        if specific_match: details['Specific Hours'] = specific_match.group(0)
        data_text = data_text[hours_match.end():].strip()

    other_triggers = ['May be repeated', 'May only be taken', 'Not offered every term']
    stop_pattern = '|'.join(['Course specific fees'] + other_triggers)
    prereq_match = re.search(r'Prerequisite\(s\):', data_text, re.I)
    fees_match = re.search(r'Course specific fees', data_text, re.I)
    
    first_marker_pos = len(data_text)
    if prereq_match: first_marker_pos = min(first_marker_pos, prereq_match.start())
    if fees_match: first_marker_pos = min(first_marker_pos, fees_match.start())
    
    description_text = data_text[:first_marker_pos].strip()
    if description_text:
        details['Description'] = description_text
        extracted_fragments.append(description_text)

    if prereq_match:
        prereq_search_text = data_text[prereq_match.start():]
        prereq_block_match = re.search(f'Prerequisite\\(s\\):.*?(?=({stop_pattern}|$))', prereq_search_text, re.I | re.S)
        if prereq_block_match:
            prereq_full_block = prereq_block_match.group(0).strip()
            extracted_fragments.append(prereq_full_block)
            prereq_content = re.sub(r'Prerequisite\(s\):', '', prereq_full_block, flags=re.I).strip()
            if prereq_content.lower() not in ('none', 'none.'): details['Prerequisite(s)'] = prereq_content

    if fees_match:
        fees_search_text = data_text[fees_match.start():]
        fees_block_match = re.search(r'Course specific fees.*', fees_search_text, re.I | re.S)
        if fees_block_match:
            fees_full_block = fees_block_match.group(0).strip()
            extracted_fragments.append(fees_full_block)
            fees_content = re.sub(r'Course specific fees(?:.|\n)*?:\s*', '', fees_full_block, flags=re.I).strip()
            details['Course Fees'] = fees_content
    
    other_text = original_data_text
    for fragment in extracted_fragments:
        other_text = other_text.replace(fragment, '', 1).strip()
    details['Other'] = other_text
    
    for key, value in details.items():
        if isinstance(value, str): details[key] = clean_text(value)
    return details

async def fetch_and_parse(session: aiohttp.ClientSession, course: pd.Series, semaphore: asyncio.Semaphore) -> dict:
    """Acquires a semaphore slot, then performs a single fetch and parse."""
    # This will wait until a "pass" is available from the semaphore.
    async with semaphore:
        await asyncio.sleep(REQUEST_DELAY_SECONDS)
        async with session.get(course['Course Link'], headers=HEADERS, timeout=20) as response:
            response.raise_for_status()
            html = await response.text()
            return {'Catalog ID': course['Catalog ID'], **parse_course_html(html)}

async def safe_fetch_and_parse(session: aiohttp.ClientSession, course: pd.Series, semaphore: asyncio.Semaphore) -> dict:
    """Wrapper that catches exceptions from fetch_and_parse to prevent halting gather."""
    try:
        return await fetch_and_parse(session, course, semaphore)
    except Exception as e:
        return {'error': e, 'course_code': course['Course Code']}

async def main():
    """Main function to orchestrate the scraping process."""
    if not os.path.exists(INPUT_CSV):
        print(f"❌ Error: Input file '{INPUT_CSV}' not found.")
        return

    source_file_for_loop = OUTPUT_CSV if os.path.exists(OUTPUT_CSV) else INPUT_CSV
    overall_pbar = None
    if REPEAT_UNTIL_COMPLETE:
        temp_df = pd.read_csv(source_file_for_loop, dtype=str)
        if 'Course Scraped' not in temp_df.columns: temp_df['Course Scraped'] = 'False'
        temp_df['Course Scraped'] = temp_df['Course Scraped'].fillna('False').str.lower().isin(['true', '1', 't'])
        total_to_scrape = (~temp_df['Course Scraped']).sum()
        if total_to_scrape == 0:
            print("✅ All courses already marked as scraped.")
            return
        overall_pbar = tqdm(total=total_to_scrape, desc="Overall Progress", unit="course", smoothing=0)

    pass_num = 1
    main_loop_active = True
    # Create the semaphore to control concurrency
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    
    while main_loop_active:
        if pass_num == 1:
            source_file = INPUT_CSV
            print(f"--- Starting Pass 1: Reading from '{source_file}' ---")
        else:
            source_file = OUTPUT_CSV
            print(f"\n--- Starting Pass {pass_num}: Reading from '{source_file}' to continue progress ---")
        
        if not os.path.exists(source_file):
            print(f"❌ Error: Source file '{source_file}' not found. Halting.")
            break
            
        df = pd.read_csv(source_file, dtype=str)
        if 'Course Scraped' not in df.columns: df['Course Scraped'] = 'False'
        for col in SCRAPED_DATA_COLUMNS:
            if col not in df.columns: df[col] = ''
        df['Course Scraped'] = df['Course Scraped'].fillna('False').str.lower().isin(['true', '1', 't'])
        df['Year_Int'] = pd.to_numeric(df['Year'].str.split('-').str[0], errors='coerce')

        unscraped_df = df[~df['Course Scraped']].copy()
        unscraped_df.dropna(subset=['Year_Int', 'Group ID'], inplace=True)

        if unscraped_df.empty:
            if pass_num == 1: print("\n✅ No unscraped courses found to process.")
            else: print("\n✅ All available courses have been scraped.")
            break
        
        pass_courses_to_scrape = df.loc[unscraped_df.groupby('Group ID')['Year_Int'].idxmax()].index
        pass_desc = f"Pass {pass_num}" if REPEAT_UNTIL_COMPLETE else "Scraping Courses"
        scraped_since_last_save = 0
        
        async with aiohttp.ClientSession() as session:
            while not pass_courses_to_scrape.empty:
                # Pass the semaphore to each task
                tasks = [safe_fetch_and_parse(session, df.loc[idx], semaphore) for idx in pass_courses_to_scrape]
                results = await async_tqdm.gather(*tasks, desc=pass_desc, unit="course")

                successful_indices = []
                failed_indices = []

                for i, res in enumerate(results):
                    original_df_index = pass_courses_to_scrape[i]
                    if 'error' in res:
                        failed_indices.append(original_df_index)
                        tqdm.write(f"⚠️ Request for {res['course_code']} failed. Reason: {res['error'].__class__.__name__}")
                    else:
                        successful_indices.append(original_df_index)
                        idx = df[df['Catalog ID'] == res['Catalog ID']].index
                        if not idx.empty:
                            for key, value in res.items():
                                if key in df.columns: df.loc[idx, key] = value
                            df.loc[idx, 'Course Scraped'] = True
                        scraped_since_last_save += 1
                
                if overall_pbar is not None:
                    overall_pbar.update(len(successful_indices))
                
                if scraped_since_last_save >= SAVE_FREQUENCY:
                    save_progress(df)
                    print(f"💾 Progress saved. {scraped_since_last_save} courses since last save.")
                    scraped_since_last_save = 0

                pass_courses_to_scrape = pd.Index(failed_indices)

                if not pass_courses_to_scrape.empty:
                    print(f"Encountered {len(failed_indices)} errors. Pausing for {RETRY_PAUSE_SECONDS}s before retrying...")
                    await asyncio.sleep(RETRY_PAUSE_SECONDS)

        save_progress(df)
        print(f"💾 Pass {pass_num} complete. Final progress saved to '{OUTPUT_CSV}'.")

        if not REPEAT_UNTIL_COMPLETE:
            main_loop_active = False
        pass_num += 1

    if overall_pbar is not None:
        overall_pbar.close()
        print("\n🎉 Full scraping process complete.")

if __name__ == '__main__':
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())