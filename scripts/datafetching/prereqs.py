import requests
from bs4 import BeautifulSoup
from collections import deque
from .banweb import COOKIES
import json
import logging

subject_codes = {
    'Academy for Classical Acting': 'ACA',
    'Accountancy': 'ACCY',
    'Africana Studies': 'AFST',
    'American Studies': 'AMST',
    'Anatomy and Regenerative Biology': 'ANAT',
    'Anthropology': 'ANTH',
    'Applied Science': 'APSC',
    'Arabic': 'ARAB',
    'Art History': 'AH',
    'Art Therapy': 'ARTH',
    'Astronomy': 'ASTR',
    'Biochemistry': 'BIOC',
    'Biological Sciences': 'BISC',
    'Biomedical Engineering': 'BME',
    'Biomedical Sciences': 'BMSC',
    'Biostatistics': 'BIOS',
    'Business Administration': 'BADM',
    'Cancer Biology': 'CANC',
    'Capital Markets': 'CAMA',
    'Chemistry': 'CHEM',
    'Chinese': 'CHIN',
    'Civil Engineering': 'CE',
    'Classical Studies': 'CLAS',
    'Clinical Embryology and Reproductive Technology': 'CERT',
    'Clinical Management and Leadership': 'CML',
    'Clinical Operations and Healthcare Management': 'COHM',
    'Clinical Research Admin': 'CRA',
    'Clinical Translational Science': 'CTS',
    'College of Professional Studies': 'CPS',
    'Columbian College': 'CCAS',
    'Communication': 'COMM',
    'Computer Science': 'CSCI',
    'Corcoran Art History': 'CAH',
    'Corcoran Continuing Education': 'CCE',
    'Corcoran Decorative Arts and Design': 'CDAD',
    'Corcoran Exhibition Design': 'CEX',
    'Corcoran First Year Foundation': 'CFN',
    'Corcoran Graphic Design': 'CGD',
    'Corcoran Interaction Design': 'CIXD',
    'Corcoran Interior Architecture': 'CIAR',
    'Corcoran Museum Studies': 'CMST',
    'Corcoran Music': 'MUS',
    'Corcoran Photojournalism': 'CPJ',
    'Corcoran Studio Arts': 'CSA',
    'Corcoran Theatre and Dance': 'TRDA',
    'Correctional Health Administration': 'CHA',
    'Counseling': 'CNSL',
    'Curriculum and Pedagogy': 'CPED',
    'Data Science': 'DATS',
    'Decision Sciences': 'DNSC',
    'East Asian Language and Literature': 'EALL',
    'Economics': 'ECON',
    'Educational Leadership': 'EDUC',
    'Electrical and Computer Engineering': 'ECE',
    'Emergency Health Services': 'EHS',
    'Engr Mgt & Systems Engineering': 'EMSE',
    'English': 'ENGL',
    'English for Academic Purposes': 'EAP',
    'Environmental Resource Policy': 'ENRP',
    'Environmental Studies': 'ENVR',
    'Epidemiology': 'EPID',
    'Exercise and Nutrition Sciences': 'EXNS',
    'Film Studies': 'FILM',
    'Finance': 'FINA',
    'Forensic Psychology': 'FORP',
    'Forensic Sciences': 'FORS',
    'French': 'FREN',
    'Genomics and Bioinformatics': 'GENO',
    'Geography': 'GEOG',
    'Geology': 'GEOL',
    'Germanic Language and Literature': 'GER',
    'Government Contracts': 'GCON',
    'Greek': 'GREK',
    'GWTeach': 'GTCH',
    'Health and Wellness': 'HLWL',
    'Health Care Quality': 'HCQ',
    'Health Care Science': 'HCS',
    'Health Sciences Programs': 'HSCI',
    'Health Services Management and Leadership': 'HSML',
    'Hebrew': 'HEBR',
    'History': 'HIST',
    'Hominid Paleobiology': 'HOMP',
    'Honors': 'HONR',
    'Human Development': 'HDEV',
    'Human Organizational Learning': 'HOL',
    'Human Services and Social Justice': 'HSSJ',
    'Informatics': 'INFR',
    'Information Systems Technology Management': 'ISTM',
    'Integrative Medicine': 'INTM',
    'Interior Architecture': 'IA',
    'International Affairs': 'IAFF',
    'International Business': 'IBUS',
    'Italian': 'ITAL',
    'Japanese': 'JAPN',
    'Judaic Studies': 'JSTD',
    'Korean': 'KOR',
    'Latin': 'LATN',
    'Leadership Education and Development': 'LEAD',
    'Legislative Affairs': 'LGAF',
    'Lifestyle, Sport, and Physical Activity': 'LSPA',
    'Linguistics': 'LING',
    'Management': 'MGT',
    'Marketing': 'MKTG',
    'Master of Business Administration': 'MBAD',
    'Mathematics': 'MATH',
    'Mechanical and Aerospace Engineering': 'MAE',
    'Medical Laboratory Science': 'MLS',
    'Microbiology, Immunology, and Tropical Medicine': 'MICR',
    'Molecular Medicine': 'MMED',
    'Naval Science': 'NSC',
    'Nursing': 'NURS',
    'Occupational Therapy': 'OT',
    'Organizational Sciences': 'ORSC',
    'Patent Practice': 'PATN',
    'Peace Studies': 'PSTD',
    'Persian': 'PERS',
    'Pharmacogenomics': 'PHRG',
    'Pharmacology': 'PHAR',
    'Philosophy': 'PHIL',
    'Physical Therapy': 'PT',
    'Physician Assistant': 'PA',
    'Physics': 'PHYS',
    'Physiology': 'PHYL',
    'Political Management': 'PMGT',
    'Political Psychology': 'PPSY',
    'Political Science': 'PSC',
    'Portuguese': 'PORT',
    'Professional Psychology': 'PSYD',
    'Professional Studies-\u200bAdvocacy Global Environment': 'PSAD',
    'Professional Studies-\u200bCybersecurity Strategy and Information Management': 'PSCS',
    'Professional Studies-\u200bHealthcare Corporate Compliance': 'PSHC',
    'Professional Studies-\u200bHomeland Security': 'PSHS',
    'Professional Studies-\u200bIntegrated Information, Science, and Technology': 'PSIS',
    'Professional Studies-\u200bLandscape Design': 'PSLD',
    'Professional Studies-\u200bLaw Firm Management': 'PSLM',
    'Professional Studies-\u200bMolecular Biology': 'PSMB',
    'Professional Studies-\u200bParalegal Studies': 'PSLX',
    'Professional Studies-\u200bPublic Leadership': 'PSPL',
    'Professional Studies-\u200bPublic Relations': 'PSPR',
    'Professional Studies-\u200bPublishing': 'PSPB',
    'Professional Studies Security and Safety Leadership': 'PSSL',
    'Professional Studies-\u200bUrban Sustainability': 'PSUS',
    'Psychology': 'PSYC',
    'Public Health': 'PUBH',
    'Public Policy and Public Admin': 'PPPA',
    'Regulatory Affairs': 'RAFF',
    'Religion': 'REL',
    'School of Education and Human Development': 'SEHD',
    'School of Engineering and Applied Science': 'SEAS',
    'School of Media and Public Affairs': 'SMPA',
    'Slavic Languages and Literature': 'SLAV',
    'Sociology': 'SOC',
    'Spanish': 'SPAN',
    'Special Education': 'SPED',
    'Speech and Hearing Science': 'SPHR',
    'Speech, Language, and Hearing Science': 'SLHS',
    'Statistics': 'STAT',
    'Strategic Management and Public Policy': 'SMPP',
    'Sustainability': 'SUST',
    'Tourism Studies': 'TSTD',
    'Translational Health Sciences': 'THS',
    'Turkish': 'TURK',
    'University Courses': 'UNIV',
    'University Writing': 'UW',
    'Vietnamese': 'VIET',
    'Women and Leadership Program': 'WLP',
    'Women\'s, Gender, and Sexuality Studies': 'WGSS',
    'Yiddish': 'YDSH'
}

def get_subject_codes():
    # Load the HTML document into BeautifulSoup
    r = requests.get('http://bulletin.gwu.edu/courses/')
    soup = BeautifulSoup(r.text, 'html.parser')

    # Get the active 'courses' tab
    courses_tab = soup.find('li', 'active self')
    # Get the list of subjects
    subject_list = courses_tab.find('ul', 'nav levelone')
    # Get all link elements in this list
    subject_links = subject_list.find_all('a')

    # For each link, parse the subject and subject code
    subject_codes = {}
    for link in subject_links:
        link_text = link.string.strip()
        subject_split = link_text.split('(')
        subject_name = subject_split[0].strip()
        subject_code = subject_split[1].strip()[:-1]
        subject_codes[subject_name] = subject_code
    
    return subject_codes

def get_last_three_terms():
    params = (
        ('searchTerm', ''),
        ('offset', '1'),
        ('max', '3'),
        ('_', '1614642536554'),
    )

    r = requests.get('https://bssoweb.gwu.edu:8002/StudentRegistrationSsb/ssb/courseSearch/getTerms', params=params, cookies=COOKIES)
    if r.status_code == 200:
        return json.loads(r.text)
    else:
        raise Exception('Error fetching terms.')


def get_prereqs_for_course(subject, num, terms):
    print(f'Getting prereqs for {subject} {num}')

    # Load the HTML document into BeautifulSoup
    for term in terms:
        data = {
            'term': term['code'],
            'subjectCode': subject,
            'courseNumber': num
        }

        r = requests.post('https://bssoweb.gwu.edu:8002/StudentRegistrationSsb/ssb/courseSearchResults/getPrerequisites', cookies=COOKIES, data=data)
        if r.status_code == 500:
            continue

        soup = BeautifulSoup(r.text, 'html.parser')

        # Get the table rows for prereqs
        table = soup.find('tbody')
        if table == None:
            return None
        
        rows = table.find_all('tr')
        
        # Use values from each table row to form prereq json structure
        prereq_dict = None
        stack = deque()
        for row in rows:
            cols = row.find_all('td')

            and_or = cols[0].string
            bracket1 = cols[1].string

            subject_long = cols[4].string
            if subject_long in subject_codes:
                subject = subject_codes[subject_long]
            else:
                raise Exception(f'Subject {subject_long} not found in subject codes.')

            num = cols[5].string
            bracket2 = cols[8].string

            if prereq_dict == None:
                if bracket1 is None:
                    prereq_dict = {
                        'type': 'NONE',
                        'members': [
                            {
                                'type': 'COURSE',
                                'subject': subject,
                                'num': num
                            }
                        ]
                    }
                    stack.append(prereq_dict)
                else:
                    prereq_dict = {
                        'type': 'NONE',
                        'members': [
                            {
                                'type': 'NONE',
                                'members': [
                                    {
                                        'type': 'COURSE',
                                        'subject': subject,
                                        'num': num
                                    }
                                ]
                            }
                        ]
                    }
                    stack.append(prereq_dict)
                    stack.append(prereq_dict['members'][0])
            else:
                if stack[-1]['type'] == 'NONE':
                    stack[-1]['type'] = and_or.upper()
                if bracket1 == '(':
                    new_node = {
                        'type': 'NONE',
                        'members': [
                            {
                                'type': 'COURSE',
                                'subject': subject,
                                'num': num
                            }
                        ]
                    }
                    stack[-1]['members'].append(new_node)
                    stack.append(new_node)
                else:
                    stack[-1]['members'].append({
                        'type': 'COURSE',
                        'subject': subject,
                        'num': num
                    });
                
                if bracket2 == ')':
                    stack.pop()
        
        if prereq_dict['type'] == 'NONE':
            prereq_dict = prereq_dict['members'][0]

        return prereq_dict
    
    return None
    
