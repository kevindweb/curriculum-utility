import * as React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles(theme => ({
    drawerHeader: {
        marginLeft: theme.spacing(2),
        marginTop: theme.spacing(1)
    }
}));

export default function InfoPanel() {
    const theme = useTheme();
    const classes = useStyles();

    return (
        <>
            <Typography variant="h5" className={classes.drawerHeader}>Instructions</Typography>
            <Box p={2} pt={1}>
                <Typography variant="body2">
                    Use the Curriculum Tree to plan out how you will fulfill your curriculum requirements. A line from one curriculum requirement to another indicates that it is a prerequisite for the other course. Move requirements to different semesters by clicking and dragging. Right click requirements for additional options such as setting courses for electives.
                </Typography>
            </Box>
        </>
    );
}
