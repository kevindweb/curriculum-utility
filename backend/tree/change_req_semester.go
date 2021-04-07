package tree

import (
	"curriculum-utility/db"
	"curriculum-utility/models"
	"fmt"

	"gopkg.in/guregu/null.v4"
)

func ChangeReqSemester(userId string, curriculumReqID uint, semester int) error {
	// Get user
	var user models.User
	db.GORM.First(&user, "id = ?", userId)

	// Find existing planned course for req, or initialize a new one
	var plannedCourse models.PlannedCourse
	result := db.GORM.Where(
		&models.PlannedCourse{
			UserID:           userId,
			CurriculumReqsID: curriculumReqID,
		},
	).FirstOrInit(&plannedCourse)

	if result.Error != nil {
		return result.Error
	}

	// Check if an existing planned course was not found
	if result.RowsAffected == 0 {
		// Check if the new semester differs from the suggested semester
		var curriculumReq models.CurriculumReqs
		result := db.GORM.First(&curriculumReq, curriculumReqID)
		if result.Error != nil {
			return result.Error
		}

		// If semester does not differ, make no changes to the database
		if int(curriculumReq.SuggestedSemester.Int64) == semester {
			return nil
		}

		// Otherwise, create a new planned course record
		plannedCourse.Semester = null.IntFrom(int64(semester))
		plannedCourse.CourseSubject = "NONE"
		plannedCourse.CourseNum = "0000"
		result = db.GORM.Create(&plannedCourse)
		if result.Error != nil {
			return result.Error
		}
		return nil
	}

	// If planned course found, check that semester differs
	if int(plannedCourse.Semester.Int64) != semester {
		// Then, check that the new semester differs from the suggest semester
		var curriculumReq models.CurriculumReqs
		result := db.GORM.First(&curriculumReq, curriculumReqID)
		if result.Error != nil {
			return result.Error
		}

		// If semester does not differ, and the planned course does
		// not specify a course, delete the existing record
		if int(curriculumReq.SuggestedSemester.Int64) == semester {
			if plannedCourse.CourseSubject == "NONE" && plannedCourse.CourseNum == "0000" {
				result := db.GORM.Delete(&plannedCourse)
				if result.Error != nil {
					return result.Error
				}
				return nil
			}
		}

		// Otherwise, update the existing planned course record with the new semester
		plannedCourse.Semester = null.IntFrom(int64(semester))
		result = db.GORM.Save(&plannedCourse)
		if result.Error != nil {
			fmt.Println(result.Error)
			return result.Error
		}
	}
	return nil
}
