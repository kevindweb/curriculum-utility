package models

// SchedSection represents the list of sections a student has in their current schedule
type SchedSection struct {
	CRN        int  `gorm:"primaryKey;"`
	ScheduleID uint `gorm:"primaryKey;"`
}
