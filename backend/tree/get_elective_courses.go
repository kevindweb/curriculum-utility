package tree

import (
	"curriculum-utility/db"
	"curriculum-utility/models"
	"fmt"
)

type retCourse struct {
	subject    string
	num        string
	course     string
	cred       int
	acceptable []int
}

func GetElectiveCoursesForReq(curriculumReqID uint) ([]models.Course, error) {
	// Get the curriculum requirement first
	var req models.CurriculumReqs
	result := db.GORM.First(&req, curriculumReqID)
	if result.Error != nil {
		return nil, result.Error
	}

	if !req.IsElective {
		return nil, fmt.Errorf("Curriculum requirement with id %d is not an elective", curriculumReqID)
	}

	// Get all electives for the curriculum requirement's elective type
	var electives []models.Elective
	result = db.GORM.Where("elective_type_id = ?", req.ElectiveTypeID).Find(&electives)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the courses for these electives
	var courses []models.Course
	err := db.GORM.Model(&electives).Where(
		// Ensure only courses with sections are provided
		"exists (select * from sections where sections.course_subject = courses.subject and sections.course_num = courses.num)",
	).Association("Course").Find(&courses)
	if err != nil {
		return nil, err
	}

	return courses, nil
}

func GetElectiveCoursesForReqZach(curriculumReqID uint) ([]retCourse, error) {
	// Get the curriculum requirement first

	var req models.CurriculumReqs
	var courses []retCourse
	result := db.GORM.First(&req, curriculumReqID)
	if result.Error != nil {
		return nil, result.Error
	}

	if !req.IsElective {
		return nil, fmt.Errorf("Curriculum requirement with id %d is not an elective", curriculumReqID)
	}

	// Get all electives for the curriculum requirement's elective type
	var electives []models.Elective
	result = db.GORM.Where("elective_type_id = ?", req.ElectiveTypeID).Find(&electives)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the courses for these electives
	var coursesFROMDB []models.Course
	err := db.GORM.Model(&electives).Where(
		// Ensure only courses with sections are provided
		"exists (select * from sections where sections.course_subject = courses.subject and sections.course_num = courses.num)",
	).Association("Course").Find(&coursesFROMDB)
	if err != nil {
		return nil, err
	}

	for j := 0; j < len(coursesFROMDB); j++ {
		var thisCourse retCourse
		thisCourse.subject = coursesFROMDB[j].Subject
		thisCourse.num = coursesFROMDB[j].Num
		thisCourse.course = coursesFROMDB[j].Course

		var creditHours models.Section
		db.GORM.First(&creditHours, "course_subject = ? AND course_num = ?", coursesFROMDB[j].Subject, coursesFROMDB[j].Num)

		thisCourse.cred = creditHours.CreditHour

		courses = append(courses, thisCourse)
	}

	return courses, nil
}
