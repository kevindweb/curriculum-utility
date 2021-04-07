import * as React from 'react';
import { DragPreviewImage, useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { knightImage } from './knightImage';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { updateJ } from './Game';
import { updateMoveID } from './Semesters';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Box } from '@material-ui/core';

const cardStyle: React.CSSProperties = {
	fontSize: 40,
	fontWeight: 'bold',
	cursor: 'move',
}

export interface cardProps {
	id: any
	index: number
	className: any
	classNum: any
	grade: any
	cred: number
	elec: any
	changeGrade: (pos: number, grade: any) => void
	acceptableElec: number[]
}

const useSty = makeStyles({
  root: {
    minWidth: 10,
    maxWidth: 500,
    maxHeight: 75
  },
  bullet: {
    display: 'inline-block',
    margin: '0 10px',
    transform: 'scale(0.5)',
  },
  title: {
    fontSize: 12,
  },
  pos: {
    marginBottom: 12,
    marginTop: 12,
  },
});


export const ClassCard: React.FC<cardProps> = ({ id, index, className, classNum, grade, cred, elec, changeGrade}) => {
	const [{ isDragging }, drag, preview] = useDrag({
		item: { type: ItemTypes.CLASSCARD, id, index },
		collect: (monitor: any) => ({
			isDragging: !!monitor.isDragging(),
		}),
	}) 

	let Boolcolor = false;  
	const [anchorEl, setAnchorEl] = React.useState(null);

  	const handleClick = (event: any) => {
    		setAnchorEl(event.currentTarget);
  	};

  	const handleClose = () => {
    		setAnchorEl(null);
  	};

	const handleCloseA = () => {
		changeGrade(index, 'A');
		setAnchorEl(null);
	};
	const handleCloseAm = () => {
                changeGrade(index, 'A-');
                setAnchorEl(null);
        };

        const handleCloseBp = () => {
                changeGrade(index, 'B+');
                setAnchorEl(null);
        };

        const handleCloseB = () => {
                changeGrade(index, 'B');
                setAnchorEl(null);
        };

        const handleCloseBm = () => {
                changeGrade(index, 'B-');
                setAnchorEl(null);
        };

        const handleCloseCp = () => {
                changeGrade(index, 'C+');
                setAnchorEl(null);
        };

        const handleCloseC = () => {
                changeGrade(index, 'C');
                setAnchorEl(null);
        };

        const handleCloseCm = () => {
                changeGrade(index, 'C-');
                setAnchorEl(null);
        };

        const handleCloseDp = () => {
                changeGrade(index, 'D+');
                setAnchorEl(null);
        };

        const handleCloseD = () => {
                changeGrade(index, 'D');
                setAnchorEl(null);
        };

        const handleCloseDm = () => {
                changeGrade(index, 'D-');
                setAnchorEl(null);
        };

        const handleCloseIP = () => {
                changeGrade(index, 'IP');
                setAnchorEl(null);
				
        };

        const handleCloseIC = () => {
                changeGrade(index, 'IC');
                setAnchorEl(null);
				
        };
	
	if(isDragging)
	{
		updateJ(id, elec)
		updateMoveID(id)
	}

	const classes = useSty();	 

	
	if(grade != "IP" && grade != "IC")
	{
		Boolcolor = true;
	}
	else
	{
		Boolcolor = false;
	}

	const theme = useTheme();

	return (
		<>
			<DragPreviewImage connect={preview} src={knightImage} />
			<div
				ref={drag}
				style={{
					...cardStyle,
					opacity: isDragging ? 0.5 : 1,
				}}
			>
			<Card className={classes.root}>
				<CardContent style= { {backgroundColor : Boolcolor ? theme.palette.success.light : theme.palette.background.paper}}>
					<Box display="flex" flexDirection="row" m={0.85}>
					<Typography variant="h5" component="h2" noWrap = {true} align = "left" style = {{width: 180, fontSize: 21}}>
						{className}   {classNum}
					</Typography>
					<Typography variant="h5" component="h2" noWrap = {true} align = "left" style = {{width: 40, fontSize: 21}}>
                        {cred}
                    </Typography>
					<Typography variant="h5" component="h2" noWrap = {true} align = "right" style = {{width: 40, fontSize : 21}} >
                        {grade}
                    </Typography>
					<Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} style = {{ width: 1 }}>
                        &darr;
                    </Button>
					</Box>	
      					<Menu
        					id="simple-menu"
        					anchorEl={anchorEl}
       			 			keepMounted
        					open={Boolean(anchorEl)}
        					onClose={handleClose}
      					>
        					<MenuItem onClick={handleCloseA}>A</MenuItem>
        					<MenuItem onClick={handleCloseAm}>A-</MenuItem>
        					<MenuItem onClick={handleCloseBp}>B+</MenuItem>
							<MenuItem onClick={handleCloseB}>B</MenuItem>
							<MenuItem onClick={handleCloseBm}>B-</MenuItem>
							<MenuItem onClick={handleCloseCp}>C+</MenuItem>
							<MenuItem onClick={handleCloseC}>C</MenuItem>
							<MenuItem onClick={handleCloseCm}>C-</MenuItem>
							<MenuItem onClick={handleCloseDp}>D+</MenuItem>
							<MenuItem onClick={handleCloseD}>D</MenuItem>
							<MenuItem onClick={handleCloseDm}>D-</MenuItem>
							<MenuItem onClick={handleCloseIP}>IP</MenuItem>
							<MenuItem onClick={handleCloseIC}>IC</MenuItem>
      					</Menu>
				</CardContent>			
			</Card>
			</div>
		</>
	)
}
