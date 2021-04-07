from collections import deque
import json
from db.connection import Session
from db.models import Course
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)

session = Session()

def is_course_in_db(subject, num):
    course = session.query(Course).filter_by(subject=subject, num=num).first()
    return course is not None

def print_prereq_dict(prereq_dict, current_node, indent):
    if prereq_dict['type'] == 'COURSE':
        print(f'{" " * indent}{prereq_dict["subject"]} {prereq_dict["num"]}')
    else:
        print(f'{" " * indent}{prereq_dict["type"]} ↴')
        for node in prereq_dict['members']:
            print_prereq_dict(node, current_node, indent+4)
        
        if current_node == prereq_dict:
            print(f'{" " * (indent+4)}Currently editing...')

# Initialize our prereq data structures
while True:
    prereq_dict = {}
    node_queue = deque()
    node_queue.append(prereq_dict)

    valid_course = False
    course_subject = ''
    course_num = ''
    while not valid_course:
        print('Which course is this for?')
        course_subject = input('Enter course subject code: ')
        course_num = input('Enter course num: ')

        course_subject = course_subject.strip().upper()
        course_num = course_num.strip().upper()

        valid_course = is_course_in_db(course_subject, course_num)
        if not valid_course:
            print(f'ERROR: {course_subject} {course_num} does not exist in the database.')

    while len(node_queue) > 0:
        # Use the stack to get the current node we are editing
        current_node = node_queue[-1]

        node_type = ''
        valid_node_type_inputs = ['course', '1', 'and', '2', 'or', '3']
        while node_type not in valid_node_type_inputs:
            node_type = input('Is this a COURSE node [1], an AND node [2], or an OR node [3]?: ')
            node_type = node_type.strip().lower()
            if node_type not in valid_node_type_inputs:
                print('Invalid input')

        if node_type == 'course' or node_type == '1':
            valid_course = False
            while not valid_course:
                subject = input('Enter course subject code: ')
                num = input('Enter course num: ')
                
                subject = subject.strip().upper()
                num = num.strip().upper()
                
                valid_course = is_course_in_db(subject, num)
                if not valid_course:
                    print(f'ERROR: {subject} {num} does not exist in the database.')

            if not prereq_dict:
                current_node['type'] = 'COURSE'
                current_node['subject'] = subject
                current_node['num'] = num
                node_queue.pop()
            else:
                new_node = {
                    'type': 'COURSE',
                    'subject': subject,
                    'num': num
                }
                current_node['members'].append(new_node)
        elif node_type == 'and' or node_type == '2':
            if not prereq_dict:
                current_node['type'] = 'AND'
                current_node['members'] = []
            else:
                new_node = {
                    'type': 'AND',
                    'members': []
                }
                current_node['members'].append(new_node)
                node_queue.append(new_node)
        elif node_type == 'or' or node_type == '3':
            if not prereq_dict:
                current_node['type'] = 'OR'
                current_node['members'] = []
            else:
                new_node = {
                    'type': 'OR',
                    'members': []
                }
                current_node['members'].append(new_node)
                node_queue.append(new_node)

        continue_adding = 'n'
        while len(node_queue) > 0 and continue_adding == 'n':
            print_prereq_dict(prereq_dict, node_queue[-1], 0)
            # print(f'Current node being edited: {json.dumps(current_node, indent=4)}')
            if len(node_queue[-1]['members']) > 1:
                continue_adding = input('Continue adding to current node? [y/n]: ')
                continue_adding = continue_adding.strip().lower()
                if continue_adding == 'no' or continue_adding == 'n':
                    node_queue.pop()
            else:
                continue_adding = 'y'

    print(f'Final prereq json:\n{json.dumps(prereq_dict, indent=4)}')
    add_prereqs = input(f'Add this prereq json to {course_subject} {course_num}? [y/n]: ')
    if add_prereqs == 'y' or add_prereqs == 'yes':
        course = session.query(Course).filter_by(subject=course_subject, num=course_num).first()
        course.prereqs = prereq_dict
        session.commit()
        print('Done.\n')