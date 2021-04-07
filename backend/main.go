package main

import (
	"curriculum-utility/db"
	"curriculum-utility/models"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"sync"

	"gorm.io/gorm"

	sched "curriculum-utility/models/sched"
	"curriculum-utility/scheduler"

	"curriculum-utility/auth"

	"github.com/form3tech-oss/jwt-go"
	"github.com/gin-gonic/gin"

	"curriculum-utility/routes"
	"net/http"
)

type updateTransPOSTBody struct {
	FROM int `json:"from" binding:"required"`
	TO   int `json:"to" binding:"required"`
}

type updateClearPOSTBody struct {
	FROM int `json:"from" binding:"required"`
}

type updateSetPOSTBody struct {
	FROM int `json:"from" binding:"required"`
	SUB  string
	NUM  string
}

type updateGradePOSTBody struct {
	Sub   string
	Num   string
	Grade string
}

// CORSMiddleware sets cors policies so frontend can connect with no errors
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

var gormLock sync.Mutex

func checkJWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		jwtMid := auth.JWTMiddleware
		if err := jwtMid.CheckJWT(c.Writer, c.Request); err != nil {
			c.AbortWithStatus(401)
			return
		}

		// Get the user ID from the "sub" value in the parsed token
		userId := c.Request.Context().Value("user").(*jwt.Token).Claims.(jwt.MapClaims)["sub"].(string)

		// Check if the user already exists in the database
		gormLock.Lock()
		defer gormLock.Unlock()
		var user models.User
		result := db.GORM.First(&user, "id = ?", userId)
		if result.Error != nil {
			// If error is not a record not found error, abort and throw error
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				c.AbortWithError(500, result.Error)
				return
			}

			// If user not found, attempt to get user profile info
			token := c.Request.Context().Value("user").(*jwt.Token).Raw

			// Build the request to /userinfo endpoint
			client := &http.Client{}
			req, err := http.NewRequest("GET", "https://curriculum-utility.us.auth0.com/userinfo", nil)
			if err != nil {
				c.AbortWithError(500, err)
				return
			}

			// Add authorization token
			req.Header.Add("Authorization", "Bearer "+token)
			resp, err := client.Do(req)
			if err != nil {
				c.AbortWithError(500, err)
				return
			}
			defer resp.Body.Close()

			// Read the response body
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				c.AbortWithError(500, err)
				return
			}

			// Parse the json response into struct
			type UserInfo struct {
				Name  string `json:"name"`
				Email string `json:"email"`
			}
			var userInfo UserInfo
			err = json.Unmarshal(body, &userInfo)
			if err != nil {
				c.AbortWithError(500, err)
				return
			}

			// Create a new user record with the given user info
			// TODO: Don't hardcode to BSCS curriculum
			newUser := models.User{
				ID:           userId,
				Name:         userInfo.Name,
				Email:        userInfo.Email,
				CurriculumID: 1,
			}
			result := db.GORM.Create(&newUser)
			if result.Error != nil {
				c.AbortWithError(500, result.Error)
				return
			}
		}

		c.Set("user", userId)
	}
}

func main() {
	gormLock = sync.Mutex{}

	// Initialize gin and connect to the database
	r := gin.Default()
	r.Use(CORSMiddleware())
	db.Initialize()

	// db.ParseFile("scripts/2020fallenrollment.xlsx")
	// db.MakeCSCurriculum()
	// db.MakeTranscript()
	scheduler.InitScheduler()

	r.GET("/getCurr", checkJWT(), func(c *gin.Context) {
		userId, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid user",
			})
			return
		}
		//fmt.Println("getting curr")
		curr := db.GetCurr(userId.(string))
		//fmt.Println(curr)
		c.JSON(200, gin.H{"getCurr": curr})
	})
	r.GET("/getTransfromAlex", checkJWT(), func(c *gin.Context) {
		userId, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid user",
			})
			return
		}
		trans := db.GetTransfromAlex(userId.(string))
		c.JSON(200, gin.H{"getTransfromAlex": trans})
	})

	r.GET("/tree", checkJWT(), routes.GetTree)
	r.POST("/changeReqSemester", checkJWT(), routes.ChangeReqSemester)
	r.GET("/getElectivesForReq", checkJWT(), routes.GetElectiveCoursesForReq)
	r.GET("/getElectivesForReqZach", checkJWT(), routes.GetElectiveCoursesForReqZach)
	r.POST("/setElectiveCourse", checkJWT(), routes.SetReqCourse)

	r.GET("/userName", checkJWT(), func(c *gin.Context) {
		if user, ok := c.Get("user"); !ok {
			fmt.Printf("User not valid")
			c.JSON(400, gin.H{"error": "Invalid user token"})
			return
		} else {
			var res models.User
			db.GORM.Where("id = ?", user.(string)).Find(&res)
			c.JSON(200, gin.H{"data": res.Name})
		}
	})

	// Receive schedule request from frontend
	r.POST("/getSchedule", checkJWT(), func(c *gin.Context) {
		// Map JSON to struct
		var json sched.JSONFilter
		if err := c.ShouldBindJSON(&json); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if user, ok := c.Get("user"); !ok {
			fmt.Printf("User not valid")
			c.JSON(400, gin.H{"error": "Invalid user token"})
		} else {
			c.JSON(200, gin.H{"data": scheduler.PullCourses(&json, user.(string))})
		}
	})

	// Return list of sections a specific user can take
	r.GET("/getSchedule", checkJWT(), func(c *gin.Context) {
		// in the future user will be sent as header
		if user, ok := c.Get("user"); !ok {
			fmt.Printf("User not valid")
			c.JSON(400, gin.H{"error": "Invalid user token"})
		} else {
			c.JSON(200, gin.H{"data": scheduler.RunSchedulerFirst(user.(string))})
		}
	})

	r.POST("/updateAlexTrans", checkJWT(), func(c *gin.Context) {

		var json updateTransPOSTBody
		if err := c.ShouldBindJSON(&json); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userId, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid user",
			})
			return
		}
		fmt.Println(json)
		db.UpdateAlexTrans(json.FROM, json.TO, userId.(string))
		done := "done"
		c.JSON(200, gin.H{"UpdateAlexTrans": done})
	})

	r.POST("/clearCourse", checkJWT(), func(c *gin.Context) {
		fmt.Println("GOT TO CLEAR COURSE BACK END")
		var json updateClearPOSTBody
		if err := c.ShouldBindJSON(&json); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userId, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid user",
			})
			return
		}
		fmt.Println(json)
		db.ClearAlexTrans(json.FROM, userId.(string))
		done := "done"
		c.JSON(200, gin.H{"ClearAlexTrans": done})
	})

	r.POST("/setCourse", checkJWT(), func(c *gin.Context) {
		fmt.Println("GOT TO SET COURSE BACK END")
		var json updateSetPOSTBody
		if err := c.ShouldBindJSON(&json); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userId, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid user",
			})
			return
		}
		fmt.Println(json)
		db.SetAlexTrans(uint(json.FROM), json.SUB, json.NUM, userId.(string))
		done := "done"
		c.JSON(200, gin.H{"SetAlexTrans": done})
	})

	r.POST("/updateGrades", checkJWT(), func(c *gin.Context) {
		var json updateGradePOSTBody
		if err := c.ShouldBindJSON(&json); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error,
			})
			return
		}
		userId, ok := c.Get("user")
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid user",
			})
			return
		}
		db.UpdateGrades(userId.(string), json.Sub, json.Num, json.Grade)
		done := "done"
		c.JSON(200, gin.H{
			"UpdatedGrades": done,
		})
	})

	r.Run(":8081") // listen and serve on 0.0.0.0:8081
	//r.RunTLS(":8081", "cert.pem", "key.pem")
}
