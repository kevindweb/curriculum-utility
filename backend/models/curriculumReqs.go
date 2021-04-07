package models

import "gopkg.in/guregu/null.v4"

//CurriculumReqs refers classes (specific and electives) to  major
type CurriculumReqs struct {
	ID uint

	//FK
	CurriculumID uint
	Curriculum   Curriculum

	CourseSubject string
	CourseNum     string
	Course        Course

	ElectiveTypeID uint
	ElectiveType   ElectiveType

	IsElective bool

	SuggestedSemester null.Int
}

type CurrReqsJSON struct {
	CourseNum     string `json:"coursenum" binding: "required"`
	CourseSubject string `json:"coursesubject" binding: "required"`
	SuggestedSem  int    `json:"suggestedsem" binding: "required"`
}

type CurricReqsExcel struct {
	Course  string `xlsx:"1"`
	Course2 string `xlsx:"8"`
}
