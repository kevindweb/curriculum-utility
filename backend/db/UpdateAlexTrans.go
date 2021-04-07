package db

import (
	"curriculum-utility/models"

	"gopkg.in/guregu/null.v4"
)

func UpdateAlexTrans(orig int, move int, userId string) {
	// Get user
	var user models.User

	GORM.First(&user, "id = ?", userId)

	trans := new(models.PlannedCourse)
	trans2 := new(models.PlannedCourse)
	var req models.CurriculumReqs
	var req2 models.CurriculumReqs
	var sugSem null.Int
	var currSem null.Int
	var currSub string
	var currNum string
	var defSub string
	var defNum string
	defSub = "NONE"
	defNum = "0000"
	GORM.Where("id = ?", orig).First(&req)
	sugSem = req.SuggestedSemester
	GORM.Where("curriculum_reqs_id = ? AND user_id = ?", orig, user.ID).First(&trans)
	currSem = trans.Semester
	currSub = trans.CourseSubject
	currNum = trans.CourseNum
	//look for a record of this in planned courses
	if err := GORM.Where("curriculum_reqs_id = ? AND user_id = ?", move, user.ID).First(&trans2).Error; err != nil { // if none found theres only 1 record in planned courses right now
		if currSem != sugSem { //1 -> 2 records
			GORM.Where("id = ?", move).First(&req2)
			sugSem = req2.SuggestedSemester
			plan := models.PlannedCourse{UserID: user.ID, CurriculumReqsID: uint(move), CourseSubject: currSub, CourseNum: currNum, Semester: sugSem}

			//update curr plan to just save semester
			GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Updates(&models.PlannedCourse{CourseSubject: defSub, CourseNum: defNum})
			GORM.Create(&plan)

		} else { // 1 -> 1 record
			GORM.Where("id = ?", move).First(&req2)
			sugSem = req2.SuggestedSemester
			GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Update("semester", sugSem)
			GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Update("curriculum_reqs_id", move)
		}
	} else { // dealing with 2 already made records in planned courses
		if currSem != sugSem { //2 -> 2 records
			GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Updates(&models.PlannedCourse{CourseSubject: defSub, CourseNum: defNum})
			GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, move).Updates(&models.PlannedCourse{CourseSubject: currSub, CourseNum: currNum})
		} else { //2 -> 1 record\
			GORM.Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, orig).Delete(&trans)
			GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, move).Updates(&models.PlannedCourse{CourseSubject: currSub, CourseNum: currNum})
		}
	}
}
