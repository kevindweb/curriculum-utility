package models

// Elective matches a course to an electie field
type Elective struct {
	ID uint

	ElectiveTypeID uint
	ElectiveType   ElectiveType

	CourseSubject string
	CourseNum     string
	Course        Course
}
