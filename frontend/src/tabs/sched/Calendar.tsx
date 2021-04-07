// @ts-nocheck
import * as React from 'react';
import { ViewState } from '@devexpress/dx-react-scheduler';
import {
    Scheduler as Sched,
    Resources,
    WeekView,
    Appointments,
    AppointmentTooltip,
} from '@devexpress/dx-react-scheduler-material-ui';
import {
    Paper,
    Grid,
    withStyles
} from '@material-ui/core';
import {
    Room,
    Person,
    CastForEducation
} from '@material-ui/icons';
import { isEmpty } from 'lodash';

const style = ({ palette }: { palette: any }) => ({
    icon: {
        color: palette.action.active,
    },
    textCenter: {
        textAlign: 'center',
    },
    commandButton: {
        backgroundColor: 'rgba(255,255,255,0.65)',
    },
})

const Content = withStyles(style, { name: 'Content' })(({
    children, appointmentData, classes, ...restProps
}: { children: any, appointmentData: any, classes: any }) => (
    <AppointmentTooltip.Content {...restProps} appointmentData={appointmentData}>
        <Grid container alignItems="center">
            <Grid item xs={2} className={classes.textCenter}>
                <CastForEducation className={classes.icon} />
            </Grid>
            <Grid item xs={10}>
                {/* handle the credit(s) plural/singular */}
                <span>{appointmentData.credits} credit{appointmentData.credits > 1 && 's'}</span>
            </Grid>
            <Grid item xs={2} className={classes.textCenter}>
                <Person className={classes.icon} />
            </Grid>
            <Grid item xs={10}>
                <span>{appointmentData.prof}</span>
            </Grid>
            <Grid item xs={2} className={classes.textCenter}>
                <Room className={classes.icon} />
            </Grid>
            <Grid item xs={10}>
                <span>{appointmentData.location}</span>
            </Grid>
        </Grid>
    </AppointmentTooltip.Content>
));

const CommandButton = withStyles(style, { name: 'CommandButton' })(({
    classes, ...restProps
}) => (
    <AppointmentTooltip.CommandButton {...restProps} className={classes.commandButton} />
));

export default function Calendar({ schedule }: { schedule: any }) {
    // monday at start of fall 2020
    const currentDate = '2020-08-24';

    if (isEmpty(schedule)) {
        schedule = {
            startHour: 6,
            endHour: 18,
            courses: [],
            schedule: [],
        }
    }

    return (
        < Paper >
            <Sched
                data={schedule.schedule}
            >
                <ViewState
                    currentDate={currentDate}
                />
                <WeekView
                    // constrain calendar to the course hours
                    startDayHour={schedule.startHour}
                    endDayHour={schedule.endHour}
                    excludedDays={[0, 6]}
                />
                <Appointments />
                <AppointmentTooltip
                    contentComponent={Content}
                    commandButtonComponent={CommandButton}
                    showCloseButton
                />
                <Resources
                    data={schedule.courses}
                    mainResourceName="course"
                />
            </Sched>
        </Paper >
    )
}
