package db

import (
	"curriculum-utility/models"

	"gopkg.in/guregu/null.v4"
)

func SetAlexTrans(currReq uint, sub string, num string, userId string) {
	// Get user
	var user models.User

	GORM.First(&user, "id = ?", userId)

	trans := new(models.PlannedCourse)
	var req models.CurriculumReqs
	var sugSem null.Int
	GORM.Where("id = ?", currReq).First(&req)
	sugSem = req.SuggestedSemester

	if err := GORM.Where("curriculum_reqs_id = ? AND user_id = ?", currReq, user.ID).First(&trans).Error; err != nil {
		//add
		plan := models.PlannedCourse{UserID: user.ID, CurriculumReqsID: currReq, CourseSubject: sub, CourseNum: num, Semester: sugSem}
		GORM.Create(&plan)

	} else { //update
		GORM.Model(&models.PlannedCourse{}).Where("user_id = ? AND curriculum_reqs_id = ?", user.ID, currReq).Updates(&models.PlannedCourse{CourseSubject: sub, CourseNum: num})
	}
}
