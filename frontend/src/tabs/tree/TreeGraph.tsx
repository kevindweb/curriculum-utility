import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import blueGrey from '@material-ui/core/colors/blueGrey';
import * as cytoscape from 'cytoscape';
import * as cyCanvas from 'cytoscape-canvas';
import { TreeStructure, TreeError, isElectiveRequirement, CurriculumRequirement } from './Tree';

cyCanvas(cytoscape);

const useStyles = makeStyles({
    treeContainer: {
        width: '100%',
        height: '100%',
    },
    testDiv: {
        position: 'absolute',
        zIndex: 1
    }
});

// Define graph constants
const NODE_HORIZONTAL_SPACING = 400;
const NODE_VERTICAL_SPACING = 150;

// Used to restore the pan and zoom of the graph after switching tabs
let lastPan: cytoscape.Position = null;
let lastZoom: number = null;

function treeToCytoscape(tree: TreeStructure, setSemesterErrors: React.Dispatch<React.SetStateAction<TreeError[]>>, hover: number | number[]): cytoscape.ElementsDefinition {
    // First, count the number of classes in each semester to determine positioning
    const semesterCounts: { [semester: number]: { total: number, current: number } } = {};
    for (let req of tree.nodes) {
        if (req.semester in semesterCounts) {
            semesterCounts[req.semester].total++;
        } else {
            semesterCounts[req.semester] = {
                total: 1,
                current: 0
            };
        }
    }

    // Then, store which curriculum requirements have errors in a set, for styling later on
    const reqErrors = new Set<number>()
    for (let error of tree.errors) {
        if (Array.isArray(error.curriculumReqIDs)) {
            // Add each req ID to the set if array
            for (let reqID of error.curriculumReqIDs) {
                reqErrors.add(reqID);
            }
        } else {
            // Otherwise, just add the req ID
            reqErrors.add(error.curriculumReqIDs)
        }
    }

    // Then, map each requirement to a cytoscape node
    const nodes: cytoscape.NodeDefinition[] = [];

    for (let id in tree.nodes) {
        const req = tree.nodes[id];

        // Calculate position based on semester and number of classes in that semester
        const x = (req.semester - 1) * NODE_HORIZONTAL_SPACING;
        const y = (semesterCounts[req.semester].current - ((semesterCounts[req.semester].total - 1) / 2)) * NODE_VERTICAL_SPACING;

        // Generate the label for this node based on the data
        let label;
        if (isElectiveRequirement(req)) {
            label = req.name + (req.course ? `\n(${req.course.subject} ${req.course.num})` : '');
        } else {
            label = `${req.course.subject} ${req.course.num}`;
        }

        // Choose which styling to apply to the node based on the data
        let classes: string;
        if (reqErrors.has(req.curriculumReqID)) {
            classes = 'error';
        } else {
            classes = req.satisfied ? 'taken' : 'can-take';
        }

        nodes.push({
            data: { id, label },
            position: { x, y },
            classes
        });

        // Increment the number of course for this semester we have seen for later positioning
        semesterCounts[req.semester].current++;
    }

    // Track errors that occur due to prereq's in wrong semesters
    const semesterErrors: TreeError[] = [];

    // Map tree edges to cytoscape edges

    // First, delete edges that are pointing to AP classes, as they are not needed
    const filteredEdges = tree.edges.filter((edge) => {
        return tree.nodes[edge.to].semester !== 0;
    });

    const edges: cytoscape.EdgeDefinition[] = filteredEdges.map((edge) => {
        let classes: string;

        // If this edge is pointing to a node that occurs in the same or previous semester,
        // update both nodes and the edge to show an error
        if (tree.nodes[edge.to].semester <= tree.nodes[edge.from].semester) {
            nodes[edge.to].classes = 'error';
            nodes[edge.from].classes = 'error';
            classes = 'error';

            semesterErrors.push({
                curriculumReqIDs: [tree.nodes[edge.from].curriculumReqID, tree.nodes[edge.to].curriculumReqID],
                error: `${tree.nodes[edge.from].course.subject} ${tree.nodes[edge.from].course.num}` +
                    ` must be taken before ${tree.nodes[edge.to].course.subject} ${tree.nodes[edge.to].course.num}`
            })
        } else {
            // Otherwise, set styling of the edge line based on whether the "from" requirement is satisfied
            classes = tree.nodes[edge.from].satisfied ? 'taken' : null;

            // If the "from" node is not satisfied, update the "to" nodes styling
            if (tree.nodes[edge.from].satisfied === false) {
                if (nodes[edge.to].classes !== 'error') {
                    nodes[edge.to].classes = 'cannot-take';
                }
            }
        }

        return {
            data: { source: edge.from.toString(), target: edge.to.toString() },
            classes
        }
    });

    setSemesterErrors(semesterErrors);

    return {
        nodes,
        edges
    }
}

interface TreeGraphPropTypes {
    treeData: TreeStructure,
    onChangeSemester: (curriculumReqID: number, semester: number) => void,
    onNodeContextMenu: (node: CurriculumRequirement, position: cytoscape.Position) => void,
    setSemesterErrors: React.Dispatch<React.SetStateAction<TreeError[]>>,
    setHoveredNodes: React.Dispatch<React.SetStateAction<number | number[]>>,
    hover: number | number[],
    shouldHover: boolean,
}

export default function TreeGraph(props: TreeGraphPropTypes) {
    const classes = useStyles();
    const theme = useTheme();

    const treeContainer = useRef<HTMLDivElement>(null);

    const cyGraph = useRef<cytoscape.Core>(null);

    const initGraph = () => {
        const elements = treeToCytoscape(props.treeData, props.setSemesterErrors, props.hover);
        let cy = cytoscape({
            container: treeContainer.current,
            elements: elements,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'width': 100,
                        'height': 70,
                        'shape': 'round-rectangle',
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'text-wrap': 'wrap',
                        'text-max-width': '80',
                        'font-family': 'Roboto,Helvetica,Arial,sans-serif',
                        'font-size': 12
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': blueGrey[200],
                        'target-arrow-color': blueGrey[200],
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'unbundled-bezier',
                    }
                },
                {
                    selector: 'node.taken',
                    style: {
                        'background-color': theme.palette.success.light,
                        'border-width': 2,
                        'border-color': theme.palette.success.dark
                    }
                },
                {
                    selector: 'node.can-take',
                    style: {
                        'background-color': theme.palette.background.paper,
                        'border-width': 2,
                        'border-color': blueGrey[100]
                    }
                },
                {
                    selector: 'node.cannot-take',
                    style: {
                        'background-color': blueGrey[400],
                        'border-width': 2,
                        'border-color': blueGrey[600]
                    }
                },
                {
                    selector: 'node.error',
                    style: {
                        'background-color': theme.palette.error.light,
                        'border-width': 2,
                        'border-color': theme.palette.error.dark
                    }
                },
                {
                    selector: 'node.dimmed',
                    style: {
                        'opacity': 0.2,
                    }
                },
                {
                    selector: 'edge.taken',
                    style: {
                        'line-color': theme.palette.success.dark,
                        'target-arrow-color': theme.palette.success.dark
                    }
                },
                {
                    selector: 'edge.error',
                    style: {
                        'line-color': theme.palette.error.dark,
                        'target-arrow-color': theme.palette.error.dark
                    }
                },
                {
                    selector: 'edge.dimmed',
                    style: {
                        'opacity': 0.2,
                    }
                }
            ],
            layout: {
                name: 'preset'
            },
            wheelSensitivity: 0.1,
        });
        if (lastPan !== null && lastZoom !== null) {
            cy.pan(lastPan);
            cy.zoom(lastZoom);
        }

        // Set up events
        setupGraphEvents(cy);

        cyGraph.current = cy;

        // Set up overlay
        const layer = cy.cyCanvas();
        const canvas: HTMLCanvasElement = layer.getCanvas();
        const ctx = canvas.getContext('2d');
        cy.on('render cyCanvas.resize', () => {
            drawOverlay(layer, canvas, ctx);
        });
    }

    const setupGraphEvents = (cy: cytoscape.Core) => {
        // Remove any existing event listeners
        cy.removeListener('free');
        cy.removeListener('cxttap');
        cy.removeListener('mouseover');
        cy.removeListener('mouseout');

        // Add event listeners
        cy.on('free', 'node', onNodeFree);
        cy.on('cxttap', 'node', onNodeContext);
        cy.on('mouseover', 'node', onNodeEnter);
        cy.on('mouseout', 'node', onNodeExit);
    }

    const onNodeFree = (evt: cytoscape.EventObject) => {
        const node: cytoscape.NodeSingular = evt.target;
        const data = node.data();
        const position = node.position();
        const treeNode = props.treeData.nodes[data.id];

        // Calculate new semester based on x position
        let semester = Math.floor((position.x + (NODE_HORIZONTAL_SPACING / 2)) / NODE_HORIZONTAL_SPACING) + 1
        if (semester < 0) {
            semester = 0;
        }

        if (semester !== treeNode.semester)
            props.onChangeSemester(treeNode.curriculumReqID, semester);
        else {
            lastPan = cyGraph.current.pan();
            lastZoom = cyGraph.current.zoom();
            initGraph();
        }
    };

    const onNodeContext = (evt: cytoscape.InputEventObject) => {
        const node: cytoscape.NodeSingular = evt.target;
        const data = node.data();
        const treeContainerPosition = treeContainer.current.getBoundingClientRect();
        const clickPos = {
            x: evt.renderedPosition.x + treeContainerPosition.x,
            y: evt.renderedPosition.y + treeContainerPosition.y
        }
        const treeNode = props.treeData.nodes[data.id];

        props.onNodeContextMenu(treeNode, clickPos);
    }

    const onNodeEnter = (evt: cytoscape.InputEventObject) => {
        if (props.shouldHover) {
            const node: cytoscape.NodeSingular = evt.target;
            const data = node.data();
            const treeNode = props.treeData.nodes[data.id];
            const edges = cyGraph.current.edges();

            const hoveredNodes = [treeNode.curriculumReqID];

            edges.forEach(edge => {
                const data = edge.data();
                const fromNode = props.treeData.nodes[data.source];
                const toNode = props.treeData.nodes[data.target];

                if (fromNode.curriculumReqID == treeNode.curriculumReqID) {
                    hoveredNodes.push(toNode.curriculumReqID);
                } else if (toNode.curriculumReqID == treeNode.curriculumReqID) {
                    hoveredNodes.push(fromNode.curriculumReqID);
                }
            });

            props.setHoveredNodes(hoveredNodes);
        }
    }

    const onNodeExit = () => {
        if (props.shouldHover) {
            props.setHoveredNodes(null);
        }
    }

    const drawOverlay = (layer: any, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        layer.resetTransform(ctx);
        layer.clear(ctx);

        layer.setTransform(ctx);
        // Draw elements that move with the graph

        // Find the max semester in the curriculum and the max # of nodes in a semester
        // Also count the number of credits in each semester
        const semesterCounts: { [semester: number]: number } = {};
        const semesterCredits: { [semester: number]: number } = {}
        let maxSem = 1;
        let maxNodes = 0;
        for (let node of props.treeData.nodes) {
            if (node.semester > maxSem) {
                maxSem = node.semester;
            }
            if (node.semester in semesterCounts) {
                semesterCounts[node.semester]++;
            } else {
                semesterCounts[node.semester] = 1;
            }
            if (semesterCounts[node.semester] > maxNodes) {
                maxNodes = semesterCounts[node.semester];
            }

            if (node.semester in semesterCredits) {
                if (node.hasOwnProperty('course')) {
                    semesterCredits[node.semester] += node.course.credits;
                }
            } else {
                if (node.hasOwnProperty('course')) {
                    semesterCredits[node.semester] = node.course.credits;
                } else {
                    semesterCredits[node.semester] = 0;
                }
            }
        }

        // Draw semester labels under each semester
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = '20px Helvetica'
        for (let i = 0; i <= maxSem; i++) {
            const labelX = NODE_HORIZONTAL_SPACING * (i - 1);
            const labelY = ((NODE_VERTICAL_SPACING * maxNodes) / 2) + 20;
            const totalCredits = semesterCredits[i];
            if (i == 0) {
                ctx.fillText(`AP Courses`, labelX, labelY);
            } else {
                ctx.fillText(`Semester ${i}`, labelX, labelY);
            }
            ctx.fillText(`${totalCredits ? totalCredits : 0} Credits`, labelX, labelY + 50);
        }
    }

    const applyNodeHover = (hover: number | number[]) => {
        // Handle node hovering / focusing
        const nodes = cyGraph.current.nodes();
        const edges = cyGraph.current.edges();

        if (hover !== null) {
            // Turn the supplied hover reqs into a set
            const hoverSet = new Set([].concat(hover));

            // If any nodes are being hovered, make all other nodes slightly transparent
            if (hoverSet.size > 0) {
                nodes.forEach(node => {
                    const data = node.data();
                    const treeNode = props.treeData.nodes[data.id];
                    if (!hoverSet.has(treeNode.curriculumReqID)) {
                        node.addClass('dimmed');
                    } else {
                        node.removeClass('dimmed');
                    }
                });
            }

            // Do the same with edges, ensuring only the edge between the two hovered
            // nodes is not dimmed
            if (hoverSet.size > 0) {
                edges.forEach(edge => {
                    const data = edge.data();
                    const fromNode = props.treeData.nodes[data.source];
                    const toNode = props.treeData.nodes[data.target];
                    if (!hoverSet.has(fromNode.curriculumReqID) || !hoverSet.has(toNode.curriculumReqID)) {
                        edge.addClass('dimmed');
                    } else {
                        edge.removeClass('dimmed');
                    }
                });
            }
        } else {
            nodes.removeClass('dimmed');
            edges.removeClass('dimmed');
        }
    }

    // Redraw tree when tree data is updated
    useEffect(() => {
        if (props.treeData !== null) {
            initGraph();
        }

        return () => {
            // On unmount, save the current pan and zoom of the tree for when it is returned
            lastPan = cyGraph.current.pan();
            lastZoom = cyGraph.current.zoom();
        }
    }, [props.treeData]);

    // Apply hover effects for hovered nodes
    useEffect(() => {
        applyNodeHover(props.hover);
    }, [props.hover]);

    // Set up events again if shouldHover changes
    useEffect(() => {
        setupGraphEvents(cyGraph.current);
    }, [props.shouldHover]);

    return (
        <>
            <div
                id="tree-graph-container"
                ref={treeContainer}
                className={classes.treeContainer}
                onContextMenu={(e) => e.preventDefault()}
            />
        </>
    )
}