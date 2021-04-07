import * as React from 'react';
import { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import Drawer from '@material-ui/core/Drawer';
import Toolbar from '@material-ui/core/Toolbar';
import TreeGraph from './TreeGraph';
import ElectiveDialog from './ElectiveDialog';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { isEqual } from 'lodash';
import { useAuth0 } from "@auth0/auth0-react";
import { useQuery, useQueryClient, useMutation } from 'react-query';
import ErrorPanel from './ErrorPanel';
import { getTree, setRequirementSemester, setElectiveCourse } from '../../api/tree-api';
import TreeKey from './TreeKey';
import SettingsPanel from './SettingsPanel';

// Define types for nodes in our tree
export interface Course {
  subject: string,
  num: string,
  credits: number
};

export interface ElectiveRequirement {
  curriculumReqID: number,
  requirementType: 'elective',
  name: string,
  semester: number,
  satisfied: boolean,
  course?: Course
};

export interface CourseRequirement {
  curriculumReqID: number,
  requirementType: 'course',
  semester: number,
  satisfied: boolean,
  course: Course
};

interface GraphEdge {
  from: number,
  to: number
}

export interface TreeError {
  curriculumReqIDs: number | number[],
  error: string
}

export type CurriculumRequirement = ElectiveRequirement | CourseRequirement;

export function isElectiveRequirement(requirement: CurriculumRequirement): requirement is ElectiveRequirement {
  return requirement.requirementType == 'elective';
}

export interface TreeStructure {
  nodes: CurriculumRequirement[],
  edges: GraphEdge[],
  errors: TreeError[]
}

// Define styling for Tree component
const drawerWidth = 350;

const useStyles = makeStyles(theme => ({
  flexContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  treeContainer: {
    width: '100%',
    height: '100%'
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorPanel: {
    width: '100%',
    maxWidth: 500,
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
}));

export default function Tree() {
  const classes = useStyles();

  // Node interaction state values
  const [selectedNode, setSelectedNode] = useState<CurriculumRequirement>(null);
  const [hoveredNodes, setHoveredNodes] = useState<number | number[]>(null);
  const [shouldHover, setShouldHover] = useState(false);

  // Node context menu state
  const [ctxMenuPosition, setCtxMenuPosition] = useState<cytoscape.Position>({ x: 0, y: 0 });
  const [ctxMenuOpen, setCtxMenuOpen] = useState(false);

  // Grade context menu state
  const [gradeMenuOpen, setGradeMenuOpen] = useState(false);
  const gradeOptions = [
    'A',
    'A-',
    'B+',
    'B',
    'B-',
    'C+',
    'C',
    'C-',
    'D+',
    'D',
    'D-',
    'IP',
    'IC'
  ]

  // Elective selection dialog state
  const [electiveDialogOpen, setElectiveDialogOpen] = useState(false);

  // Frontend tree errors
  const [semesterErrors, setSemesterErrors] = useState<TreeError[]>([]);

  // Authorization
  const { getAccessTokenSilently } = useAuth0();

  // Queries
  const queryClient = useQueryClient();
  const treeQuery = useQuery<TreeStructure>('tree', () => getTree(getAccessTokenSilently), {
    retryDelay: 500
  });

  const semesterMutation = useMutation((variables: { curriculumReqID: number, semester: number, treeClone: TreeStructure }) =>
    setRequirementSemester({
      curriculumReqID: variables.curriculumReqID,
      semester: variables.semester
    }, getAccessTokenSilently), {
    onMutate: async (variables) => {
      // Cancel any ongoing tree fetch
      await queryClient.cancelQueries('tree');
      // Get the current cached tree to rollback to later if needed
      const previousTree = queryClient.getQueryData('tree');
      // Apply the new semester to the current tree state
      queryClient.setQueryData('tree', variables.treeClone);
      // Store the old tree in the context in case it fails
      return { previousTree };
    },
    onSuccess: (data: { tree: TreeStructure }, variables) => {
      // When semester is successfully updated, only update the tree if the new tree
      // is not equal to the current one, to avoid "snapping" back while the user is making changes
      if (!isEqual(variables.treeClone, data.tree)) {
        queryClient.setQueryData('tree', data.tree);
      }

      queryClient.invalidateQueries('schedule', {
        refetchInactive: true
      });
      queryClient.invalidateQueries('transcript', {
        refetchInactive: true
      });
    },
    onError: (err, variables, context: { previousTree: TreeStructure }) => {
      queryClient.setQueryData('tree', context.previousTree);
    }
  });

  interface CourseMutationContext {
    previousTree: TreeStructure
  }

  const courseMutation = useMutation<unknown, unknown, any, CourseMutationContext>((variables: { curriculumReqID: number, course: { subject: string, num: string }, treeClone: TreeStructure }) =>
    setElectiveCourse({
      curriculumReqID: variables.curriculumReqID,
      course: {
        subject: variables.course.subject,
        num: variables.course.num
      }
    }, getAccessTokenSilently), {
    onMutate: async (variables) => {
      // Cancel any ongoing tree fetch
      await queryClient.cancelQueries('tree');
      // Get the current cached tree to rollback to later if needed
      const previousTree = queryClient.getQueryData<TreeStructure>('tree');
      // Apply the new semester to the current tree state
      queryClient.setQueryData('tree', variables.treeClone);
      // Store the old tree in the context in case it fails
      return { previousTree };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData('tree', context.previousTree);
      queryClient.invalidateQueries('tree');
    },
    onSuccess: (data: { tree: TreeStructure }, variables) => {
      // When elective course is successfully changed, only update the tree if the new tree
      // is not equal to the current one, to avoid "snapping" back while the user is making changes
      if (!isEqual(variables.treeClone, data.tree)) {
        queryClient.setQueryData('tree', data.tree);
      }

      queryClient.invalidateQueries('schedule', {
        refetchInactive: true
      });
      queryClient.invalidateQueries('transcript', {
        refetchInactive: true
      });
    }
  });

  const gradeMutation = useMutation((variables: { Sub: any, Num: any, Grade: any, treeClone: TreeStructure }) =>
    setGrade({
      Sub: variables.Sub,
      Num: variables.Num,
      Grade: variables.Grade
    }), {
    onMutate: async (variables) => {
      // Cancel any ongoing tree fetch
      await queryClient.cancelQueries('tree');
      // Get the current cached tree to rollback to later if needed
      const previousTree = queryClient.getQueryData<TreeStructure>('tree');
      // Apply the new semester to the current tree state
      queryClient.setQueryData('tree', variables.treeClone);
      // Store the old tree in the context in case it fails
      return { previousTree };
    },
    onSettled: async () => {
      queryClient.invalidateQueries('tree');
      queryClient.invalidateQueries('transcript', {
        refetchInactive: true
      });
    }
  });

  const handleChangeSemester = async (curriculumReqID: number, semester: number) => {
    // Update the tree on the frontend first for responsiveness
    const treeClone: TreeStructure = JSON.parse(JSON.stringify(treeQuery.data));
    for (let node of treeClone.nodes) {
      if (node.curriculumReqID == curriculumReqID) {
        // If semester is the same, do not update the backend
        if (node.semester != semester) {
          node.semester = semester;
          if (node.semester === 0) {
            node.satisfied = true;
          }
        }
        break;
      }
    }

    // Update the tree
    semesterMutation.mutate({ curriculumReqID, semester, treeClone });
  };

  const handleNodeContextMenu = (node: CurriculumRequirement, position: cytoscape.Position) => {
    setSelectedNode(node);
    setCtxMenuPosition(position);
    setCtxMenuOpen(true);
  };

  const handleSetCourseForElective = async (curriculumReqID: number, course: Course) => {
    // Close the elective dialog
    setElectiveDialogOpen(false);

    // Update the tree on the frontend first for responsiveness
    const treeClone: TreeStructure = JSON.parse(JSON.stringify(treeQuery.data));
    let updateBackend = true;
    for (let node of treeClone.nodes) {
      if (node.curriculumReqID == curriculumReqID) {
        if (isElectiveRequirement(node)) {
          // If course is the same, do not update the backend
          if (!node.hasOwnProperty('course') || node.course.subject != course.subject || node.course.num != course.num) {
            if (course.subject == "NONE" && course.num == "0000") {
              delete node['course'];
            } else {
              node.course = {
                subject: course.subject,
                num: course.num,
                credits: course.credits
              }
            }
          } else {
            updateBackend = false;
          }
        } else {
          updateBackend = false;
        }
        break;
      }
    }
    if (!updateBackend)
      return;

    // Update the tree
    courseMutation.mutate({
      curriculumReqID,
      course: {
        subject: course.subject,
        num: course.num
      },
      treeClone
    });
  }

  const clearCourseForElective = (curriculumReqID: number) => {
    setCtxMenuOpen(false);
    handleSetCourseForElective(curriculumReqID, {
      subject: "NONE",
      num: "0000",
      credits: 0
    });
  }

  const setGrade = async (data: { Sub: any, Num: any, Grade: any }) => {
    const jsonBody = { Sub: data.Sub, Num: data.Num, Grade: data.Grade };

    const accessToken = await getAccessTokenSilently({
      audience: 'https://curriculum-utility'
    });


    const response = await fetch(`${window.__BACKEND_IP__}/updateGrades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(jsonBody),
    });
    const ret = await response.json();
    return ret
  }

  const handleSetGrade = async (curriculumReqID: number, grade: string) => {
    // Close the grade menu
    setGradeMenuOpen(false);

    // Update the tree on the frontend first for responsiveness
    const treeClone: TreeStructure = JSON.parse(JSON.stringify(treeQuery.data));
    let subject: string, num: string;

    let updateBackend = true;
    for (let node of treeClone.nodes) {
      if (node.curriculumReqID == curriculumReqID) {
        if (node.hasOwnProperty('course')) {
          subject = node.course.subject;
          num = node.course.num;
          if (grade !== 'IP' && grade !== 'IC') {
            node.satisfied = true;
          } else if(node.semester != 0) {
            node.satisfied = false;
          }
        } else {
          updateBackend = false;
        }
        break;
      }
    }
    if (!updateBackend)
      return;

    // Update the tree
    gradeMutation.mutate({
      Sub: subject,
      Num: num,
      Grade: grade,
      treeClone
    });
  }

  if (treeQuery.isLoading || treeQuery.isLoadingError) {
    return (
      <div className={classes.loading}>
        <CircularProgress size={100} />
      </div>
    )
  }

  return (
    <div className={classes.flexContainer} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <Drawer
        variant="permanent"
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <Toolbar />
        <TreeKey />
        <Divider />
        <SettingsPanel shouldHover={shouldHover} setShouldHover={setShouldHover} />
        <Divider />
        <ErrorPanel
          errors={[...treeQuery.data.errors, ...semesterErrors]}
          setHoveredNodes={setHoveredNodes} />
      </Drawer>
      <div className={classes.treeContainer}>
        <TreeGraph
          treeData={treeQuery.data}
          onChangeSemester={handleChangeSemester}
          onNodeContextMenu={handleNodeContextMenu}
          setSemesterErrors={setSemesterErrors}
          hover={hoveredNodes}
          setHoveredNodes={setHoveredNodes}
          shouldHover={shouldHover} />
      </div>
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={{ left: ctxMenuPosition.x, top: ctxMenuPosition.y }}
        keepMounted
        open={ctxMenuOpen}
        onClose={() => setCtxMenuOpen(false)}
      >
        {(selectedNode !== null && isElectiveRequirement(selectedNode)) ?
          <MenuItem onClick={() => { setElectiveDialogOpen(true); setCtxMenuOpen(false); }}>
            Set Course
                    </MenuItem>
          : null}
        {(selectedNode !== null && isElectiveRequirement(selectedNode)) ?
          <MenuItem onClick={() => clearCourseForElective(selectedNode.curriculumReqID)}>
            Clear Course
                    </MenuItem>
          : null}
        {(selectedNode !== null && selectedNode.hasOwnProperty('course')) ?
          <MenuItem onClick={() => { setGradeMenuOpen(true); setCtxMenuOpen(false); }}>
            Set Grade
          </MenuItem>
          : null}
      </Menu>
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={{ left: ctxMenuPosition.x, top: ctxMenuPosition.y }}
        keepMounted
        open={gradeMenuOpen}
        onClose={() => setGradeMenuOpen(false)}
      >
        {gradeOptions.map(grade => (
          <MenuItem onClick={() => { handleSetGrade(selectedNode.curriculumReqID, grade) }}>{grade}</MenuItem>
        ))}
      </Menu>
      <ElectiveDialog
        node={(selectedNode !== null && isElectiveRequirement(selectedNode)) ? selectedNode : null}
        open={electiveDialogOpen}
        onClose={() => setElectiveDialogOpen(false)}
        onSelectCourse={handleSetCourseForElective} />
    </div>
  )
}
