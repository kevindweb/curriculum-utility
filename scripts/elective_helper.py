from collections import deque
import json
from db.connection import Session
from db.models import Course, Curriculum, ElectiveType, Elective
import logging
import sys

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)

session = Session()

def is_course_in_db(subject, num):
    course = session.query(Course).filter_by(subject=subject, num=num).first()
    return course is not None

def is_subject_in_db(subject):
    course = session.query(Course).filter_by(subject=subject).first()
    return course is not None

def is_elective_in_db(subject, num, elective_type_id):
    elective = session.query(Elective).filter_by(
        course_subject=subject,
        course_num=num,
        elective_type_id=elective_type_id
    ).first()
    return elective is not None

# Get list of curriculums
curriculums = session.query(Curriculum).all()

# Prompt user for curriculum
curriculum = None
while curriculum is None:
    # Print all curriculums available
    print('Curriculums in database:')
    for i in range(len(curriculums)):
        print(f'[{i+1}]: {curriculums[i].major} {curriculums[i].semester_term} {curriculums[i].semester_year}')
    
    try:
        curr_index = int(input('Which curriculum is this for?: ')) - 1
    except ValueError:
        print('ERROR: Invalid input')
        continue
    except KeyboardInterrupt:
        sys.exit()

    if curr_index < 0 or curr_index >= len(curriculums):
        print(f'ERROR: Please choose a curriculum from 1 to {len(curriculums)}')
        continue

    curriculum = curriculums[curr_index]

# Get list of elective types for this curriculum
elective_types = session.query(ElectiveType).\
    filter(ElectiveType.curriculum_id==curriculum.id).\
    filter(ElectiveType.name!='NONE').all()

# Prompt user for elective type
elective_type = None
while elective_type is None:
    # Print all elective types available
    print(f'\nElective Types for {curriculum.major} {curriculum.semester_term} {curriculum.semester_year}:')
    for i in range(len(elective_types)):
        print(f'[{i+1}]: {elective_types[i].name}')
    
    try:
        elec_index = int(input('Which elective type is this for?: ')) - 1
    except ValueError:
        print('ERROR: Invalid input')
        continue
    except KeyboardInterrupt:
        sys.exit()

    if elec_index < 0 or elec_index >= len(elective_types):
        print(f'ERROR: Please choose an elective type from 1 to {len(elective_types)}')
        continue

    elective_type = elective_types[elec_index]

while True:
    # Prompt user for elective to add
    valid_course = False
    course_subject = ''
    course_num = ''
    while not valid_course:
        print(f'\nWhich course are you adding to {elective_type.name}?')
        try:
            course_str = input('Enter course code: ')
            course_split = course_str.split()
            if len(course_split) != 2:
                print('ERROR: Enter both the course subject and course num.')
                continue

            course_subject = course_split[0]
            course_num = course_split[1]
        except KeyboardInterrupt:
            sys.exit()

        course_subject = course_subject.strip().upper()
        course_num = course_num.strip().upper()

        if course_num != 'ALL':
            if not is_course_in_db(course_subject, course_num):
                print(f'ERROR: {course_subject} {course_num} does not exist in the database.')
                continue
        
            if is_elective_in_db(course_subject, course_num, elective_type.id):
                print(f'{course_subject} {course_num} is already an elective for {elective_type.name}.')
                continue
        else:
            if not is_subject_in_db(course_subject):
                print(f'ERROR: No courses with subject {course_subject} exist in the database.')
                continue

        valid_course = True
    
    if course_num != 'ALL':
        new_elective = Elective(
            elective_type_id=elective_type.id,
            course_subject=course_subject,
            course_num=course_num
        )

        session.add(new_elective)
        session.commit()
        print('\nSuccesfully added elective.')
    else:
        new_electives = []
        # Fetch all courses for the given subject
        subject_courses = session.query(Course).filter_by(subject=course_subject).all()
        num_added = 0
        for course in subject_courses:
            if not is_elective_in_db(course.subject, course.num, elective_type.id):
                new_electives.append(Elective(
                    elective_type_id=elective_type.id,
                    course_subject=course.subject,
                    course_num=course.num
                ))
                num_added += 1
        
        if num_added != 0:
            session.add_all(new_electives)
            session.commit()
            print(f'\nSuccesfully added {num_added} {course_subject} electives.')
        else:
            print(f'\nAll {course_subject} courses are already electives for {elective_type.name}.')