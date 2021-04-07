package models

// Room defines a room that is used for multiple sections
type Room struct {
    Name     string `gorm:"primaryKey;size:256"`
    Building string
    Campus   string
}

// RoomExcel defines a mapping of the excel sheet to a Room
type RoomExcel struct {
    Name     string `xlsx:"42"`
    Building string `xlsx:"41"`
    Campus   string `xlsx:"13"`
}

// ToRoom converts this RoomExcel struct to a Room
func (excel RoomExcel) ToRoom() Room {
    var room Room
    room.Name = excel.Name
    room.Building = excel.Building
    room.Campus = excel.Campus
    return room
}