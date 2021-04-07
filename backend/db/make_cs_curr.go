package db

import (
	"curriculum-utility/models"

	"gopkg.in/guregu/null.v4"
	"gorm.io/gorm/clause"
)

func DeleteCSCurriculum() {
	// First, get the primary ID of the BSCS curriculum
	var curriculum models.Curriculum
	if result := GORM.Where("major = ?", "BSCS").First(&curriculum); result.Error != nil {
		return
	}

	// Delete all curricululm reqs for this curriculum
	GORM.Where("curriculum_id = ?", curriculum.ID).Delete(&models.CurriculumReqs{})

	// Delete all elective classes for each elective type in this curriculum
	GORM.Exec("DELETE FROM electives WHERE EXISTS "+
		"(SELECT * FROM elective_types WHERE id = electives.elective_type_id "+
		"AND curriculum_id = ?)", curriculum.ID)

	// Delete all elective types for this curriculum
	GORM.Where("curriculum_id = ?", curriculum.ID).Delete(&models.ElectiveType{})
}

func MakeCSCurriculum() {
	// First, delete all contents of the BSCS curriculum
	DeleteCSCurriculum()

	// Then, retrieve the existing BSCS curriculum or create one if it doesn't exist
	curriculum := models.Curriculum{
		SemesterTerm: "Fall",
		SemesterYear: "2020",
		Major:        "BSCS",
	}
	GORM.FirstOrCreate(&curriculum)

	// Create a null course and null elective type
	nullCourse := models.Course{
		Subject: "NONE",
		Num:     "0000",
	}
	nullElectiveType := models.ElectiveType{
		Name:         "NONE",
		CurriculumID: curriculum.ID,
	}
	GORM.Create(&nullCourse)
	GORM.Create(&nullElectiveType)

	// Create our elective types for this curriculum
	electiveTypes := []models.ElectiveType{
		models.ElectiveType{
			Name:         "H/SS Elective",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "Math Requirement",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "Science Requirement",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "Stat Requirement",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "CS Tech Track Elective",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "Unrestricted Elective",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "CS Track Requirement",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "Non-tech Track Elective",
			CurriculumID: curriculum.ID,
		},
		models.ElectiveType{
			Name:         "Stats or Linear Algebra Requirement",
			CurriculumID: curriculum.ID,
		},
	}
	GORM.Create(&electiveTypes)

	// Add suitable classes for each elective type
	electiveCourses := []models.Elective{
		models.Elective{
			ElectiveTypeID: electiveTypes[0].ID,
			CourseSubject:  "PHIL",
			CourseNum:      "1051",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[0].ID,
			CourseSubject:  "PSYC",
			CourseNum:      "1001",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[1].ID,
			CourseSubject:  "MATH",
			CourseNum:      "1220",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[1].ID,
			CourseSubject:  "MATH",
			CourseNum:      "1221",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[1].ID,
			CourseSubject:  "MATH",
			CourseNum:      "1231",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[1].ID,
			CourseSubject:  "MATH",
			CourseNum:      "1232",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[2].ID,
			CourseSubject:  "PHYS",
			CourseNum:      "1021",
		},
		models.Elective{
			ElectiveTypeID: electiveTypes[2].ID,
			CourseSubject:  "PHYS",
			CourseNum:      "1022",
		},
	}
	GORM.Create(&electiveCourses)

	// Then create our curriculum requirements for this curriculum
	curriculumReqs := []models.CurriculumReqs{
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[0].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(1),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "1111",
			SuggestedSemester: null.IntFrom(1),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[1].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(1),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "1010",
			SuggestedSemester: null.IntFrom(1),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "UW",
			CourseNum:         "1020",
			SuggestedSemester: null.IntFrom(1),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[0].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(2),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "1112",
			SuggestedSemester: null.IntFrom(2),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[1].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(2),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "1311",
			SuggestedSemester: null.IntFrom(2),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[2].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(2),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[0].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(3),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "2113",
			SuggestedSemester: null.IntFrom(3),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "2312",
			SuggestedSemester: null.IntFrom(3),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "2461",
			SuggestedSemester: null.IntFrom(3),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[2].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(3),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "3313",
			SuggestedSemester: null.IntFrom(4),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "2541W",
			SuggestedSemester: null.IntFrom(4),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "2501",
			SuggestedSemester: null.IntFrom(4),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "3410",
			SuggestedSemester: null.IntFrom(4),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[3].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(4),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[2].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(4),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[0].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(5),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "3212",
			SuggestedSemester: null.IntFrom(5),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[4].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(5),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "3411",
			SuggestedSemester: null.IntFrom(5),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[0].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(6),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[5].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(6),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[6].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(6),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[7].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(6),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[8].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(6),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[0].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(7),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "4243W",
			SuggestedSemester: null.IntFrom(7),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[6].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(7),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[7].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(7),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[5].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(7),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[5].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(8),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        false,
			ElectiveTypeID:    nullElectiveType.ID,
			CourseSubject:     "CSCI",
			CourseNum:         "4244",
			SuggestedSemester: null.IntFrom(8),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[6].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(8),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[7].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(8),
		},
		models.CurriculumReqs{
			CurriculumID:      curriculum.ID,
			IsElective:        true,
			ElectiveTypeID:    electiveTypes[5].ID,
			CourseSubject:     nullCourse.Subject,
			CourseNum:         nullCourse.Num,
			SuggestedSemester: null.IntFrom(8),
		},
	}
	GORM.Omit(clause.Associations).Create(&curriculumReqs)
}
