import requests
from bs4 import BeautifulSoup
from db.models import Course

def get_courses_on_page(url):
    # Load the HTML document into BeautifulSoup
    r = requests.get(url)
    soup = BeautifulSoup(r.text, 'html.parser')

    courses = []

    # Get all "courseblock" divs
    courseblocks = soup.find_all('div', 'courseblock')
    for courseblock in courseblocks:
        # Get the title and description elements for each courseblock
        title_el = courseblock.find('p', 'courseblocktitle')
        desc_el = courseblock.find('p', 'courseblockdesc')

        # Split the title string to get the course code, name, and credits
        course_title_split = title_el.string.split('.')
        course_code_split = course_title_split[0].split('\xa0')
        course_credits_split = course_title_split[2].split()
        
        course_subject = course_code_split[0]
        course_num = course_code_split[1]
        course_name = course_title_split[1].strip()
        try:
            course_credits = int(course_credits_split[0])
        except:
            course_credits = 0
        
        # Get the course description if it is provided
        if len(desc_el.contents) == 0:
            course_comments = None
        else:
            course_comments = ''
            for string in desc_el.strings:
                course_comments += string
            course_comments = course_comments.strip()
            course_comments = course_comments.replace('\xa0', ' ')
        
        courses.append(Course(
            subject=course_subject,
            num=course_num,
            course=course_name,
            comments=course_comments,
            credits=course_credits
        ))

    return courses

def get_all_courses():
    # Load the GW A-Z course page
    r = requests.get('http://bulletin.gwu.edu/courses/')
    soup = BeautifulSoup(r.text, 'html.parser')

    urls = []
    courses = []

    # Find the active 'courses' tab
    courses_tab = soup.find('li', 'active self')
    # Get all course tabs in this list
    course_list = courses_tab.find('ul', 'nav levelone')
    # Get all url's in this list
    course_links = course_list.find_all('a')
    for link in course_links:
        href = link.get('href')
        full_url = f'http://bulletin.gwu.edu{href}'
        urls.append(full_url)
    
    # Get all courses for each url
    for i in range(len(urls)):
        url = urls[i]
        print(f'Getting courses at {url}... {i+1}/{len(urls)}')
        new_courses = get_courses_on_page(url)
        courses.extend(new_courses)
    
    return courses