package models

//Curriculum defins a major at GW
type Curriculum struct {
	//FK
	SemesterTerm	string
	SemesterYear	string
	Semester Semester

	//PK
	ID	uint

	Major	string
}
