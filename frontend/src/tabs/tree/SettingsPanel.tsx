import * as React from "react";
import Typography from '@material-ui/core/Typography';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
    drawerHeader: {
        marginLeft: theme.spacing(2),
        marginTop: theme.spacing(2),
    }
}));

interface SettingsPanelProps {
    shouldHover: boolean,
    setShouldHover: React.Dispatch<React.SetStateAction<boolean>>
}

export default function SettingsPanel(props: SettingsPanelProps) {
    const classes = useStyles();

    const handleHoverChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        props.setShouldHover(evt.target.checked);
    }

    return (
        <>
            <Typography variant="h5" className={classes.drawerHeader}>Settings</Typography>
            <Box p={2}>
                <FormGroup>
                    <FormControlLabel
                        control={<Switch color="primary" checked={props.shouldHover} onChange={handleHoverChange} />}
                        label="Isolate edges on hover"
                    />
                </FormGroup>
            </Box>
        </>
    );
}