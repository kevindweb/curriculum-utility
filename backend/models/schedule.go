package models

import "gorm.io/gorm"

// Schedule represents the list of sections a student has in their current schedule
type Schedule struct {
	gorm.Model

	// foreign keys
	SchedSections []SchedSection
	Filters       Filters

	// refers to the semester number a student is taking
	Semester int

	User string

	Score   float64
	Best    float64
	Credits int
}
