package db

import (
	"curriculum-utility/models"
	"fmt"
)

func ClearAlexTrans(orig int, userId string) {
	// Get user
	var user models.User

	GORM.First(&user, "id = ?", userId)

	trans := new(models.PlannedCourse)
	reportCard := new(models.ReportCard)
	var req models.CurriculumReqs
	var sugSem int
	var currSem int
	var defSub string
	var defNum string
	var currSub string
	var currNum string
	defSub = "NONE"
	defNum = "0000"
	GORM.Where("id = ?", orig).First(&req)
	sugSem = int(req.SuggestedSemester.Int64)
	GORM.Where("curriculum_reqs_id = ? AND user_id = ?", orig, user.ID).First(&trans)
	currSem = int(trans.Semester.Int64)
	currSub = trans.CourseSubject
	currNum = trans.CourseNum

	GORM.Where("user_id = ? AND course_subject = ? AND course_num = ?", user.ID, currSub, currNum).Delete(&reportCard)

	//look for a record of this in planned courses
	if currSem != sugSem { //remove details of class
		fmt.Println("in IF")
		GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Updates(&models.PlannedCourse{CourseSubject: defSub, CourseNum: defNum})

	} else { // delete entire record
		fmt.Println("in ELSE")
		GORM.Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Delete(&trans)
	}
}
