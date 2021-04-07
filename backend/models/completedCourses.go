package models

type CompletedCourses struct {
	ID        uint   `gorm:"primaryKey"`
	GWID      string `gorm:"column:GWID"` //foreign key
	SectionID uint   `gorm:"column:SectionID"`
	Grade     string
	CurrReq   int
}
