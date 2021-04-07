package models

type User struct {
	ID    string
	Name  string
	Email string

	CurriculumID uint
	Curriculum   Curriculum
}
