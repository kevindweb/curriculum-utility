package db

import (
	"curriculum-utility/models"
	//	"gorm.io/driver/mysql"
	//	"gorm.io/gorm"
	"fmt"
)

//var db *gorm.DB

func MakeCurriculum() {
	//	var err error
	var test models.Curriculum
	var sem models.Semester
	//	var result models.CurriculumReqs

	curric := new(models.Curriculum)
	curric.SemesterTerm = "Fall"
	curric.SemesterYear = "2020"
	curric.Major = "BSCS"
	curric2 := new(models.Curriculum)
	curric2.SemesterTerm = "Fall"
	curric2.SemesterYear = "2020"
	curric2.Major = "BME"
	GORM.Create(&curric2)
	GORM.Create(&curric) //adding CS Major to DB\

	fmt.Println(curric.SemesterTerm)

	GORM.Select("Major", "ID", "SemesterTerm").Find(&test) //pull first entry from curriculum DB to test CS has been added successfuly

	GORM.First(&sem)

	elec := new(models.ElectiveType)
	elec.Name = "temp"
	elec.ID = 2
	GORM.Create(&elec)
	elec.Name = "Default"
	elec.ID = 1
	GORM.Create(&elec)
	defaultCourse := new(models.Course)
	defaultCourse.Subject = "NONE"
	defaultCourse.Num = "0000"
	GORM.Create(&defaultCourse)
	ParseCurric("scripts/CurricSheetCs.xlsx", curric)
	ParseCurric("scripts/MechyCurricSheet.xlsx", curric2)

}
