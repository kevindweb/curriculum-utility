from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, VARCHAR, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship

Base = declarative_base()

class Course(Base):
    """Database model for a Course record"""
    __tablename__ = 'courses'

    subject = Column(VARCHAR(16), primary_key=True)
    num = Column(VARCHAR(16), primary_key=True)
    course = Column(String)
    comments = Column(String)
    prereqs = Column(JSON(none_as_null=True))
    credits = Column(Integer)

    def __repr__(self):
        return f'<Course(subject={self.subject}, num={self.num}, course={self.course}, comments={self.comments}, credits={self.credits})>'

class Professor(Base):
    """Database model for a Professor record"""
    __tablename__ = 'profs'

    gw_id = Column(VARCHAR(9), primary_key=True)
    name = Column(String)
    email = Column(String)

class Room(Base):
    """Database model for a Room record"""
    __tablename__ = 'rooms'

    name = Column(VARCHAR(256), primary_key=True)
    building = Column(String)
    campus = Column(String)

class Semester(Base):
    """Database model for a Semester record"""
    __tablename__ = 'semesters'

    term = Column(VARCHAR(16), primary_key=True)
    year = Column(VARCHAR(16), primary_key=True)
    is_current = Column(Integer)

class Section(Base):
    """Database model for a Section record"""
    __tablename__ = 'sections'

    id = Column(Integer, primary_key=True)
    course_subject = Column(VARCHAR(16), ForeignKey('courses.subject'))
    course_num = Column(VARCHAR(16), ForeignKey('courses.num'))
    room_name = Column(VARCHAR(256), ForeignKey('rooms.name'))
    prof_gw_id = Column(VARCHAR(9), ForeignKey('profs.gw_id'))
    prof_name = Column(String)
    semester_term = Column(VARCHAR(16), ForeignKey('semesters.term'))
    semester_year = Column(VARCHAR(16), ForeignKey('semesters.year'))
    crn = Column(String)
    section = Column(String)
    credit_hour = Column(Integer)
    section_type = Column('type', String)
    day = Column(String)
    start = Column(String)
    end = Column(String)
    max_enrollment = Column(Integer)

class Curriculum(Base):
    """Database model for a Curriculum record"""
    __tablename__ = 'curriculums'

    id = Column(Integer, primary_key=True)
    major = Column(String)
    semester_term = Column(VARCHAR(16), ForeignKey('semesters.term'))
    semester_year = Column(VARCHAR(16), ForeignKey('semesters.year'))

class ElectiveType(Base):
    """Database model for an Elective Type record"""
    __tablename__ = 'elective_types'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    curriculum_id = Column(Integer, ForeignKey('curriculums.id'))

class Elective(Base):
    """Database model for an Elective Course record"""
    __tablename__ = 'electives'

    id = Column(Integer, primary_key=True)
    elective_type_id = Column(Integer, ForeignKey('elective_types.id'))
    course_subject = Column(VARCHAR(16), ForeignKey('courses.subject'))
    course_num = Column(VARCHAR(16), ForeignKey('courses.num'))