from datafetching.prereqs import get_prereqs_for_course, get_subject_codes, get_last_three_terms
import json
from db.connection import Session
from db.models import Course
import logging

logging.basicConfig(filename='prereq.log', level=logging.DEBUG)

# Get all courses in the database
session = Session()
all_courses = session.query(Course).all()

# Get term codes for Fall, Spring, and Summer
terms = get_last_three_terms()

# Fetch prereqs for each course
for course in all_courses:
    try:
        prereqs = get_prereqs_for_course(course.subject, course.num, terms)
        course.prereqs = prereqs
    except Exception as e:
        logging.error(e)

session.commit()
