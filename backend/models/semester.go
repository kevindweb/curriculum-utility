package models

import "strings"

// Semester pulled from  and fills Semester struct in db
// Semester - each semester has many courses and curriculum requirements
// only one can be IsCurrent at a time
type Semester struct {
	Sections []Section

	IsCurrent bool
	Term      string `gorm:"primaryKey;size:16"`
	Year      string `gorm:"primaryKey;size:16"`
}

// SemesterExcel defines the mapping of the excel sheet to a semester
type SemesterExcel struct {
	YearAndTerm string `xlsx:"0"`
}

// ToSemester converts this SemesterExcel struct to a Semester
func (excel SemesterExcel) ToSemester() Semester {
	var semester Semester
	strSplit := strings.Split(excel.YearAndTerm, " ")
	if len(strSplit) > 0 {
		semester.Year = strSplit[0]
	}
	if len(strSplit) > 1 {
		semester.Term = strSplit[1]
	}
	return semester
}
