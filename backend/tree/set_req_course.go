package tree

import (
	"curriculum-utility/db"
	"curriculum-utility/models"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

func SetReqCourse(userId string, curriculumReqID uint, subject string, num string) error {
	// Get user
	var user models.User
	db.GORM.First(&user, "id = ?", userId)

	// Get the curriculum req
	var curriculumReq models.CurriculumReqs
	result := db.GORM.First(&curriculumReq, curriculumReqID)
	if result.Error != nil {
		return result.Error
	}

	// If req is not an elective, return an error and make no changes to the database
	if !curriculumReq.IsElective {
		return fmt.Errorf("Curriculum req with id %d is not an elective.", curriculumReqID)
	}

	// Check that the new course is a valid elective for this elective type
	var elective models.Elective
	result = db.GORM.Where("elective_type_id = ? AND course_subject = ? AND course_num = ?",
		curriculumReq.ElectiveTypeID, subject, num).First(&elective)

	// If not, return an error
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return fmt.Errorf("%s %s is not a valid course for this elective", subject, num)
		}
		return result.Error
	}

	// Check if user has already put this course in their curriculum
	var existingPlannedCourse models.PlannedCourse
	result = db.GORM.Where(
		&models.PlannedCourse{
			UserID:        userId,
			CourseSubject: subject,
			CourseNum:     num,
		},
	).First(&existingPlannedCourse)
	if result.Error == nil {
		return fmt.Errorf("%s %s is already in your curriculum", subject, num)
	} else {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return result.Error
		}
	}

	// Find existing planned course for req, or initialize a new one
	var plannedCourse models.PlannedCourse
	result = db.GORM.Where(
		&models.PlannedCourse{
			UserID:           userId,
			CurriculumReqsID: curriculumReqID,
		},
	).FirstOrInit(&plannedCourse)

	if result.Error != nil {
		return result.Error
	}

	// If not found, create a new one
	if result.RowsAffected == 0 {
		plannedCourse.CourseSubject = subject
		plannedCourse.CourseNum = num
		plannedCourse.Semester = curriculumReq.SuggestedSemester
		result = db.GORM.Create(&plannedCourse)
		if result.Error != nil {
			return result.Error
		}
		return nil
	}

	// If planned course found, check that course differs
	if plannedCourse.CourseSubject != subject || plannedCourse.CourseNum != num {
		// Update the existing planned course record with the new course
		//delete the old grade first
		db.DeleteGrade(userId, plannedCourse.CourseSubject, plannedCourse.CourseNum)

		result = db.GORM.Model(&plannedCourse).Updates(models.PlannedCourse{
			CourseSubject: subject,
			CourseNum:     num,
		})

		if result.Error != nil {
			return result.Error
		}
	}
	return nil
}

func RemoveReqCourse(userId string, curriculumReqID uint) error {
	// Get user
	var user models.User
	db.GORM.First(&user, "id = ?", userId)

	// Get the curriculum req
	var curriculumReq models.CurriculumReqs
	result := db.GORM.First(&curriculumReq, curriculumReqID)
	if result.Error != nil {
		return result.Error
	}

	// If req is not an elective, return an error and make no changes to the database
	if !curriculumReq.IsElective {
		return fmt.Errorf("Curriculum req with id %d is not an elective.", curriculumReqID)
	}

	// Find existing planned course for req, or initialize a new one
	var plannedCourse models.PlannedCourse
	result = db.GORM.Where(
		&models.PlannedCourse{
			UserID:           userId,
			CurriculumReqsID: curriculumReqID,
		},
	).First(&plannedCourse)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return fmt.Errorf("Curriculum req with id %d already has no course set.", curriculumReqID)
		}
		return result.Error
	}

	//delete grade first
	db.DeleteGrade(userId, plannedCourse.CourseSubject, plannedCourse.CourseNum)

	// If planned course found, check if semester differs from suggested semester
	if plannedCourse.Semester != curriculumReq.SuggestedSemester {
		// If it does, change the course to a null course value
		result = db.GORM.Model(&plannedCourse).Updates(models.PlannedCourse{
			CourseSubject: "NONE",
			CourseNum:     "0000",
		})
		if result.Error != nil {
			return result.Error
		}
	} else {
		// If semester does not differ, delete this planned course record
		result := db.GORM.Delete(&plannedCourse)
		if result.Error != nil {
			return result.Error
		}
	}

	return nil
}
