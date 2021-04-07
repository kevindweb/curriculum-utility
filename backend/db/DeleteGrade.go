package db

import (
	"curriculum-utility/models"
)

func DeleteGrade(userId string, sub string, num string) {
	var user models.User

	GORM.First(&user, "id = ?", userId)

	trans := new(models.ReportCard)

	GORM.Where("course_subject = ? AND course_num = ? AND user_id = ?", sub, num, user.ID).Delete(&trans)

//	if err := GORM.Where("course_subject = ?, AND course_num = ? AND user_id = ?", subm, num, user.ID).First(&trans).Error ; err == nil {
//		
//	}
	//if err != nul than the course in question wsn't assigned a grade
}
