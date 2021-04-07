package db

import (
	"curriculum-utility/models"
	"fmt"
	"strings"

	"github.com/tealeg/xlsx/v3"
	"gopkg.in/guregu/null.v4"
)

//ParseCurric takes in a curriculum sheet xls file and parses out the courses
func ParseCurric(s string, curr *models.Curriculum) {
	wb, err := xlsx.OpenFile(s)
	if err != nil {
		fmt.Println("Error opening file")
		panic(err)
	}

	for _, sh := range wb.Sheets {
		err = parsePage(sh, curr)
		if err != nil {
			fmt.Println("Error parsing sheet: ", sh.Name)
			panic(err)
		}
	}

}

func rowParseCurric(r *xlsx.Row, rowNum int, sem int, curr *models.Curriculum) error {
	course := &models.Course{}
	course2 := &models.Course{}
	curric := &models.CurriculumReqs{}
	curric2 := &models.CurriculumReqs{}
	curricEx := &models.CurricReqsExcel{}
	err := r.ReadStruct(curricEx)
	if err != nil {
		fmt.Println("error reading into curricexcel")
		return err
	}
	if curricEx.Course != "" {
		s := strings.Split(curricEx.Course, " ")
		if len(s) > 1 {
			if s[0] == "CS" {
				s[0] = "CSCI"
			}
			GORM.Where("Subject = ? and Num = ?", s[0], s[1]).Find(&course)
			if course.Subject == "" { //if course not found the nthis is an elective
				curric.ElectiveTypeID = 2
				curric.CourseSubject = "NONE"
				curric.CourseNum = "0000"
			} else {
				curric.ElectiveTypeID = 1
				curric.Course = *course
			}
			curric.Curriculum = *curr
			curric.SuggestedSemester = null.IntFrom(int64(sem))
			fmt.Println("adding: ", curric)
			GORM.Create(curric)
		}
	}
	if curricEx.Course2 != "" {
		d := strings.Split(curricEx.Course2, " ")
		if len(d) > 1 {
			if d[0] == "CS" {
				d[0] = "CSCI"
			}
			GORM.Where("Subject = ? and Num = ?", d[0], d[1]).Find(&course2)
			if course2.Subject == "" {
				curric2.ElectiveTypeID = 2
				curric2.CourseSubject = "NONE"
				curric2.CourseNum = "0000"
			} else {
				curric2.ElectiveTypeID = 1
				curric2.Course = *course2
			}
			curric2.Curriculum = *curr
			curric2.SuggestedSemester = null.IntFrom(int64(sem + 1))
			GORM.Create(&curric2)
		}
	}
	return nil
}

func parsePage(sheet *xlsx.Sheet, curr *models.Curriculum) error {
	i := 9
	k := 1
	for i < 50 {
		for j := i; j < i+7; j++ {
			row, err := sheet.Row(j)
			if err != nil {
				return nil
			}
			err = rowParseCurric(row, j, k, curr)
			if err != nil {
				return err
			}
		}
		i = i + 11
		k = k + 2
	}
	return nil
}
