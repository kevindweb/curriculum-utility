package models

import "sync"

// JSONFilter is sent by browser
type JSONFilter struct {
	Credits      int     `json:"credits" binding:"required"`
	CreditWeight float64 `json:"creditWeight" binding:"required"`
	// help track if user changed semester
	// means we need to reload the sections list
	Semester int `json:"semester" binding:"required"`

	Start      uint    `json:"start" binding:"required"`
	StartDate  string  `json:"startDate" binding:"required"`
	End        uint    `json:"end" binding:"required"`
	EndDate    string  `json:"endDate" binding:"required"`
	TimeWeight float64 `json:"timeWeight" binding:"required"`

	DOW            [5]bool `json:"dow" binding:"required"`
	BalancedWeight float64 `json:"balancedWeight" binding:"required"`
}

// Filters carries user criteria and thresholds for best schedule
type Filters struct {
	CourseList   []*Course
	Credits      int
	CreditWeight float64

	// how many courses? is this better than credits?
	Start      uint
	End        uint
	TimeWeight float64

	// hashset of days to avoid when creating schedule
	OffDays        map[int]struct{}
	BalancedWeight float64

	// keep track of scores
	Best        float64
	Schedule    *JSONSchedule
	OldSchedule *Schedule

	// async helpers
	Mutex *sync.Mutex
	WG    *sync.WaitGroup
}
