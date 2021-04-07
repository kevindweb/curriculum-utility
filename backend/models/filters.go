package models

// Filters helps persist the request from the last scheduler submission
type Filters struct {
	// dates to be converted once in JS land
	Start string
	End   string
	TimeW float64

	// cannot store boolean[] in DB, storing as int and converting
	DOW       int
	BalancedW float64

	Semester int

	Credits  int
	CreditsW float64

	ScheduleID uint `gorm:"primaryKey;"`
}
