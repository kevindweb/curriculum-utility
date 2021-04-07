package tree

import (
	"curriculum-utility/db"
	"curriculum-utility/models"
)

func GetSemesterCourses(userId string, semester int) []models.Course {
	// Get user
	var user models.User
	db.GORM.First(&user, "id = ?", userId)

	// Get curriculum requirements for this user's curriculum
	var curriculumReqs []models.CurriculumReqs
	db.GORM.Where("curriculum_id = ?", user.CurriculumID).Find(&curriculumReqs)

	// Get planned courses for user
	var plannedCourses []models.PlannedCourse
	db.GORM.Where("user_id = ?", user.ID).Find(&plannedCourses)

	// Create a hashmap of user's curriculum modifications to reference later
	var plannedCoursesMap = make(map[uint]*models.PlannedCourse)

	// For each planned course, fill its Course from db and store in hashmap
	for i, _ := range plannedCourses {
		plan := &plannedCourses[i]
		// Find course
		db.GORM.Model(plan).Association("Course").Find(&plan.Course)

		// Store in hashmap
		plannedCoursesMap[plan.CurriculumReqsID] = plan
	}

	// For each curriculum requirement, fill its Course and update semester
	// based on planned courses
	for i, _ := range curriculumReqs {
		req := &curriculumReqs[i]
		// Fill in course
		db.GORM.Model(req).Association("Course").Find(&req.Course)

		// Check if the user has made a modification to this requirement
		if plan, ok := plannedCoursesMap[req.ID]; ok {
			// If so, update course and semester
			if req.IsElective && plan.Course.Subject != "NONE" && plan.Course.Num != "0000" {
				req.Course = plan.Course
			}
			req.SuggestedSemester = plan.Semester
		}
	}

	// Finally, return just the courses that are for the given semester
	var courses []models.Course
	for _, req := range curriculumReqs {
		if int(req.SuggestedSemester.Int64) == semester {
			courses = append(courses, req.Course)
		}
	}

	return courses
}
