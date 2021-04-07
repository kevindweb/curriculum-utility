package models

import "gopkg.in/guregu/null.v4"

type PlannedCourse struct {
	ID uint

	UserID string `gorm:"size:256"`
	User   User

	CurriculumReqsID uint
	CurriculumReqs   CurriculumReqs

	CourseSubject string
	CourseNum     string
	Course        Course

	Semester null.Int
}
