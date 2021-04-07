package scheduler

import (
	"fmt"
	"math/rand"
	"sort"
	"strconv"
	"sync"
	"time"

	db "curriculum-utility/db"
	models "curriculum-utility/models"
	sched "curriculum-utility/models/sched"
	tree "curriculum-utility/tree"
)

// Limit is the maximum recursion depth
const Limit = 5

// Empty represents the hashset value
var Empty struct{}

// SemCourses is a wrapper around sections list to cache sections AND the section semester
type SemCourses struct {
	Semester      int
	Sections      []*sched.Course
	Courses       []models.Course
	AsyncCourses  map[string]*sched.Course
	AsyncSections []*sched.Course
}

var userMap map[string]SemCourses

// InitScheduler needs to be called once for setting up data
func InitScheduler() {
	// update the seed for random courses
	rand.Seed(time.Now().UnixNano())

	// instantiate 50 workers to wait for reqs
	WorkerChan = make(chan Worker)
	StartWorkers(200)

	userMap = make(map[string]SemCourses)
}

// InitLastSched pulls last saved schedule from the database
func InitLastSched(userID string) *sched.JSONSchedule {
	dbSchedule := db.GetLastSchedule(userID)

	// only need the crn of the course
	sectionList := make([]int, len(dbSchedule.SchedSections))
	for i, section := range dbSchedule.SchedSections {
		sectionList[i] = section.CRN
	}

	dbFilters := dbSchedule.Filters
	filters := sched.JSONFilter{
		Credits:        dbFilters.Credits,
		CreditWeight:   dbFilters.CreditsW,
		Semester:       dbFilters.Semester,
		StartDate:      dbFilters.Start,
		EndDate:        dbFilters.End,
		TimeWeight:     dbFilters.TimeW,
		BalancedWeight: dbFilters.BalancedW,
	}

	db.Btoflag(&filters.DOW, dbFilters.DOW)

	// convert to JSONSchedule
	return &sched.JSONSchedule{
		Credits:     dbSchedule.Credits,
		Score:       dbSchedule.Score,
		Semester:    dbSchedule.Semester,
		Best:        dbSchedule.Best,
		SectionList: sectionList,
		Filters:     &filters,
	}
}

// InitSections pulls sections from DB and sorts them for the scheduler
func InitSections(userID string, semester int) []*sched.Course {
	sections, treeCourses, asyncList, asyncMap := GetSections(userID, semester)

	sort.SliceStable(sections, func(i, j int) bool {
		return sections[i].End < sections[j].End
	})

	buildJumpIndex(sections)

	userMap[userID] = SemCourses{
		// default first semester
		Semester:      semester,
		Sections:      sections,
		Courses:       treeCourses,
		AsyncCourses:  asyncMap,
		AsyncSections: asyncList,
	}
	return sections
}

// GetSections takes user data and finds all
// potential sections they can take
func GetSections(userID string, semester int) ([]*sched.Course, []models.Course, []*sched.Course, map[string]*sched.Course) {
	dbCourseList := tree.GetSemesterCourses(userID, semester)
	var sectionList []*sched.Course
	var asyncList []*sched.Course
	asyncMap := make(map[string]*sched.Course)

	for _, course := range dbCourseList {
		// pull sections associated with this course
		courseSections := db.GetSections(course)
		for _, section := range courseSections {
			// convert database section to sched.Course
			crn, err := strconv.Atoi(section.CRN)
			if err != nil {
				fmt.Println(err, course.Course, section.CRN)
				continue
			}
			start, err := strconv.ParseUint(section.Start, 10, 64)
			if err != nil {
				if section.Start != "" {
					fmt.Println(err, course.Course, section.CRN)
					continue
				}
				start = 0
			}
			end, err := strconv.ParseUint(section.End, 10, 64)
			if err != nil {
				if section.End != "" {
					fmt.Println(err, course.Course, section.CRN)
					continue
				}
				end = 0
			}

			schedSection := &sched.Course{
				Name:    course.Course,
				Subject: course.Subject,
				Num:     course.Num,
				CRN:     crn,
				Start:   uint(start),
				End:     uint(end),
				Credits: section.CreditHour,
				Days:    db.ParseDays(section.Day),
				Section: section.Section,
				Prof:    section.ProfName,
				Room:    section.RoomName,
			}

			if len(section.Day) > 0 {
				sectionList = append(sectionList, schedSection)
			} else if _, ok := asyncMap[schedSection.Name]; !ok {
				// new async section
				asyncList = append(asyncList, schedSection)
				asyncMap[schedSection.Name] = schedSection
			}
		}
	}

	return sectionList, dbCourseList, asyncList, asyncMap
}

// RunSchedulerFirst is called by main to get our sections on frontend load
func RunSchedulerFirst(userID string) *sched.InitSchedule {
	var semAndList SemCourses
	var sections []*sched.Course
	var asyncSections []*sched.Course
	var missingCourses []models.Course
	var ok bool

	schedule := InitLastSched(userID)
	if semAndList, ok = userMap[userID]; !ok {
		// in here if user wasn't initialized
		// initialize sections that this user can take
		semester := schedule.Semester
		if semester <= 0 {
			// not initialized yet
			semester = 1
		}
		sections = InitSections(userID, semester)
	} else {
		if db.TestAndReset(userID) {
			// Tree updated, we need to find the user's last semester choice
			lastSem := db.GetPrevSemester(userID)
			if lastSem == -1 {
				fmt.Println("Had an unrecoverable error getting last schedule")
				return nil
			}
			sections = InitSections(userID, lastSem)
		} else {
			sections = semAndList.Sections
		}
	}

	if semAndList, ok = userMap[userID]; ok {
		asyncSections = semAndList.AsyncSections
		missingCourses = semAndList.Courses
	}

	res := &sched.InitSchedule{
		Courses:        sections,
		MissingCourses: missingCourses,
		AsyncCourses:   asyncSections,
		Schedule:       schedule,
	}

	return res
}

// WorkerChan is how workers find work to do
var WorkerChan chan Worker

// PullCoursesTest runs through sections and creates the optimal schedules
func PullCoursesTest(userID string) {
	var semAndList SemCourses
	var ok bool
	if semAndList, ok = userMap[userID]; !ok {
		fmt.Println("Need to initialize user mapping first")
		return
	}

	sections := semAndList.Sections

	defaultSchedule := sched.EmptyJSONSchedule()
	filters := sched.Filters{
		CourseList: sections,
		Credits:    18,
		Start:      900,
		End:        2100,
		OffDays:    make(map[int]struct{}),
		// no possible schedule can get above 3 fitness
		Best:     3.0,
		Schedule: defaultSchedule,
		Mutex:    new(sync.Mutex),
		WG:       new(sync.WaitGroup),
	}

	// filter out Friday
	filters.OffDays[2] = Empty

	start := time.Now()

	var elapsed time.Duration
	// will send this many worker requests
	filters.WG.Add(len(sections))
	for i := range sections {
		// run a goroutine for each starting course
		// send a worker a request
		WorkerChan <- Worker{
			Data:  &filters,
			Index: i,
		}
	}
	elapsed = time.Since(start)
	fmt.Printf("Sending data took %s\n", elapsed)

	// // wait for all workers to finish
	filters.WG.Wait()

	elapsed = time.Since(start)
	fmt.Printf("Program took %s\n", elapsed)
}

// PullCourses receives the users' filters and returns an optimal schedule
func PullCourses(userData *sched.JSONFilter, userID string) *sched.InitSchedule {
	var semAndList SemCourses
	var sections []*sched.Course
	var asyncSections []*sched.Course
	var missingCourses []models.Course
	asyncMap := semAndList.AsyncCourses
	var ok bool

	if semAndList, ok = userMap[userID]; !ok {
		fmt.Println("Need to initialize user mapping first")
		return nil
	} else if semAndList.Semester != userData.Semester {
		sections = InitSections(userID, userData.Semester)
		if semAndList, ok = userMap[userID]; ok {
			asyncMap = semAndList.AsyncCourses
			asyncSections = semAndList.AsyncSections
			missingCourses = semAndList.Courses
		}
	} else {
		sections = semAndList.Sections
		asyncSections = semAndList.AsyncSections
		asyncMap = semAndList.AsyncCourses
		missingCourses = semAndList.Courses
	}

	filters := initFilters(userData, sections)

	for i, d := range userData.DOW {
		// check if user wanted classes this day
		if !d {
			// false means no classes
			// hashset of days when student doesnt want class
			filters.OffDays[i] = Empty
		}
	}

	filters.WG.Add(len(sections))
	for i := range sections {
		// run a goroutine for each starting course
		// send a worker a request
		WorkerChan <- Worker{
			Data:  &filters,
			Index: i,
		}
	}

	// wait for all workers to finish
	filters.WG.Wait()

	addAsyncCourses(filters, asyncMap)

	// make sure this gets updated in the database
	filters.Schedule.Semester = userData.Semester
	filters.Schedule.Filters = userData
	filters.Schedule.Best = filters.Best

	// save schedule for next user reload
	if err := db.SaveSchedule(filters.Schedule, userID); err != nil {
		fmt.Println("Error saving schedule in db", err)
	}

	res := &sched.InitSchedule{
		Courses:        sections,
		AsyncCourses:   asyncSections,
		MissingCourses: missingCourses,
		Schedule:       filters.Schedule,
	}

	return res
}

// initFilters returns an initialized filter set for the scheduler run from user data
func initFilters(userData *sched.JSONFilter, sections []*sched.Course) sched.Filters {
	// normalize advanced filters
	weights := [3]float64{userData.TimeWeight, userData.CreditWeight, userData.BalancedWeight}
	// prevent divide by zero
	for i, e := range weights {
		if e == 0 {
			weights[i] = 1
		}
	}
	min := weights[0]

	// find min in array
	for _, e := range weights[1:] {
		if e < min {
			min = e
		}
	}

	// normalize weights
	for i := range weights {
		weights[i] /= min
	}

	return sched.Filters{
		CourseList: sections,
		Credits:    userData.Credits,
		Start:      userData.Start,
		End:        userData.End,
		OffDays:    make(map[int]struct{}),
		// no possible schedule can get above this fitness score
		Best:     bestScore(weights),
		Schedule: sched.EmptyJSONSchedule(),
		Mutex:    new(sync.Mutex),
		WG:       new(sync.WaitGroup),

		// weights
		TimeWeight:     weights[0],
		CreditWeight:   weights[1],
		BalancedWeight: weights[2],
	}
}

// bestScore determines the highest possible schedule score from the filter weights
func bestScore(weights [3]float64) float64 {
	// first weight is time, so it is double counted with start and end
	return weights[0]*2 + weights[1] + weights[2]
}

// buildJumpIndex accepts a sorted list of courses (by end time)
// optimizes for scheduler
func buildJumpIndex(courses []*sched.Course) {
	for i, c := range courses {
		for j := i + 1; j < len(courses); j++ {
			if !c.Overlaps(courses[j]) {
				// not able to jump anymore classes efficiently
				c.Jump = j - i - 1
				break
			}
		}
	}
}

// Iterate represents the stack of the iterative code
type Iterate struct {
	index  int
	course *sched.Course
}

// findOptimalSchedule expects a list of courses, and an empty 5 day schedule
// Time complexity of n^Limit (n length of courses and Limit is the global variable)
func findOptimalSchedule(data *sched.Filters, schedule *sched.Schedule, start int) {
	courses := data.CourseList
	length := len(courses)

	// stack cannot exceed the global Limit+1 and is used instead of recursion
	stack := [Limit + 1]Iterate{}
	startCourse := courses[start]
	// initialize with one context
	stack[0] = Iterate{
		index:  start + 1 + startCourse.Jump,
		course: startCourse,
	}
	schedule.Insert(startCourse)

	// initialize variables out here because loop is compute-intense
	// end represents index of bottom (also used for length of stack)
	var end int
	var i int
	var iter Iterate

	// loop while the stack isn't empty
	for end >= 0 {
		iter = stack[end]
		i = iter.index
		if schedule.Credits >= data.Credits || i == length || end+1 > Limit {
			// target number of courses reached, at end of section list, or max courses reached
			schedule.Evaluate(data)

			// we're in a goroutine, so need to lock
			// before checking best schedule
			data.Mutex.Lock()
			if data.Schedule.Score == data.Best {
				// no schedule could be higher
				data.Mutex.Unlock()
				return
			}
			if schedule.Score > data.Schedule.Score {
				data.Schedule = schedule.ToJSON()
				data.OldSchedule = schedule
			}
			data.Mutex.Unlock()

			goto popstack
		}

		for j := i; j < length; j++ {
			course := courses[j]
			if !schedule.Insert(course) {
				// couldn't add course
				if j == length-1 {
					/*
						allow this schedule to get evaluated, it
						couldn't add the last course
						so it would've gotten popped, not evaluated
					*/
					stack[end].index++
					goto broken
				}
				continue
			}

			stack[end].index++
			end++

			// add context to the stack (overwrites previous stack val here)
			stack[end] = Iterate{
				// course.Jump set in buildJumpIndex
				index:  j + 1 + course.Jump,
				course: course,
			}

			// break out of for loop
			goto broken
		}

		// finished the loop successfully
	popstack:
		schedule.Remove(stack[end].course)
		end--

		// this goto is empty just to prevent extra booleans
	broken:
	}
}

func addAsyncCourses(data sched.Filters, asyncMap map[string]*sched.Course) {
	for _, section := range asyncMap {
		data.Schedule.SectionList = append(data.Schedule.SectionList, section.CRN)
		data.Schedule.Credits += section.Credits
	}

	data.OldSchedule.Evaluate(&data)
	data.Schedule = data.OldSchedule.ToJSON()
}
