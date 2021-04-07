import * as React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import blueGrey from '@material-ui/core/colors/blueGrey';
import Typography from '@material-ui/core/Typography';

interface KeyBoxProps {
    color: string,
    borderColor: string
}

const useKeyBoxStyles = makeStyles(theme => ({
    keybox: (props: KeyBoxProps) => ({
        backgroundColor: props.color,
        borderStyle: 'solid',
        borderRadius: 10,
        borderColor: props.borderColor,
        borderWidth: 3,
        width: 40,
        height: 40,
        marginRight: theme.spacing(1),
        flexShrink: 0
    })
}));

function KeyBox(props: KeyBoxProps) {
    const classes = useKeyBoxStyles(props);

    return (
        <div className={classes.keybox} />
    )
}

const useTreeKeyStyles = makeStyles(theme => ({
    drawerHeader: {
        marginLeft: theme.spacing(2),
    }
}));

export default function TreeKey() {
    const theme = useTheme();
    const classes = useTreeKeyStyles();

    return (
        <>
            <Typography variant="h5" className={classes.drawerHeader}>Graph Key</Typography>
            <List dense={true}>
                <ListItem>
                    <KeyBox color={theme.palette.background.paper} borderColor={blueGrey[100]} />
                    <ListItemText primary="Can Take (Requirements met)" />
                </ListItem>
                <ListItem>
                    <KeyBox color={blueGrey[400]} borderColor={blueGrey[600]} />
                    <ListItemText primary="Cannot Take (Requirements not met)" />
                </ListItem>
                <ListItem>
                    <KeyBox color={theme.palette.success.light} borderColor={theme.palette.success.dark} />
                    <ListItemText primary="Satisfied requirement" />
                </ListItem>
                <ListItem>
                    <KeyBox color={theme.palette.error.light} borderColor={theme.palette.error.dark} />
                    <ListItemText primary="Error (invalid arrangement)" />
                </ListItem>
            </List>
        </>
    );
}
