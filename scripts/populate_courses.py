from datafetching.courses import get_all_courses, get_courses_on_page
from db.connection import Session
from db.models import Course
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)

session = Session()

def get_course_from_db(subject, num) -> Course:
    course = session.query(Course).filter_by(subject=subject, num=num).first()
    return course

# Fetch all courses offered from GW's course bulletin page
courses = get_all_courses()

# Commit courses by either updating existing rows or creating new ones
print('Updating existing courses...')
for course in courses:
    db_course = get_course_from_db(course.subject, course.num)
    if db_course is not None:
        # Update the course, comments, and credits values
        # Leave prereqs blank, as those are filled in manually
        db_course.course = course.course
        db_course.comments = course.comments
        db_course.credits = course.credits
    else:
        # If not already in db, add as a new course
        session.add(course)

# Commit changes to db
print('Commiting changes to db...')
session.commit()