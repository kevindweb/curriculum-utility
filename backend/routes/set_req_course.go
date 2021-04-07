package routes

import (
	"curriculum-utility/db"
	"curriculum-utility/tree"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CourseJson struct {
	Subject string `json:"subject" binding:"required"`
	Num     string `json:"num" binding:"required"`
}

type SetReqCoursePOSTBody struct {
	CurriculumReqID uint       `json:"curriculumReqID" binding:"required"`
	Course          CourseJson `json:"course" binding:"required"`
}

func SetReqCourse(c *gin.Context) {
	userId, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user",
		})
		return
	}

	// Get the JSON body
	var json SetReqCoursePOSTBody
	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if json.Course.Subject != "NONE" || json.Course.Num != "0000" {
		// Set course for thie elective requirement
		err := tree.SetReqCourse(userId.(string), json.CurriculumReqID, json.Course.Subject, json.Course.Num)
		if err != nil {
			// Get the current tree
			treeData := tree.GetTree(userId.(string))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
				"tree":  treeData,
			})
			return
		}
	} else {
		// Remove course for this elective requirement
		err := tree.RemoveReqCourse(userId.(string), json.CurriculumReqID)
		if err != nil {
			// Get the current tree
			treeData := tree.GetTree(userId.(string))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
				"tree":  treeData,
			})
			return
		}
	}

	// tell scheduler we updated this user
	db.UpdateUserData(userId.(string))

	// If all is successfully, just respond with the new tree
	treeData := tree.GetTree(userId.(string))
	c.JSON(200, gin.H{
		"tree": treeData,
	})
}
