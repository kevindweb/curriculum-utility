package db

import (
	"curriculum-utility/models"
)

func TestTranscript() {
	trans := new(models.CompletedCourses)
	GORM.Where("GWID = ?", "G11111111").Delete(&trans)
}
