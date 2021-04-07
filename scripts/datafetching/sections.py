import requests
from bs4 import BeautifulSoup
from db.connection import Session
from db.models import Section, Course
import logging

session = Session()

def parse_time_string(time_str: str) -> str:
    am_pm = time_str[-2:]
    hour_min = time_str[:-2].split(':')

    hour = int(hour_min[0])
    minute = int(hour_min[1])

    if am_pm.upper() == 'PM' and hour < 12:
        hour += 12
    
    return f'{hour:02d}{minute:02d}'

def get_sections_on_page(url: str, term: str, year: str, pageNum: int):
    print(f'{"  " * (pageNum - 1)}Getting sections at {url} page {pageNum}...')
    # Load the HTML document into BeautifulSoup
    form_data = {
        'pageNum': pageNum
    }
    r = requests.post(url, data=form_data)
    soup = BeautifulSoup(r.text, 'html.parser')
    
    sections = []

    # Get the schedule table
    sched_table = soup.find('table', 'scheduleTable')

    # Get all course listings in the table
    course_tables = sched_table.find_all('table', 'courseListing')

    # For each course listing, parse the section
    for course_table in course_tables:
        try:
            # Get the main section row
            row = course_table.find('tr', 'crseRow1')
            # Get the columns in this row
            cols = row.find_all('td')

            # Get the crn for this section
            crn = cols[1].string.strip()

            # Get the course for this section
            course_strings = []
            for string in cols[2].strings:
                if string.strip() != '':
                    course_strings.append(string.strip())
            
            subject = course_strings[0]
            num = course_strings[1]

            # Check that this course is in the database
            course = session.query(Course).filter_by(subject=subject, num=num).first()
            if course is None:
                logging.error(f'{subject, num} is not in the database')
                continue

            # Get the section number
            sect = cols[3].string.strip()

            # Get the credit hours
            credits = int(float(cols[5].string.strip()))

            # Get the instructor
            instructor = cols[6].string.strip()

            # Get the day, start, and end times
            day_time_strings = []
            for string in cols[8].strings:
                if string.strip() != '':
                    day_time_strings.append(string.strip())
            
            if len(day_time_strings) >= 2:
                day = day_time_strings[0]
                time_string = day_time_strings[1]
                start_end_times = time_string.split(' - ')
                
                start_time = parse_time_string(start_end_times[0])
                end_time = parse_time_string(start_end_times[1])
            else:
                day = ''
                start_time = ''
                end_time = ''

            sections.append(Section(
                course_subject=subject,
                course_num=num,
                room_name='', # TODO: Empty room name
                prof_gw_id='', # TODO: Empty prof_gw_id
                prof_name=instructor,
                semester_term=term,
                semester_year=year,
                crn=crn,
                section=sect,
                credit_hour=credits,
                section_type='Lecture - L',
                day=day,
                start=start_time,
                end=end_time,
                max_enrollment=30 # TODO: Default max enrollment
            ))
        
        except:
            continue
    
    next_page_link = soup.find('a', text='Next Page >> ')
    if next_page_link is not None:
        sections.extend(get_sections_on_page(url, term, year, pageNum + 1))
    
    return sections

def get_all_sections_for_semester(url, term, year):
    # Load the HTML document into BeautifulSoup
    r = requests.get(url)
    soup = BeautifulSoup(r.text, 'html.parser')
    
    sections = []

    # Get subjects div
    subjects_div = soup.find('div', 'subjectsMain')

    # Get the first set of columns
    subject_cols = subjects_div.find('div', 'grid grid-show3')
    
    # Find all links in this div
    subject_links = subject_cols.find_all('a')

    # Get all url's in this list
    for link in subject_links:
        href = link.get('href')
        subject_url = f'https://my.gwu.edu/mod/pws/{href}'
        new_sections = get_sections_on_page(subject_url, term, year, 1)
        sections.extend(new_sections)
    
    return sections