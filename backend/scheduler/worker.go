package scheduler

import (
	sched "curriculum-utility/models/sched"
)

// Worker is a ds sent by request to the worker pool
type Worker struct {
	Data *sched.Filters
	// which course to start on
	Index int
	Sched *sched.Schedule
}

// StartWorkers tells numWorkers to start up and wait for requests
func StartWorkers(numWorkers int) {
	for i := 0; i < numWorkers; i++ {
		go worker()
	}
}

// worker asks for work and runs scheduling algorithm
func worker() {
	// run infinitely
	for {
		work := <-WorkerChan

		// start recursive function with default parameters
		sched := sched.EmptySchedule()

		findOptimalSchedule(work.Data, &sched, work.Index)

		// tell master we finished and want another task
		work.Data.WG.Done()
	}
}
