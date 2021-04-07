package tree

import (
	"curriculum-utility/db"
	"curriculum-utility/models"
	"encoding/json"
	"fmt"
	"strings"

	"gopkg.in/guregu/null.v4"
)

func AbsInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func GetTree(userId string) *map[string]interface{} {
	// Create an empty nodes array to hold our json nodes
	var nodes []map[string]interface{}

	// Create an empty errors array to hold any tree errors
	errors := make([]map[string]interface{}, 0)

	// Get user
	var user models.User
	db.GORM.First(&user, "id = ?", userId)

	// Get curriculum requirements for this user
	var curriculumReqs []models.CurriculumReqs
	db.GORM.Where("curriculum_id = ?", user.CurriculumID).Find(&curriculumReqs)

	// Get planned courses for this user
	var plannedCourses []models.PlannedCourse
	db.GORM.Where("user_id = ?", user.ID).Find(&plannedCourses)

	// Get student grades
	var grades []models.ReportCard
	db.GORM.Where("user_id = ?", user.ID).Find(&grades)

	// Create a hashmap of user's planned courses to reference later
	var plannedCoursesMap = make(map[uint]models.PlannedCourse)
	for _, plan := range plannedCourses {
		plannedCoursesMap[plan.CurriculumReqsID] = plan
	}

	// Initialize a map of course -> index for creating prereq edges
	type SimpleCourse struct {
		Subject string
		Num     string
	}
	var courseIndices = make(map[SimpleCourse]int)

	// Initialize a map of course -> grade to check later if student has satisfied course
	var courseGrades = make(map[SimpleCourse]string)
	for _, grade := range grades {
		courseGrades[SimpleCourse{
			Subject: grade.CourseSubject,
			Num:     grade.CourseNum,
		}] = grade.Grade
	}

	// Map curriculum requirements to nodes
	for i, _ := range curriculumReqs {
		// Fill in the course, electivetype, and course prereqs for this requirement
		req := &curriculumReqs[i]
		if !req.IsElective {
			db.GORM.Model(req).Association("Course").Find(&req.Course)
		} else {
			db.GORM.Model(req).Association("ElectiveType").Find(&req.ElectiveType)
		}

		// Initialize a new node
		node := make(map[string]interface{})

		// Map values based on requirement type
		if req.IsElective {
			node["requirementType"] = "elective"
			// If elective, map elective name
			node["name"] = req.ElectiveType.Name
		} else {
			node["requirementType"] = "course"
			// If course, map course values
			node["course"] = map[string]interface{}{
				"subject": req.Course.Subject,
				"num":     req.Course.Num,
				"credits": req.Course.Credits,
				"prereqs": req.Course.Prereqs,
			}

			// Record the index of the course for managing prereqs edges
			courseIndices[SimpleCourse{
				Subject: req.Course.Subject,
				Num:     req.Course.Num,
			}] = i
		}

		// Add remaining fields
		node["semester"] = req.SuggestedSemester
		node["satisfied"] = false
		node["curriculumReqID"] = req.ID

		// Check if the user has made a modification to this requirement
		if plan, ok := plannedCoursesMap[req.ID]; ok {
			if req.IsElective {
				// Find course and it's prereqs for this planned course
				db.GORM.Model(&plan).Association("Course").Find(&plan.Course)

				// Update course if it is set
				if plan.Course.Subject != "NONE" {
					node["course"] = map[string]interface{}{
						"subject": plan.Course.Subject,
						"num":     plan.Course.Num,
						"credits": plan.Course.Credits,
						"prereqs": plan.Course.Prereqs,
					}

					// Record the index of the course (if it exists) for managing prereqs
					courseIndices[SimpleCourse{
						Subject: plan.Course.Subject,
						Num:     plan.Course.Num,
					}] = i
				}
			}

			// Update semester for this node
			node["semester"] = plan.Semester
		}

		// If this node has a course, check if it has been satisfied or not
		if course, ok := node["course"].(map[string]interface{}); ok {
			// First, check if this is an AP credit, if so, automatically satisfy it
			if node["semester"].(null.Int).Int64 == 0 {
				node["satisfied"] = true
			} else {
				// If not an AP course, check if course has a grade in the grade map
				if grade, ok := courseGrades[SimpleCourse{
					Subject: course["subject"].(string),
					Num:     course["num"].(string),
				}]; ok {
					// Ensure grade is not IP or IC
					if grade != "IP" && grade != "IC" {
						node["satisfied"] = true
					}
				}
			}
		}

		// Append this node to our list of nodes
		nodes = append(nodes, node)
	}

	// Create an empty edges array to hold our prereq edges
	edges := make([]map[string]int, 0)

	var prereqNodeAsString func(prereqs map[string]interface{}) string
	prereqNodeAsString = func(prereqs map[string]interface{}) string {
		if prereqs["type"] == "COURSE" {
			return prereqs["subject"].(string) + " " + prereqs["num"].(string)
		}

		if prereqs["type"] == "AND" {
			stringSlice := make([]string, 0)
			for _, m := range prereqs["members"].([]interface{}) {
				member := m.(map[string]interface{})
				stringSlice = append(stringSlice, prereqNodeAsString(member))
			}
			return "(" + strings.Join(stringSlice, " and ") + ")"
		}

		if prereqs["type"] == "OR" {
			stringSlice := make([]string, 0)
			for _, m := range prereqs["members"].([]interface{}) {
				member := m.(map[string]interface{})
				stringSlice = append(stringSlice, prereqNodeAsString(member))
			}
			return "(" + strings.Join(stringSlice, " or ") + ")"
		}

		return ""
	}

	var checkPrereqs func(prereqs map[string]interface{}, i int, node map[string]interface{}) ([]map[string]interface{}, []int, int)
	checkPrereqs = func(prereqs map[string]interface{}, i int, node map[string]interface{}) ([]map[string]interface{}, []int, int) {
		if prereqs["type"] == "COURSE" {
			// Look up this prereq in the tree to see if it exists somewhere
			if prereqIndex, ok := courseIndices[SimpleCourse{
				Subject: prereqs["subject"].(string),
				Num:     prereqs["num"].(string),
			}]; ok {
				// If so, return the index and semester to decide later if an edge should be drawn
				return nil, []int{prereqIndex}, int(nodes[prereqIndex]["semester"].(null.Int).Int64)
			}
			// If prereq is not in tree, return an error for this course
			course := node["course"].(map[string]interface{})
			err := []map[string]interface{}{
				{
					"curriculumReqIDs": node["curriculumReqID"],
					"error": fmt.Sprintf("%s %s is missing required prerequisite %s %s",
						course["subject"].(string), course["num"].(string),
						prereqs["subject"].(string), prereqs["num"].(string)),
				},
			}
			return err, nil, 0
		}

		if prereqs["type"] == "AND" {
			// Iterate through all members listed and return any and all errors recieved
			errors := make([]map[string]interface{}, 0)
			prereqIndices := make([]int, 0)
			latestSemester := 0
			for _, m := range prereqs["members"].([]interface{}) {
				member := m.(map[string]interface{})
				err, indices, semester := checkPrereqs(member, i, node)
				if err != nil {
					errors = append(errors, err...)
				}
				prereqIndices = append(prereqIndices, indices...)
				if semester > latestSemester {
					latestSemester = semester
				}
			}
			if len(errors) == 0 {
				return nil, prereqIndices, latestSemester
			}
			return errors, prereqIndices, latestSemester
		}

		if prereqs["type"] == "OR" {
			// Iterate through all members listed and return an error only if all members returned an error
			oneSuccess := false
			prereqIndicesClosestValid := []int{}
			closestValidSemester := -1
			prereqIndicesClosest := []int{}
			closestSemester := -1
			for _, m := range prereqs["members"].([]interface{}) {
				member := m.(map[string]interface{})
				err, indices, semester := checkPrereqs(member, i, node)
				if err == nil {
					oneSuccess = true
					if semester < int(node["semester"].(null.Int).Int64) && semester > closestValidSemester {
						closestValidSemester = semester
						prereqIndicesClosestValid = indices
					} else if closestSemester == -1 || (AbsInt(semester-int(node["semester"].(null.Int).Int64)) < AbsInt(closestSemester-int(node["semester"].(null.Int).Int64))) {
						closestSemester = semester
						prereqIndicesClosest = indices
					}
				}

			}
			if oneSuccess {
				if closestValidSemester != -1 {
					return nil, prereqIndicesClosestValid, closestValidSemester
				}
				return nil, prereqIndicesClosest, closestSemester
			}

			// If all members returned an error, return a single error that lists the user's options
			course := node["course"].(map[string]interface{})
			return []map[string]interface{}{
				{
					"curriculumReqIDs": node["curriculumReqID"],
					"error": fmt.Sprintf("%s %s is missing required prerequisites: %s",
						course["subject"].(string), course["num"].(string), prereqNodeAsString(prereqs)),
				},
			}, []int{}, 0
		}

		return nil, []int{}, 0
	}

	// Iterate through nodes and create edges for prereqs
	for i, node := range nodes {
		// Check if this node has a course
		if course, ok := node["course"].(map[string]interface{}); ok {
			// Check for prereqs only if this is not an AP credit
			if node["semester"].(null.Int).Int64 != 0 {
				// Get the prereq JSON for this course
				prereqs := course["prereqs"].(null.String)
				// Check if this value is null or not
				if prereqs.Valid {
					// Get the prereq json as a map[string]interface{}
					jsonBlob := []byte(prereqs.String)
					var prereqJson map[string]interface{}
					json.Unmarshal(jsonBlob, &prereqJson)

					// Check that all required prereqs are met recursively
					prereqErrors, prereqIndices, _ := checkPrereqs(prereqJson, i, node)
					for _, prereqIndex := range prereqIndices {
						// Create an edge from each prereq returned from checkPrereqs to the current node
						edges = append(edges, map[string]int{
							"from": prereqIndex,
							"to":   i,
						})
					}
					if prereqErrors != nil {
						errors = append(errors, prereqErrors...)
					}
				}
			}
			// Remove "prereqs" field from node, no longer needed as graph edge has been made
			delete(course, "prereqs")
		}
	}

	// TODO: Handle "satisfied" courses using student transcript

	return &map[string]interface{}{
		"nodes":  nodes,
		"edges":  edges,
		"errors": errors,
	}
}
