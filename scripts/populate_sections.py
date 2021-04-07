from datafetching.sections import get_all_sections_for_semester, get_sections_on_page
from db.connection import Session
from db.models import Section
import logging

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)

session = Session()
sections = get_all_sections_for_semester('https://my.gwu.edu/mod/pws/subjects.cfm?campId=7&termId=202101', 'Spring', '2021')
# sections = get_sections_on_page('https://my.gwu.edu/mod/pws/courses.cfm?campId=1&termId=202103&subjId=CSCI', 'Fall', '2020', 1)
print('Checking for duplicate crns in database...')
for section in sections:
    # Check if this crn already exists, if it does not, create new section
    existing_sec = session.query(Section).filter_by(crn=section.crn).first()
    if existing_sec is None:
        session.add(section)
    else:
        logging.error(f'CRN {section.crn} already exists in DB; skipping...')

print('Committing sections to database...')
# Commit new sections
session.commit()
print('Done.')