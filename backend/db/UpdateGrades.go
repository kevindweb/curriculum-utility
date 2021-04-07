package db

import (
	"curriculum-utility/models"
)

func UpdateGrades(userId string, sub string, num string, grade string) {
	
	var user models.User

	GORM.First(&user, "id = ?", userId)

	trans := new(models.ReportCard)

	if err := GORM.Where("course_subject = ? AND course_num = ? AND user_id = ?", sub, num, user.ID).First(&trans).Error ; err != nil {
	//if err != nil then we didn't find a record and need to create a new record
		plan := models.ReportCard{UserID: user.ID, CourseSubject: sub, CourseNum: num, Grade: grade}
		GORM.Create(&plan)
	} else { //err == nil so we found the record, just need to update
		GORM.Model(&models.ReportCard{}).Where("user_id = ? AND course_subject = ? and course_num = ?", user.ID, sub, num).Update("grade", grade)
	}
}
