import * as React from 'react';
import { useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Collapse,
    Tooltip,
    Slider,
    Typography,
    CircularProgress,
    Button,
} from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { isEmpty } from 'lodash';
import { Class, EmojiSymbols, ExpandLess, ExpandMore } from '@material-ui/icons';

import Filters from './Filters';

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
        slider: {
            marginLeft: 5,
            marginRight: 5,
            minWidth: 100,
        },
        header: {
            marginLeft: theme.spacing(2),
        },
        updateButton: {
            textTransform: 'none',
        }
    }),
);

export default function Data({ data, sendFormData, cachedFilters, needUpdate }: { data: any, sendFormData: any, cachedFilters: any, needUpdate: any }) {
    var classes = useStyles();

    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

    const resubmitFilters = () => {
        var body = { ...cachedFilters };
        // ensure that weights are not 0 (move to 1 at the lowest)
        body.timeWeight = cachedFilters.weights[0] == 0 ? 1 : cachedFilters.weights[0];
        body.creditWeight = cachedFilters.weights[1] == 0 ? 1 : cachedFilters.weights[1];
        body.balancedWeight = cachedFilters.weights[2] == 0 ? 1 : cachedFilters.weights[2];
        sendFormData(body);
        needUpdate.resetBool();
    }

    const openScoreDetails = () => {
        setDetailsOpen(!detailsOpen);
    }
    if (isEmpty(data)) {
        return <>
            <Typography variant="h5" className={classes.header}>Schedule Details</Typography>
            <List component="nav">
                <Filters sendFormData={sendFormData} cachedFilters={cachedFilters} />
                {data == false && <ListItem alignItems="center"><CircularProgress /></ListItem>}
            </List>
        </>;
    }

    return (
        <>
            <Typography variant="h5" className={classes.header}>Schedule Details</Typography>
            <List component="nav">
                {needUpdate.submitBool && <ListItem button onClick={resubmitFilters}>
                    <Button
                        className={classes.updateButton}
                        variant="contained"
                        color="secondary"
                    >
                        <ListItemText primary="Update to tree detected" secondary="Click to resubmit schedule filters" />
                    </Button>
                </ListItem>}
                <Filters sendFormData={sendFormData} cachedFilters={cachedFilters} />
                <ListItem>
                    <ListItemIcon>
                        <Class />
                    </ListItemIcon>
                    <ListItemText primary="Credits" secondary={data.credits} />
                </ListItem>
                <Tooltip title="Click to view how closely this schedule followed your filters" aria-label="scoreDetails" placement="top">
                    <ListItem button onClick={openScoreDetails}>
                        <ListItemIcon>
                            <EmojiSymbols />
                        </ListItemIcon>
                        <ListItemText primary="Score" secondary={data.score} />
                        {detailsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                </Tooltip>
                <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItem>
                            <div key="div0" className={classes.slider}>
                                <Slider
                                    value={data.weights[0]}
                                    key={0}
                                    step={1}
                                    min={0}
                                    max={100}
                                    disabled
                                />
                            </div>
                            <ListItemText primary="Course Timing" secondary={data.details.time} />
                        </ListItem>
                        <ListItem>
                            <div key="div1" className={classes.slider}>
                                <Slider
                                    value={data.weights[1]}
                                    key={1}
                                    step={1}
                                    min={0}
                                    max={100}
                                    disabled
                                />
                            </div>
                            <ListItemText primary="Credits" secondary={data.details.credits} />
                        </ListItem>
                        <ListItem>
                            <div key="div2" className={classes.slider}>
                                <Slider
                                    value={data.weights[2]}
                                    key={2}
                                    step={1}
                                    min={0}
                                    max={100}
                                    disabled
                                />
                            </div>
                            <ListItemText primary="Days of the Week" secondary={data.details.balanced} />
                        </ListItem>
                    </List>
                </Collapse>
            </List>
        </>
    );
}
