import * as React from 'react';
import { useState, useEffect, useRef, forwardRef, useCallback } from 'react';3
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import { useAuth0 } from "@auth0/auth0-react";
import { makeStyles } from '@material-ui/core/styles';
import DynamicList, { createCache } from 'react-window-dynamic-list';
import { VariableSizeList } from 'react-window';
import { debounce } from 'lodash';
import Fuse from 'fuse.js';
import TextField from '@material-ui/core/TextField';

const SEARCH_DEBOUNCE = 500;

export interface Course {
    subject: string,
    num: string,
    course: string,
    credits: number,
    acceptable: number[]
};

interface ElectiveDialogProps {
    currReq: number,
    open: boolean,
    onClose: () => void,
    onSelectCourse: (curriculumReqID: number, course: Course) => void,
}


const useStyles = makeStyles({
    courseList: {
        overflowY: 'scroll'
    }
});

const cache = createCache();

const CourseList = forwardRef((props: {
    curriculumReqID: number,
    courses: Course[],
    onSelectCourse: (curriculumReqID: number, course: Course) => void
}, ref) => {

    const { curriculumReqID, courses, onSelectCourse } = props;
    const mappedCourses = courses.map((course, index) => ({...course, id: index}));
    const listRef = useRef();

    const renderRow = ({index, style}: {
        index: number,
        style: React.CSSProperties,
    }) => {
        const course = courses[index];
    
        return (
            <ListItem button style={style} key={index} onClick={() => onSelectCourse(curriculumReqID, course)}>
                <ListItemText
                    primary={`${course.subject} ${course.num}`}
                    secondary={course.course} />
            </ListItem>
        )
    }

    return (
        <List component="nav">
            <DynamicList
                height={500}
                width="100%"
                data={mappedCourses}
                cache={cache}
            >
                {renderRow}
            </DynamicList>
        </List>
    )
});

export default function ElectiveDialog(props: ElectiveDialogProps) {

    const classes = useStyles();

    const [possibleCourses, setPossibleCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Course[]>(null);

    const { getAccessTokenSilently } = useAuth0();
    const listRef = useRef<VariableSizeList>();

    const fetchElectiveCourses = async () => {
        try {
            const accessToken = await getAccessTokenSilently({
                audience: 'https://curriculum-utility'
            });

            const response = await fetch( `${window.__BACKEND_IP__}/getElectivesForReq?curriculumReqID=${props.currReq}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const data = await response.json();

            if (data.error) {
                console.error(data.error);
                setPossibleCourses([]);
                return;
            }

            setPossibleCourses(data.courses);
        } catch (error) {
            console.error(error);
        }
    }

    const updateSearchResults = useCallback(debounce((searchQuery) => {
        if (searchQuery !== '') {
            const fuse = new Fuse(possibleCourses, {
                keys: ['subject', 'num', 'course']
            });
            const results = fuse.search(searchQuery);
            setSearchResults(results.map(result => result.item));
            listRef.current.scrollTo(0);
        } else {
            setSearchResults(null);
        }
        setSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE), [possibleCourses]);

    const onSearchQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        updateSearchResults(e.target.value);
    };

    useEffect(() => {
        if (props.open === true) {
            setCoursesLoading(true);
            setSearchResults(null);
            fetchElectiveCourses()
                .then(() => {
                    setCoursesLoading(false);
                    updateSearchResults(searchQuery);
                    updateSearchResults.flush();
                });
        }
    }, [props.open]);

    useEffect(() => {
        setPossibleCourses([]);
        setSearchQuery('');
        setSearchResults(null);
    }, [props.currReq]);

    if (props.currReq === null)
        return null;

        return (
            <Dialog onClose={props.onClose} open={props.open}>
                <DialogTitle>Select a course </DialogTitle>
                <Box width="100%" pl={2} pr={2}>
                    <TextField id="elective-search" label="Search" variant="outlined" fullWidth
                        defaultValue={searchQuery} onChange={onSearchQueryChange} />
                </Box>
                { coursesLoading ?
                    <Box width="100%" height={100} py={2} display="flex" alignItems="center" justifyContent="center">
                        <CircularProgress />
                    </Box>
                    :
                    <CourseList
                        courses={searchResults !== null ? searchResults : possibleCourses}
                        curriculumReqID={props.currReq}
                        onSelectCourse={props.onSelectCourse}
                        ref={listRef}
                    />}
                <DialogActions>
                    <Button onClick={props.onClose} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        )
}
