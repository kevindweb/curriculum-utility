package db

import (
	"curriculum-utility/models"
	//	"gorm.io/driver/mysql"
	//	"gorm.io/gorm"
	"fmt"
)

type retCurr struct {
	CourseSubject string
	CourseNum     string
	CourseSem     int
	ElectType     int
}

//var db *gorm.DB

func GetCurr(userID string) []retCurr {
	fmt.Println("Get Curr")

	// Get user
	var user models.User
	GORM.First(&user, "id = ?", userID)
	var arr []models.CurriculumReqs
	GORM.Find(&arr, "curriculum_id = ?", user.CurriculumID)
	var ret []retCurr
	for i := 0; i < len(arr); i++ {
		var req retCurr
		var elec models.ElectiveType
		if arr[i].CourseSubject != "NONE" {
			req.CourseSubject = arr[i].CourseSubject
			req.CourseNum = arr[i].CourseNum
			req.ElectType = int(arr[i].ElectiveTypeID)
		} else {
			GORM.Find(&elec, "id = ?", arr[i].ElectiveTypeID)
			req.CourseSubject = elec.Name
			req.CourseNum = ""
			req.ElectType = int(arr[i].ElectiveTypeID)
		}

		req.CourseSem = int(arr[i].SuggestedSemester.Int64)
		ret = append(ret, req)
	}

	return ret
}
