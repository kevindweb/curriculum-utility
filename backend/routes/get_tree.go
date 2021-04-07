package routes

import (
	"curriculum-utility/tree"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetTree(c *gin.Context) {
	userId, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user",
		})
		return
	}
	treeData := tree.GetTree(userId.(string))
	c.JSON(200, treeData)
}
