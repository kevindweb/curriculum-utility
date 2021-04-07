package db

import (
	sched "curriculum-utility/models/sched"
	"fmt"
	"math/rand"
)

// createCourses returns num completely random courses
func createCourses(num int) []*sched.Course {
	if num < 1 {
		return nil
	}

	courses := []*sched.Course{}

	for i := 0; i < num; i++ {
		start, end := randTime()
		course := sched.Course{
			Name:    randName(),
			Start:   start,
			End:     end,
			Days:    randDays(),
			Credits: randCredit(),
			CRN:     randRange(500000, 600000),
		}

		courses = append(courses, &course)
	}

	return courses
}

func randName() string {
	return fmt.Sprintf("CSCI %d", randRange(1000, 4000))
}

func randRange(min int, max int) int {
	// inclusive
	return rand.Intn(max-min+1) + min
}

func randCredit() int {
	// 10% chance for a 4 credit course
	if rand.Float64() <= 0.1 {
		return 4
	}

	return 3
}

func randTime() (uint, uint) {
	// get random start time between 6am and 11pm
	start := randRange(600, 2150)
	// get random end time between 45 min and 2.5 hour after start
	end := randRange(start+45, start+150)
	return uint(start), uint(end)
}

// randDays returns a random amount of DOW from Monday-Friday
func randDays() []int {
	// max 2 days of the week
	num := 1
	if rand.Float32() < 0.6 {
		// 50% chance to get 2 days of the week
		num = 2
	}

	var res []int

	for i := 0; i < num; i++ {
		for {
			// get a unique DOW
			random := randRange(0, 4)
			if notin(res, random) {
				res = append(res, random)
				break
			}
		}
	}

	return res
}

// notin returns if an integer is in the slice
func notin(arr []int, search int) bool {
	for _, n := range arr {
		if n == search {
			return false
		}
	}
	return true
}
