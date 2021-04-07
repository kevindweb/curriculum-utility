package models

import (
	"fmt"
	"math"

	course "curriculum-utility/models"
)

// InitSchedule holds the student courses
// and a schedule if the user had one saved
type InitSchedule struct {
	Schedule       *JSONSchedule   `json:"schedule" binding:"required"`
	Courses        []*Course       `json:"sections" binding:"required"`
	AsyncCourses   []*Course       `json:"async" binding:"required"`
	MissingCourses []course.Course `json:"missing" binding:"required"`
}

// JSONSchedule is sent back as response
type JSONSchedule struct {
	Credits  int `json:"credits" binding:"required"`
	Semester int `json:"semester" binding:"required"`
	// will hold a list of CRNs (frontend will already have access to the courses)
	SectionList []int `json:"sectionList" binding:"required"`
	Score       float64
	Best        float64
	Filters     *JSONFilter `json:"filters" binding:"required"`
}

// Print a jsonSchedule data
func (s *JSONSchedule) Print() {
	fmt.Printf("Schedule: %d credits, score: %f\nCRNs %v\n", s.Credits, s.Score, s.SectionList)
}

// ToJSON turns a schedule to json for sending back to frontend
func (s *Schedule) ToJSON() *JSONSchedule {
	crnList := make([]int, len(s.CourseSet))

	cnt := 0
	for _, crn := range s.CourseSet {
		crnList[cnt] = crn
		cnt++
	}

	return &JSONSchedule{
		Credits:     s.Credits,
		SectionList: crnList,
		Score:       s.Score,
	}
}

// EmptyJSONSchedule returns a schedule with nothing in it
func EmptyJSONSchedule() *JSONSchedule {
	return &JSONSchedule{
		Score: 0,
	}
}

// Schedule holds hashset and Monday->Friday courseList
type Schedule struct {
	// hashset of course names to avoid duplicates
	CourseSet map[string]int
	List      [5][]*Course
	Credits   int
	Num       int
	Score     float64
	Best      float64
}

// Print prints out the schedule for testing
func (s *Schedule) Print() {
	fmt.Printf("Schedule: %d credits, %d courses, score: %f\n", s.Credits, s.Num, s.Score)
	for i, d := range s.List {
		if len(d) == 0 {
			continue
		}
		fmt.Printf("\nDay %d\n", i)
		PrintDay(d)
	}
}

// Contains returns boolean of whether a crn is in the schedule
func (s *Schedule) Contains(crn int) bool {
	for _, d := range s.List {
		for _, c := range d {
			if c.CRN == crn {
				return true
			}
		}
	}

	return false
}

// Evaluate returns a fitness score for a schedule
// might want to add heuristic for "balanced" schedule
func (s *Schedule) Evaluate(data *Filters) {
	startScore := data.TimeWeight
	endScore := data.TimeWeight
	// each day could lose 20% potentially (5 days of the week)
	timeDecrement := startScore / 5

	balanceScore := data.BalancedWeight
	balancedDecrement := balanceScore / 5

	for i, day := range s.List {
		length := len(day)

		// check if student chose to have no courses today
		_, isOffDay := data.OffDays[i]

		if isOffDay && length > 0 {
			// wanted no courses but one found
			balanceScore -= balancedDecrement
		} else if length == 0 {
			// no courses today
			if !isOffDay {
				// wanted courses today to balance
				// but none found
				balanceScore -= balancedDecrement
			}

			continue
		}

		// take points off for failing user criteria
		// of when to wake up for courses
		if day[0].Start < data.Start {
			startScore -= timeDecrement
		}
		if day[length-1].End > data.End {
			endScore -= timeDecrement
		}
	}

	// diff is how far the schedule credits is from the target (ignoring sign)
	diff := math.Abs(float64(s.Credits - data.Credits))
	// penalize (by percentage) being farther from target
	percentageOffset := 1.0 - (diff / float64(data.Credits))
	// credScore = data.CreditWeight when s.Credits = data.Credits (best case scenario)
	credScore := data.CreditWeight * percentageOffset

	s.Score = startScore + endScore + credScore + balanceScore
}

// Insert efficiently places a course into a schedule
func (s *Schedule) Insert(course *Course) bool {
	if _, dup := s.CourseSet[course.Name]; dup {
		// already added this course
		return false
	}
	start := course.Start
	for _, d := range course.Days {
		length := len(s.List[d]) - 1
		if length < 0 {
			// no courses today, we can insert
			continue
		}
		// assumption based on inserting courses sorted by End time
		if start <= s.List[d][length].End {
			return false
		}
	}
	// have to insert out here because we can return in prev for loop
	for _, d := range course.Days {
		s.List[d] = append(s.List[d], course)
	}

	// golang example of hashset
	s.CourseSet[course.Name] = course.CRN
	s.Credits += course.Credits

	return true
}

// Remove takes away a course in O(1) time
func (s *Schedule) Remove(course *Course) {
	for _, d := range course.Days {
		// loop through days a course is on (Monday, Wednesday...)
		// remove last course of the day (O(1))
		s.List[d] = s.List[d][:len(s.List[d])-1]
	}

	delete(s.CourseSet, course.Name)
	s.Credits -= course.Credits
}

// EmptySchedule returns a schedule for testing
func EmptySchedule() Schedule {
	return Schedule{
		List:      [5][]*Course{},
		CourseSet: make(map[string]int),
	}
}
