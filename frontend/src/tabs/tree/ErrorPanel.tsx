import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Badge from '@material-ui/core/Badge';
import { TreeError } from './Tree';
import { TramRounded } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  drawerHeader: {
    marginLeft: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  drawerSubtext: {
    marginLeft: theme.spacing(2)
  },
}));

interface ErrorPanelPropTypes {
  errors: TreeError[],
  setHoveredNodes: React.Dispatch<React.SetStateAction<number | number[]>>
}

const ErrorList = ({ errors, setHoveredNodes }: ErrorPanelPropTypes) => {
  const classes = useStyles();

  const listItems = errors.map((error, index) =>
    <ListItem button
      onMouseEnter={() => setHoveredNodes(error.curriculumReqIDs)}
      onMouseLeave={() => setHoveredNodes(null)}
      key={index}>
      <ListItemText primary={error.error} />
    </ListItem>
  );

  if (listItems.length > 0) {
    return (
      <List component="nav" aria-label="tree error list">
        {listItems}
      </List>
    )
  }
  return (
    <List component="nav" aria-label="tree error list">
      <ListItem>
        <ListItemText
          primary="There are no errors in the curriculum tree."/>
      </ListItem>
    </List>
  )
}

const StyledBadge = withStyles((theme) => ({
  badge: {
    top: 32,
    right: 100,
  }
}))(Badge);

export default function ErrorPanel(props: ErrorPanelPropTypes) {
  const classes = useStyles();

  const [expanded, setExpanded] = useState(false);

  const handleChangeExpanded = () => {
    setExpanded((prevExpanded) => !prevExpanded)
  }

  const prevErrorsRef = useRef<TreeError[]>([]);
  const haveErrorsChanged = (errors: TreeError[]) => {
    if (errors.length != prevErrorsRef.current.length)
      return true;

    for (let i in errors) {
      // Compare error strings
      if (errors[i].error !== prevErrorsRef.current[i].error)
        return true;

      // Check if type mismatch between old and current errors curriculumReqIDs
      if (Array.isArray(errors[i].curriculumReqIDs) !== Array.isArray(prevErrorsRef.current[i].curriculumReqIDs))
        return true;

      // If array, compare all values in the array
      if (Array.isArray(errors[i].curriculumReqIDs)) {
        // Compare length of both arrays first
        if ((errors[i].curriculumReqIDs as number[]).length !== (prevErrorsRef.current[i].curriculumReqIDs as number[]).length)
          return true;

        // Compare each value of both arrays
        for (let j in errors[i].curriculumReqIDs as number[]) {
          if ((errors[i].curriculumReqIDs as number[])[j] !== (prevErrorsRef.current[i].curriculumReqIDs as number[])[j])
            return true;
        }
      } else {
        // If not array, simple compare values
        if (errors[i].curriculumReqIDs !== prevErrorsRef.current[i].curriculumReqIDs)
          return true;
      }
    }
    return false;
  }

  useEffect(() => {
    // Check if errors have changed
    if (haveErrorsChanged(props.errors)) {
      if (props.errors !== null && props.errors.length !== 0)
        setExpanded(true);
      else
        setExpanded(false);

      prevErrorsRef.current = props.errors;
    }
  }, [props.errors])

  return (
    <>
      <StyledBadge badgeContent={props.errors.length} color="error">
        <Typography variant="h5" className={classes.drawerHeader}>Arrangement Errors</Typography>
      </StyledBadge>
      <Typography variant="subtitle2" color="textSecondary" className={classes.drawerSubtext}>Hover over an error to identify it on the tree.</Typography>
      <ErrorList errors={props.errors} setHoveredNodes={props.setHoveredNodes} />
    </>
  )
}