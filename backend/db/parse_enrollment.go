package db

import (
    "fmt"
    "curriculum-utility/models"
    "github.com/tealeg/xlsx/v3"
)

// ParseFile takes in a file name and parses advising  sheets
func ParseFile(s string) {
    wb, err := xlsx.OpenFile(s)
    if err != nil {
        panic(err)
    }

    batch := &models.Batch{
        Sems: []*models.Semester{},
    }

    for _, sh := range wb.Sheets {
        err = parseSheet(sh, batch)
        if err != nil {
            fmt.Println("Error parsing sheet: ", sh.Name)
            panic(err)
        }
    }

    // push values in batch to the database
    err = InsertExcelBatch(batch)
    if err != nil {
        fmt.Printf("Error batching %v\n", err)
    }
}

func rowParse(r *xlsx.Row, rowNum int, batch *models.Batch) error {
    if r.GetCell(0).String() == "" {
        // row doesn't exist, ignore it
        return nil
    }

    courseExcel := &models.CourseExcel{}
    err := r.ReadStruct(courseExcel)
    if err != nil {
        return err
    }
    course := courseExcel.ToCourse()

    sectionExcel := &models.SectionExcel{}
    err = r.ReadStruct(sectionExcel)
    if err != nil {
        return err
    }
    section := sectionExcel.ToSection()

    roomExcel := &models.RoomExcel{}
    err = r.ReadStruct(roomExcel)
    if err != nil {
        return err
    }
    room := roomExcel.ToRoom()

    profExcel := &models.ProfExcel{}
    err = r.ReadStruct(profExcel)
    if err != nil {
        return err
    }
    prof := profExcel.ToProf()

    semExcel := &models.SemesterExcel{}
    err = r.ReadStruct(semExcel)
    if err != nil {
        return err
    }
    semester := semExcel.ToSemester()

    // add "foreign key" references
    section.Course = course
    section.Room = room
    section.Prof = prof

    // Check if this semester is already in the batch
    var semToAppend *models.Semester = nil
    for i := range batch.Sems {
        if batch.Sems[i].Term == semester.Term && batch.Sems[i].Year == semester.Year {
            semToAppend = batch.Sems[i]
        }
    }

    // If semester not found in batch already, add the current semester to the batch
    if semToAppend == nil {
        semester.Sections = make([]models.Section, 0)
        semToAppend = &semester
        batch.Sems = append(batch.Sems, semToAppend)
    }

    // Append this sectioni to it's semester
    semToAppend.Sections = append(semToAppend.Sections, section)
    return nil
}

func parseSheet(sheet *xlsx.Sheet, batch *models.Batch) error {
    // data starts on the 4th row and last row is empty
    for i := 4; i < sheet.MaxRow-1; i++ {
        row, err := sheet.Row(i)
        if err != nil {
            return err
        }
        err = rowParse(row, i, batch)
        if err != nil {
            return err
        }
    }

    return nil
}
