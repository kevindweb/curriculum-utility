package models

import "fmt"

// Course holds combined data of a section and course from DB
type Course struct {
	Name    string `json:"name" binding:"required"`
	CRN     int    `json:"crn" binding:"required"`
	Start   uint   `json:"start"`
	End     uint   `json:"end"`
	Days    []int  `json:"dow"`
	Credits int    `json:"credits" binding:"required"`
	Section string `json:"section" binding:"required"`
	Subject string `json:"subject" binding:"required"`
	Num     string `json:"num" binding:"required"`
	Prof    string `json:"prof" binding:"reqiured"`
	Room    string `json:"location" binding:"required"`
	// optimization for scheduler
	Jump int `json:"-"`
}

// Print prints the course data
func (c *Course) Print() {
	fmt.Printf("%s: %d (crn) / %d credits\nDays: %v\nTime: %d -- %d\n", c.Name, c.CRN, c.Credits,
		c.Days, c.Start, c.End)
}

// Overlaps returns true is c and o have time conflicts
// assumes that c end is before or at the same time as o end
func (c *Course) Overlaps(o *Course) bool {
	if c.Name == o.Name {
		return true
	}
	// boolean of whether there was a time conflict
	timeInvalid := o.Start <= c.End

	if timeInvalid {
		// there was a time conflict, check if days overlap
		for _, d := range c.Days {
			for _, od := range o.Days {
				if d == od {
					// there was an overlapping day, these courses overlap
					return true
				}
			}
		}
	}

	// courses do not overlap and can exist on same schedule
	return false
}

// PrintDay prints all the courses from a specific day
func PrintDay(courses []*Course) {
	for _, c := range courses {
		c.Print()
	}
}
