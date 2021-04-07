package routes

import (
	"curriculum-utility/db"
	"curriculum-utility/tree"
	"net/http"

	"github.com/gin-gonic/gin"
	"gopkg.in/guregu/null.v4"
)

type ChangeReqSemesterPOSTBody struct {
	CurriculumReqID uint     `json:"curriculumReqID" binding:"required"`
	Semester        null.Int `json:"semester" binding:"required"`
}

func ChangeReqSemester(c *gin.Context) {
	userId, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user",
		})
		return
	}

	// Get the JSON body
	var json ChangeReqSemesterPOSTBody
	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Change semester in database
	err := tree.ChangeReqSemester(userId.(string), json.CurriculumReqID, int(json.Semester.Int64))
	if err != nil {
		// Get the current tree
		treeData := tree.GetTree(userId.(string))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
			"tree":  treeData,
		})
		return
	}

	// tell scheduler we updated this user
	db.UpdateUserData(userId.(string))

	// Get the new tree
	treeData := tree.GetTree(userId.(string))
	c.JSON(200, gin.H{
		"tree": treeData,
	})
}
