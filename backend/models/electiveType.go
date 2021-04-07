package models

//ElectiveType defines the sections of elective options (like HSS) for majors
type ElectiveType struct {
	ID   uint
	Name string

	CurriculumID uint
	Curriculum   Curriculum
}
