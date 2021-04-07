import * as React from 'react';
import { useMemo, useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    createStyles,
    Theme,
    makeStyles,
    Drawer,
    Divider,
    Toolbar,
    CircularProgress,
    Typography,
} from '@material-ui/core';
import { useAuth0 } from "@auth0/auth0-react";
import { useQuery, useQueryClient } from 'react-query';
import { isEmpty } from 'lodash';

import { generateAPIState, loadApiData, loadQuery } from '../../resources/ApiCall';

import Calendar from './Calendar';
import Data from './Data';

// Define styling for Tree component
const drawerWidth = 350;
const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        calendar: {
            width: '100%',
            maxHeight: '700px',
            overflow: 'scroll'
        },
        root: {
            width: '100%',
            height: '100%',
            // overflow: 'hidden',
            display: 'flex',
            backgroundColor: theme.palette.background.paper,
        },
        loading: {
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: drawerWidth,
        },
        header: {
            marginLeft: theme.spacing(2),
        },
    }),
);

Date.prototype.toMilitary = function (): number {
    var res = "";

    res += this.getHours();
    var minutes = '' + this.getMinutes();
    if (minutes.length == 1) {
        // 4 minutes turns to 04
        // makes sure that things like 8:04am turn into 804 instead of 84
        minutes = "0" + minutes;
    }

    res += minutes;

    return parseInt(res);
}

function handleError(err: any) {
    console.log("Scheduler failed with error", err);
}

function createSchedule(schedule: any, allSections: any): any {
    var sectionSet = new Set(schedule.sectionList);

    var scheduleCalendar = {} as any;
    scheduleCalendar.schedule = [] as any[];
    var reactSchedule = scheduleCalendar.schedule;
    scheduleCalendar.courses = [] as any[];
    scheduleCalendar.courses.push({
        fieldName: 'course',
        title: 'Course',
        instances: []
    })

    var scheduleDetails = {} as any;
    scheduleDetails.credits = 0;
    scheduleDetails.courses = [] as any[];
    scheduleDetails.weights = schedule.filters.weights;
    var temp;
    if (schedule.Best <= 0) {
        console.error("Schedule best is 0", schedule);
        temp = 0;
    } else {
        temp = schedule.Score / schedule.Best;
    }

    // get percentage of maximum score
    scheduleDetails.score = Math.round(temp * 100) + "%";

    var startHour = 2400;
    var endHour = 0;

    var schedDOW = [false, false, false, false, false];
    var failedEndTime = false;
    var failedStartTime = false;
    schedule.filters.start = (new Date(schedule.filters.startDate)).toMilitary();
    schedule.filters.end = (new Date(schedule.filters.endDate)).toMilitary();
    filteredSection = [];

    asyncList.forEach((section: any) => {
        if (!sectionSet.has(section.crn)) {
            return;
        }

        section.section += " (Async Course)";
        filteredSection.push(section);
        scheduleDetails.credits += section.credits;
    })

    allSections.forEach((section: any) => {
        if (!sectionSet.has(section.crn)) {
            return;
        }

        filteredSection.push(section);
        scheduleDetails.credits += section.credits;
        scheduleDetails.courses.push(section);

        if (section.start < startHour) {
            startHour = section.start;
        }
        if (section.start < schedule.filters.start) {
            failedStartTime = true;
        }

        if (section.end > endHour) {
            endHour = section.end;
        }
        if (section.end > schedule.filters.end) {
            failedEndTime = true;
        }

        section.dow.forEach((day: any) => {
            schedDOW[day] = true;
            var date = "2020-08-" + (24 + day).toString();
            var obj = {
                startDate: date + "T" + convertTime(section.start),
                endDate: date + "T" + convertTime(section.end),
                location: "Online - Remote",
                prof: section.prof,
                title: section.subject + " " + section.num + "-" + section.section + " (" + parseInt(section.crn) + ")",
                course: section.name,
                credits: section.credits,
            }

            reactSchedule.push(obj);
        });

        // add a color for calendar to distinguish sections
        scheduleCalendar.courses[0].instances.push({
            text: section.name,
            id: section.name,
        });
    });

    var timeDetails = "";
    if (!failedStartTime && !failedEndTime) {
        timeDetails = "All courses fall within the requested time slots";
    } else {
        var options = {} as Intl.DateTimeFormatOptions;
        options.hour = "2-digit";
        options.minute = "2-digit";
        if (failedStartTime) {
            timeDetails = "At least one course starts before " + (new Date(schedule.filters.startDate)).toLocaleTimeString("en-US", options) + ". ";
        }

        if (failedEndTime) {
            timeDetails += "At least one course ends after " + (new Date(schedule.filters.endDate)).toLocaleTimeString("en-US", options) + ".";
        }
    }

    var creditDetails = "";
    if (scheduleDetails.credits != schedule.filters.credits) {
        creditDetails = "Schedule has " + scheduleDetails.credits + " credits but you requested " + schedule.filters.credits;
    } else {
        creditDetails = "Schedule meets your request of " + scheduleDetails.credits + " credits.";
    }

    var unmatchedHasDay = [] as any[];
    var unmatchedDoesNotHaveDay = [] as any[];

    var filterDOW = schedule.filters.dow;
    var daysOfWeek = ["M", "T", "W", "R", "F"];
    for (var i = 0; i < schedDOW.length; i++) {
        if (filterDOW[i] != schedDOW[i]) {
            // doesn't match request
            if (filterDOW[i]) {
                // wanted day, but didn't get it
                unmatchedDoesNotHaveDay.push(daysOfWeek[i])
            } else {
                unmatchedHasDay.push(daysOfWeek[i])
            }
        }
    }

    var balancedDetails = "";
    if (unmatchedHasDay.length == 0 && unmatchedDoesNotHaveDay.length == 0) {
        balancedDetails = "Days of the week match your request.";
    } else {
        if (unmatchedDoesNotHaveDay.length > 0) {
            balancedDetails = "You requested classes on ";
            if (unmatchedDoesNotHaveDay.length == 1) {
                balancedDetails += unmatchedDoesNotHaveDay[0];
            } else {
                const last = unmatchedDoesNotHaveDay.pop();
                balancedDetails += unmatchedDoesNotHaveDay.join(', ') + ' and ' + last;
            }
            balancedDetails += " but the schedule doesn't have courses then. ";
        }

        if (unmatchedHasDay.length > 0) {
            balancedDetails += "You did not want classes on ";
            if (unmatchedHasDay.length == 1) {
                balancedDetails += unmatchedHasDay[0];
            } else {
                const last = unmatchedHasDay.pop();
                balancedDetails += unmatchedHasDay.join(', ') + ' or ' + last;
            }
            balancedDetails += " but the schedule has courses these days.";
        }
    }

    scheduleDetails.details = {
        time: timeDetails,
        credits: creditDetails,
        balanced: balancedDetails,
    };

    // convert military time to the hour of the day
    scheduleCalendar.startHour = Math.floor(startHour / 100);
    scheduleCalendar.endHour = Math.ceil(endHour / 100);

    return [scheduleCalendar, scheduleDetails];
}

function convertTime(time: string): string {
    time = time.toString();
    if (time.length == 3) {
        // time format 905
        time = "0" + time;
    }

    // turn time 1125 into 11:25
    return time.substr(0, 2) + ":" + time.substr(2);
}

function arraysEqual(a: any, b: any) {
    if (a === b) return true;
    if (a == null || b == null || a.length == 0 || b.length == 0) return true;
    if (a.length !== b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// Globals, to avoid being overwritten on re-render
var scheduleDetails = {};
var calendar: any = null;
var filteredSection: any = [];
// list of all sections - mimics tree semester
var sectionList: any = [];
// list of sections that went into the last schedule POST
var scheduleSectionList: any = [];
var firstTime: boolean = true;
var asyncList: any = [];
var filters: any = {};
var needToSubmitFilter = false;

export default function Scheduler() {
    const classes = useStyles();
    const { getAccessTokenSilently } = useAuth0();
    const queryClient = useQueryClient();
    const filter = generateAPIState();

    const [updated, setUpdated] = useState<boolean>(false);
    const [filterUpdated, setFilterUpdated] = useState<boolean>(false);

    function resetBooleanSubmission() {
        needToSubmitFilter = false;
    }

    const submitFilter = {
        submitBool: needToSubmitFilter,
        resetBool: resetBooleanSubmission
    }

    if (sectionList.length > 0 && firstTime) {
        firstTime = false;
        scheduleSectionList = sectionList;
    }

    // grab the sections list from the server or cache (react-query)
    var sched: any = useQuery('schedule', () =>
        loadQuery(() => {
            return [window.__BACKEND_IP__ + "/getSchedule", {}];
        }, getAccessTokenSilently), {
        refetchOnWindowFocus: false,
    });

    if (sched.isLoading) {
        return (
            <div className={classes.loading}>
                <CircularProgress size={100} />
            </div>
        )
    } else if (!updated && !sched.isLoading && !isEmpty(sched.data)) {
        // first time sections/schedule is loaded upon opening scheduler
        setUpdated(true);
        if (!isEmpty(sched.data.data.sections) && !arraysEqual(scheduleSectionList.map((section: any) => section.crn).sort(), sched.data.data.sections.map((section: any) => section.crn).sort())) {
            needToSubmitFilter = true;
        } else {
            needToSubmitFilter = false;
        }
        instantiateSectionsAndSchedule(sched.data.data);
    }

    function instantiateSectionsAndSchedule(data: any) {
        // make a mapping of CRN to course so we can use it for the scheduler
        if (isEmpty(data)) {
            console.error("404 on server side")
            return;
        } else if (isEmpty(data.sections)) {
            // no updates from the tree, no need to update section list
            if (sectionList.length == 0) {
                console.log("We should have a prior section list, error!");
                return
            }
        } else {
            // tree was updated, here's a new list of potential sections
            setSections(data.sections, isEmpty(data.async) ? [] : data.async);
        }

        if (!isEmpty(data.schedule.filters)) {
            filters = data.schedule.filters;
            filters.semester = data.schedule.semester;
            filters.weights = [filters.timeWeight, filters.creditWeight, filters.balancedWeight];
        }

        if (!data.schedule.sectionList || data.schedule.sectionList.length == 0) {
            return
        }

        // user had a schedule persisting from last reload or submitted for a new one
        var scheduleData, details: any;
        [scheduleData, details] = createSchedule(data.schedule, sectionList);
        if (scheduleData.schedule.length == 0) {
            // no courses available somehow ?
            console.log("No courses to view for scheduler");
            return;
        }

        calendar = <Calendar schedule={scheduleData} />
        scheduleDetails = details;
    }

    function setSections(list: any, asyncSections: any) {
        sectionList = list;
        asyncList = asyncSections;
    }

    function formSubmitted(data: any) {
        filters = data;

        scheduleSectionList = sectionList;
        needToSubmitFilter = false;

        setFilterUpdated(false);
        loadApiData(() => {
            return [window.__BACKEND_IP__ + "/getSchedule", {
                method: "post",
                body: JSON.stringify(data),
            }];
        }, filter.setLoading, filter.setData, handleError, getAccessTokenSilently);
    }

    if (filter.loading) {
        // waiting for schedule to load
        scheduleDetails = false;
    } else if (!filterUpdated && !isEmpty(filter.data) && !isEmpty(sectionList)) {
        // schedule was loaded
        setFilterUpdated(true);
        // create schedule from the CRNs and list of sections
        instantiateSectionsAndSchedule(filter.data.data);

        // sections cache is now invalid because scheduler is more up to date
        queryClient.invalidateQueries('schedule');
    }

    return (
        <div className={classes.root}>
            <Drawer
                variant="permanent"
                className={classes.drawer}
                classes={{
                    paper: classes.drawerPaper
                }}
            >
                <Toolbar />
                <Data data={scheduleDetails} sendFormData={formSubmitted} cachedFilters={filters} needUpdate={submitFilter} />
                <Divider />
                <Typography variant="h5" className={classes.header}>Schedule Sections</Typography>
                <List
                    component="nav"
                >
                    {filteredSection.length == 0 &&
                        <ListItem>
                            <ListItemText primary="No classes yet in the schedule"></ListItemText>
                        </ListItem>}
                    {filteredSection.map((section: any) => (
                        <ListItem key={section.crn}>
                            <ListItemText
                                key={section.crn}
                                primary={`${section.subject} ${section.num}-${section.section}`}
                                secondary={`${section.name}`} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <div className={classes.calendar}>
                {calendar}
            </div>
        </div>
    )
}
