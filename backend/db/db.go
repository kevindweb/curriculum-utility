package db

import (
	"curriculum-utility/models"
	sched "curriculum-utility/models/sched"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"errors"
	"sync"
)

// GORM is the database constant shared throughout the code
var GORM *gorm.DB

type UserMap struct {
	m         sync.Mutex
	updateMap map[string]bool
}

// UserUpdates is a mapping of user id to whether database values have been modified
var UserUpdates UserMap

// Initialize Connects to the database and migrates the schema
func Initialize() {
	var err error
	dsn := "sd:Secretdontshare4321!@tcp(curriculum-utility.c2vkrbtsivkl.us-east-1.rds.amazonaws.com:3306)/alekevino?charset=utf8mb4&parseTime=True&loc=Local"
	GORM, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	UserUpdates = UserMap{
		updateMap: make(map[string]bool),
	}

	GORM.AutoMigrate(
		&models.Course{},
		&models.Prof{},
		&models.Room{},
		&models.Semester{},
		&models.Section{},
		&models.Curriculum{},
		&models.ElectiveType{},
		&models.CurriculumReqs{},
		&models.Elective{},
		&models.PlannedCourse{},
		&models.Schedule{},
		&models.User{},
		&models.SchedSection{},
		&models.Filters{},
		&models.ReportCard{},
	)
}

// InsertExcelBatch pushes all the models in batches
// to save DB time
func InsertExcelBatch(batch *models.Batch) error {
	result := GORM.Create(batch.Sems)
	return result.Error
}

// GetLastSchedule intializes the student's schedule to the last filter search they saved
func GetLastSchedule(gwid string) models.Schedule {
	var res models.Schedule
	// order by updated_at to get the most recently inserted schedule
	GORM.Where("user = ?", gwid).Order("updated_at DESC").
		Preload("SchedSections").Preload("Filters").Find(&res)

	return res
}

// GetPrevSemester retrieves the semester of the last updated schedule (or defaults to 1)
func GetPrevSemester(gwid string) int {
	var res models.Schedule

	err := GORM.Where("user = ?", gwid).Order("updated_at DESC").
		Find(&res).Error

	if err == nil {
		return res.Semester
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// no schedule yet, just return default
		return 1
	}

	// unrecoverable error
	return -1
}

// SaveSchedule puts the user's filtered schedule into the database
func SaveSchedule(schedule *sched.JSONSchedule, gwid string) error {
	// delete last schedule from database
	delete := &models.Schedule{}
	err := GORM.Where("user = ? and semester = ?", gwid, schedule.Semester).First(&delete).Error
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		// there was a schedule, need to replace it
		GORM.Delete(&delete)
		GORM.Where("schedule_id = ?", delete.ID).Delete(&models.SchedSection{})
	}

	// convert crn to SchedSection
	sectionsList := make([]models.SchedSection, len(schedule.SectionList))
	for i, crn := range schedule.SectionList {
		sectionsList[i] = models.SchedSection{
			CRN: crn,
		}
	}

	// convert JSONFIlters to database filters
	filters := models.Filters{
		Start: schedule.Filters.StartDate,
		End:   schedule.Filters.EndDate,
		TimeW: schedule.Filters.TimeWeight,

		Credits:  schedule.Filters.Credits,
		CreditsW: schedule.Filters.CreditWeight,

		Semester: schedule.Filters.Semester,

		DOW:       Flagtob(schedule.Filters.DOW),
		BalancedW: schedule.Filters.BalancedWeight,
	}

	// turn json schedule into database schedule
	res := &models.Schedule{
		Credits:       schedule.Credits,
		Score:         schedule.Score,
		Best:          schedule.Best,
		Semester:      schedule.Semester,
		User:          gwid,
		SchedSections: sectionsList,
		Filters:       filters,
	}

	result := GORM.Create(res)
	return result.Error
}

// Btoflag converts an int into a boolean array
func Btoflag(bf *[5]bool, n int) {
	for i := range bf {
		if n&(1<<i) != 0 {
			bf[i] = true
		}
	}
}

// Flagtob converts boolean array to int
func Flagtob(bf [5]bool) int {
	b := 0
	for i := range bf {
		if bf[i] {
			b |= (1 << i)
		}
	}
	return b
}

// GetSections returns all the sections associated with a course
func GetSections(course models.Course) []models.Section {
	var res []models.Section
	GORM.Where("course_subject = ? and course_num = ?", course.Subject, course.Num).
		Not("start = ? or credit_hour = 0", "####").Find(&res)

	return res
}

// UpdateUserData says that this user's data was modified
func UpdateUserData(userID string) {
	UserUpdates.m.Lock()
	UserUpdates.updateMap[userID] = true
	UserUpdates.m.Unlock()
}

// TestAndReset checks if user was updated, and resets them if they were
func TestAndReset(userID string) bool {
	UserUpdates.m.Lock()
	defer UserUpdates.m.Unlock()

	if val, ok := UserUpdates.updateMap[userID]; !ok || val {
		// ok holds boolean of whether the map contained userID, val is value part of (key:value)

		// either user was not in the map (so we need to add them)
		// or they were updated b/c val == true (we need to tell caller and reset)
		UserUpdates.updateMap[userID] = false
		return true
	}

	// nothing happened, user didn't change
	return false
}

// ParseDays takes in a day string and returns it as the integer values
func ParseDays(days string) []int {
	if len(days) == 0 {
		return []int{}
	}

	dayMap := map[rune]int{
		'M': 0,
		'T': 1,
		'W': 2,
		'R': 3,
		'F': 4,
	}
	intDays := make([]int, len(days))
	for i, d := range days {
		intDays[i] = dayMap[d]
	}

	return intDays
}

// SumSemesterCredits takes in a list of courses and returns the sum of all the credits
// (taken from the first section in each course)
func SumSemesterCredits(courses []*models.Course) int {
	sum := 0
	for _, course := range courses {
		var firstSection models.Section
		err := GORM.Where("course_subject = ? and course_num = ?", course.Subject, course.Num).
			Not("start = ? or credit_hour = 0", "####").Find(&firstSection).Error

		if err == nil {
			// found a section to check
			sum += firstSection.CreditHour
		}
	}

	return sum
}
