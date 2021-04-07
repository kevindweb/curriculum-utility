package models

// Prof defines a professor that teaches multiple sections
type Prof struct {
    GWID  string `gorm:"primaryKey;size:9"`
    Name  string
    Email string
}

// ProfExcel defines the mapping of the excel sheet to a professor
type ProfExcel struct {
    GWID  string `xlsx:"17"`
    Name  string `xlsx:"18"`
    Email string `xlsx:"22"`
}

// ToProf converts this ProfExcel struct to a Prof
func (excel ProfExcel) ToProf() Prof {
    var prof Prof
    prof.GWID = excel.GWID
    prof.Name = excel.Name
    prof.Email = excel.Email
    return prof
}