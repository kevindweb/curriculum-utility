package models

import "gopkg.in/guregu/null.v4"

// Course defines a course at GW
type Course struct {
	Subject  string      `gorm:"primaryKey;size:16" json:"subject"`
	Num      string      `gorm:"primaryKey;size:16" json:"num"`
	Course   string      `json:"course"`
	Comments string      `json:"comments"`
	Credits  int         `json:"credits"`
	Prereqs  null.String `gorm:"type:JSON NULL"`
}

// CourseExcel defines the mapping of the excel sheet to a course
type CourseExcel struct {
	Subject  string `xlsx:"2"`
	Num      string `xlsx:"3"`
	Course   string `xlsx:"5"`
	Comments string `xlsx:"33"`
}

// ToCourse converts this CourseExcel struct to a Course
func (excel CourseExcel) ToCourse() Course {
	var course Course
	course.Subject = excel.Subject
	course.Num = excel.Num
	course.Course = excel.Course
	course.Comments = excel.Comments
	return course
}
