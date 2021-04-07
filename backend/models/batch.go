package models

// Batch is a wrapper to hold  data before pushing to db
type Batch struct {
    Sems     []*Semester
}
