package models

type ReportCard struct {
	ID uint

	UserID string `gorm:"size:256"`
	User   User

	CourseSubject string
	CourseNum     string
	Course        Course

	Grade string
}
