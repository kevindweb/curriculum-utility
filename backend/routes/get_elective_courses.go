package routes

import (
	"curriculum-utility/tree"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetElectiveCoursesForReq(c *gin.Context) {
	// Get curriculum req id
	curriculumReqIDStr := c.Query("curriculumReqID")
	curriculumReqIDInt, err := strconv.Atoi(curriculumReqIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "curriculumReqID must be a positive integer.",
		})
		return
	}

	// Cast to an unsigned int
	if curriculumReqIDInt < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "curriculumReqID must be a positive integer.",
		})
		return
	}
	curriculumReqID := uint(curriculumReqIDInt)

	// Get courses for this curriculum requirement
	courses, err := tree.GetElectiveCoursesForReq(curriculumReqID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"courses": courses,
	})
}

func GetElectiveCoursesForReqZach(c *gin.Context) {
	// Get curriculum req id
	fmt.Println("HELLO")
	curriculumReqIDStr := c.Query("curriculumReqID")
	curriculumReqIDInt, err := strconv.Atoi(curriculumReqIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "curriculumReqID must be a positive integer.",
		})
		return
	}

	// Cast to an unsigned int
	if curriculumReqIDInt < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "curriculumReqID must be a positive integer.",
		})
		return
	}
	curriculumReqID := uint(curriculumReqIDInt)

	// Get courses for this curriculum requirement
	courses, err := tree.GetElectiveCoursesForReqZach(curriculumReqID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	fmt.Println(courses)
	c.JSON(http.StatusOK, gin.H{
		"courses": courses,
	})
}
