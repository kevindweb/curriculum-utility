package db

import (
	"curriculum-utility/models"
	"fmt"
)

type retTransAlex struct {
	Req   uint
	Sub   string
	Num   string
	Cred  int
	Elec  bool
	Grade string
	Move  []int
}

func GetTransfromAlex(userId string) []retTransAlex {

	// Get user
	var user models.User
	GORM.First(&user, "id = ?", userId)

	var curr []models.CurriculumReqs
	GORM.Find(&curr, "curriculum_id = ?", user.CurriculumID)

	var grades []models.ReportCard
	GORM.Find(&grades, "user_id = ?", user.ID)

	var plan []models.PlannedCourse
	GORM.Find(&plan, "user_id = ?", user.ID)

	var ret []retTransAlex
	for i := 0; i < len(curr); i++ {
		var course retTransAlex
		course.Num = "undone"
		if !curr[i].IsElective { //not an elective therefore default course required
			var cred models.Section
			GORM.Find(&cred, "course_subject = ? AND course_num = ?", curr[i].CourseSubject, curr[i].CourseNum)
			course.Sub = curr[i].CourseSubject
			course.Num = curr[i].CourseNum
			course.Req = curr[i].ID
			course.Cred = cred.CreditHour
			course.Elec = false
			course.Move = append(course.Move, 1)

		} else {
			for j := 0; j < len(plan); j++ {
				if plan[j].CurriculumReqsID == curr[i].ID {
					var cred models.Section
					GORM.Find(&cred, "course_subject = ? AND course_num = ?", plan[j].CourseSubject, plan[j].CourseNum)
					course.Sub = plan[j].CourseSubject
					course.Num = plan[j].CourseNum
					course.Req = curr[i].ID
					course.Cred = cred.CreditHour
					course.Elec = true

					var elecType []models.Elective
					GORM.Find(&elecType, "course_subject = ? AND course_num = ?", plan[j].CourseSubject, plan[j].CourseNum)

					fmt.Print("eletType Length = ")
					fmt.Println(len(elecType))

					for z := 0; z < len(elecType); z++ {
						course.Move = append(course.Move, int(elecType[z].ElectiveTypeID))
					}
				}
			}
			if course.Num == "undone" {
				course.Req = curr[i].ID
				course.Sub = "NONE"
				course.Num = "0000"
				course.Cred = 0
				course.Elec = true
			}
		}

		for j := 0; j < len(grades); j++ {
			if course.Sub == grades[j].CourseSubject && course.Num == grades[j].CourseNum {
				course.Grade = grades[j].Grade
			}
		}
		if course.Grade == "" {
			course.Grade = "IC"
		}
		ret = append(ret, course)
	}

	return ret
}
