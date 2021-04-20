import * as React from 'react';
import { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Grid,
    Tooltip,
    TextField,
    Dialog,
    DialogTitle,
    FormControl,
    Box,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Typography,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { List } from '@material-ui/icons';
import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
} from '@material-ui/pickers';
import { isEmpty } from 'lodash';

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

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        formControl: {
            margin: theme.spacing(1),
            minWidth: 140,
        },
        formGroup: {
            alignItems: 'center'
        },
        weights: {
            margin: theme.spacing(5),
        },
        spacedForm: {
            margin: theme.spacing(5),
        }
    }),
);

export interface ModalProps {
    open: boolean,
    onClose: () => void,
    sendFormData: (data: any) => void,
    updated: boolean,
    setUpdated: (data: boolean) => void,
    filters: any,
}

const timeFilterTooltip = (start: Date, end: Date) => {
    var options = {} as Intl.DateTimeFormatOptions;
    options.hour = "2-digit";
    options.minute = "2-digit";
    return "How important is having classes that start after "
        + (new Date(start)).toLocaleTimeString("en-US", options)
        + " and end before " + (new Date(end)).toLocaleTimeString("en-US", options) + "?";
}
const creditsFilterTooltip = (credits: number) => {
    return "How important is having " + credits + " credits this semester?";
}

const balancedFilterTooltip = (checkBoxes: any[]) => {
    var dow = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    var daysOff = [];
    for (var i = 0; i < checkBoxes.length; i++) {
        if (!checkBoxes[i]) {
            daysOff.push(i);
        }
    }

    var res = "How important is having ";
    if (daysOff.length == 0) {
        return res + "a balanced schedule every day of the week?";
    }

    res += "no classes on ";
    if (daysOff.length == 1) {
        res += dow[daysOff[0]];
    } else {
        for (var i = 1; i < daysOff.length - 1; i++) {
            res += dow[daysOff[i]] + ", ";
        }

        res += dow[daysOff[daysOff.length - 2]] + " or " + dow[daysOff[daysOff.length - 1]];
    }

    return res + "?";
}

function evaluateTimeErrors(filters: any) {
    if (filters.end > 2400) {
        filters.errors.endError = "End time should be valid";
    } else if (filters.end < filters.start)
        filters.errors.endError = "End time should be after start";
    else
        filters.errors.endError = "";

    if (filters.start < 600) {
        filters.errors.startError = "Start time should be after 6am";
    } else if (filters.start > filters.end)
        filters.errors.startError = "Start time should be before end";
    else
        filters.errors.startError = "";
}

var timeTooltip = "";
var creditsTooltip = "";
var balancedTooltip = "";

function FilterModal(props: ModalProps) {
    const { onClose, sendFormData, open, filters, updated, setUpdated } = props;

    useEffect(() => {
        timeTooltip = timeFilterTooltip(filters.startDate, filters.endDate);
        creditsTooltip = creditsFilterTooltip(filters.credits);
        balancedTooltip = balancedFilterTooltip(filters.dow);
        filters.errors = {
            creditError: "",
            startError: "",
            endError: "",
        }
    }, [filters]);

    const names = ["Start/End Time", "Credits", "Balanced"];
    var tooltips = [timeTooltip, creditsTooltip, balancedTooltip];

    const marks: any[] = [
        {
            value: 0,
            label: "Unimportant"
        },
        {
            value: 100,
            label: "Very Important"
        },
    ];

    const [filtersOpen, setFiltersOpen] = useState(false);
    const forceUpdate: () => void = useState()[1].bind(null, {})

    function updateWeights(n: any, evt: any, key: any, payload: any) {
        var tempWeights = filters.weights.map((val: any, inx: any) => {
            return (inx === n) ? key : val;
        });

        const sum = tempWeights.reduce((sum: any, val: any) => sum + val, 0);
        const diff = sum - 99;
        let remainder = 0;

        for (let i in tempWeights) {
            if (i != n) {
                //don't modify the slider which is being dragged
                let val = tempWeights[i] - diff / (tempWeights.length - 1);
                // TODO fix math on this condition
                if (val < 0) {
                    remainder += val;
                    val = 0;
                }

                tempWeights[i] = val;
            }
        }

        if (remainder) {
            const filteredLength = tempWeights.filter(
                (val: any, key: any) => val > 0 && key !== n
            ).length;
            for (let i in tempWeights) {
                if (i != n && tempWeights[i] > 1) {
                    tempWeights[i] = tempWeights[i] + remainder / filteredLength;
                }
            }
        }

        filters.weights = tempWeights;
        setUpdated(true);
        forceUpdate();
    }

    const toggleFilters = (event: any) => {
        setFiltersOpen(!filtersOpen);
    };

    var classes = useStyles();

    const handleCreditChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        filters.credits = parseInt(event.target.value);
        creditsTooltip = creditsFilterTooltip(filters.credits);
        if (filters.credits < 1)
            filters.errors.creditError = "Credits should be at least 1";
        else if (filters.credits > 19)
            filters.errors.creditError = "Credits can be at most 19";
        else
            filters.errors.creditError = "";

        setUpdated(true);
        forceUpdate();
    }

    const handleStartChange = (date: Date | null) => {
        filters.startDate = date;

        filters.start = (new Date(filters.startDate)).toMilitary();
        evaluateTimeErrors(filters);

        timeTooltip = timeFilterTooltip(date, filters.endDate);
        setUpdated(true);
        forceUpdate();
    };

    const handleEndChange = (date: Date | null) => {
        filters.endDate = date;

        filters.end = (new Date(filters.endDate)).toMilitary();
        evaluateTimeErrors(filters);

        timeTooltip = timeFilterTooltip(filters.startDate, date);
        setUpdated(true);
        forceUpdate();
    };

    const handleCheckChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // checkbox clicked, update dow
        var dow = parseInt(event.target.value);
        filters.dow[dow] = !filters.dow[dow];
        balancedTooltip = balancedFilterTooltip(filters.dow);
        setUpdated(true);
        forceUpdate();
    };


    const handleSemesterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        filters.semester = parseInt(event.target.value);
        setUpdated(true);
        forceUpdate();
    };

    const handleClose = () => {
        onClose();
    };

    const submitForm = () => {
        if (!updated || filters.errors.startError || filters.errors.endError || filters.errors.creditError) {
            // don't submit yet
            return;
        }
        setUpdated(false);

        var body = { ...filters };
        // ensure that weights are not 0 (move to 1 at the lowest)
        body.timeWeight = filters.weights[0];
        body.creditWeight = filters.weights[1];
        body.balancedWeight = filters.weights[2];
        sendFormData(body);
    }

    return (
        <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
            <DialogTitle id="simple-dialog-title">Schedule Filters</DialogTitle>
            <FormControl component="fieldset" variant="outlined" className={classes.spacedForm}>
                <Grid container justify="space-around">
                    <FormControl className={classes.formControl}>
                        <InputLabel id="semester">Semester</InputLabel>
                        <Select
                            labelId="semester"
                            id="semesterSelect"
                            value={filters.semester}
                            onChange={handleSemesterChange}
                        >
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={3}>3</MenuItem>
                            <MenuItem value={4}>4</MenuItem>
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={6}>6</MenuItem>
                            <MenuItem value={7}>7</MenuItem>
                            <MenuItem value={8}>8</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <TextField
                            type="number"
                            InputProps={{
                                inputProps: {
                                    max: 19, min: 1
                                }
                            }}
                            label="Credits"
                            error={filters.errors && filters.errors.creditError != ""}
                            helperText={filters.errors ? filters.errors.creditError : ""}
                            onChange={handleCreditChange}
                            defaultValue={filters.credits}
                        />
                    </FormControl>
                </Grid>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <Grid container justify="space-around">
                        <KeyboardTimePicker
                            margin="normal"
                            id="time-picker-start"
                            label="Starts After"
                            value={filters.startDate}
                            error={filters.errors && filters.errors.startError != ""}
                            helperText={filters.errors ? filters.errors.startError : ""}
                            onChange={handleStartChange}
                            KeyboardButtonProps={{
                                'aria-label': 'change start time',
                            }}
                        />
                        <KeyboardTimePicker
                            margin="normal"
                            id="time-picker-end"
                            label="Ends Before"
                            value={filters.endDate}
                            error={filters.errors && filters.errors.endError != ""}
                            helperText={filters.errors ? filters.errors.endError : ""}
                            onChange={handleEndChange}
                            KeyboardButtonProps={{
                                'aria-label': 'change end time',
                            }}
                        />
                    </Grid>
                </MuiPickersUtilsProvider>
                <br />
                <Box bgcolor="background.paper" m={3}>
                    <Tooltip title="Days of the week to have class" aria-label="dow">
                        <FormGroup aria-label="position" row>
                            <FormControlLabel
                                value="0"
                                control={<Checkbox defaultChecked={filters.dow[0]} color="primary" onChange={handleCheckChange} />}
                                label="M"
                                labelPlacement="top"
                            />
                            <FormControlLabel
                                value="1"
                                control={<Checkbox defaultChecked={filters.dow[1]} color="primary" onChange={handleCheckChange} />}
                                label="T"
                                labelPlacement="top"
                            />
                            <FormControlLabel
                                value="2"
                                control={<Checkbox defaultChecked={filters.dow[2]} color="primary" onChange={handleCheckChange} />}
                                label="W"
                                labelPlacement="top"
                            />
                            <FormControlLabel
                                value="3"
                                control={<Checkbox defaultChecked={filters.dow[3]} color="primary" onChange={handleCheckChange} />}
                                label="R"
                                labelPlacement="top"
                            />
                            <FormControlLabel
                                value="4"
                                control={<Checkbox defaultChecked={filters.dow[4]} color="primary" onChange={handleCheckChange} />}
                                label="F"
                                labelPlacement="top"
                            />
                        </FormGroup>
                    </Tooltip>
                </Box>
                <br />
                <Tooltip title="Show the relative importance of each filter" aria-label="filter">
                    <Button color="secondary" onClick={toggleFilters}>
                        {filtersOpen ? "Hide" : "Show"} advanced filter weights
                    </Button>
                </Tooltip>
                {filtersOpen && (
                    <div className={classes.weights}>
                        {filters.weights.map((weight: any, i: any) => (
                            <Tooltip title={tooltips[i]} key={"tooltip" + i} aria-label="timeFilter">
                                <div key={"div" + i}>
                                    <Typography id="discrete-slider" key={names[i]} gutterBottom>
                                        {names[i]}
                                    </Typography>
                                    <Slider
                                        value={weight}
                                        key={i}
                                        step={1}
                                        min={0}
                                        max={100}
                                        marks={(i == 2) ? marks : false}
                                        onChange={updateWeights.bind(null, i)}
                                    />
                                </div>
                            </Tooltip>
                        ))}
                    </div>
                )}
                <br />
                <Button color="primary" onClick={submitForm}>Submit</Button>
            </FormControl>
        </Dialog >
    );
}

const defaultFilters = {
    dow: [true, true, true, true, true],
    semester: 1,
    credits: 14,
    startDate: new Date('2014-08-18T08:00:00'),
    start: 800,
    endDate: new Date('2014-08-18T20:40:00'),
    end: 2040,
    timeWeight: 33,
    creditWeight: 33,
    balancedWeight: 33,
    weights: [33, 33, 33],
};

export default function Filters({ sendFormData, cachedFilters }: { sendFormData: (form: any) => void, cachedFilters: any }) {
    if (isEmpty(cachedFilters) || cachedFilters.startDate == "") {
        // default the filters for the user
        // should ONLY happen the first time they create an account
        // (subsequent filters are loaded from the database)
        cachedFilters = defaultFilters;
    }

    const [updated, setUpdated] = useState(true);

    if (cachedFilters.creditWeight == 0) {
        // only happens in weird database scenarios
        cachedFilters.weights = [33, 33, 33];
    } else if (cachedFilters.end == 0) {
        cachedFilters.start = (new Date(cachedFilters.startDate)).toMilitary();
        cachedFilters.end = (new Date(cachedFilters.endDate)).toMilitary();
    }

    var classes = useStyles();

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div className={classes.root}>
            <ListItem button onClick={handleClickOpen}>
                <ListItemIcon>
                    <List />
                </ListItemIcon>
                <ListItemText primary="Filters" secondary="Click to set schedule filters" />
            </ListItem>
            <FilterModal
                open={open}
                onClose={handleClose}
                filters={cachedFilters}
                updated={updated}
                setUpdated={setUpdated}
                sendFormData={sendFormData}
            />
        </div>
    );
}