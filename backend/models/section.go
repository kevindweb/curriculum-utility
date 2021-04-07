package models

// Section refers to specific classes with CRNs
type Section struct {
	// FKs for gorm
	CourseSubject string
	CourseNum     string
	Course        Course

	RoomName string
	Room     Room

	ProfGWID string
	Prof     Prof

	ProfName string

	SemesterTerm string
	SemesterYear string

	ID            uint
	CRN           string
	Section       string
	CreditHour    int
	Type          string
	Day           string
	Start         string
	End           string
	MaxEnrollment int
}

// SectionExcel defines a mapping of the excel sheet to a section
type SectionExcel struct {
	CRN           string `xlsx:"1"`
	Section       string `xlsx:"4"`
	CreditHour    int    `xlsx:"9"`
	Type          string `xlsx:"12"`
	Day           string `xlsx:"38"`
	Start         string `xlsx:"39"`
	End           string `xlsx:"40"`
	MaxEnrollment int    `xlsx:"24"`
}

// ToSection converts this SectionExcel struct to a Section
func (excel SectionExcel) ToSection() Section {
	var section Section
	section.CRN = excel.CRN
	section.Section = excel.Section
	section.CreditHour = excel.CreditHour
	section.Type = excel.Type
	section.Day = excel.Day
	section.Start = excel.Start
	section.End = excel.End
	section.MaxEnrollment = excel.MaxEnrollment
	return section
}
