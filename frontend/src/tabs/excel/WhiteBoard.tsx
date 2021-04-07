import * as React from 'react';
import { useState } from 'react';
import { BoardSquare } from './BoardSquare';
import { ClassCard } from './classCard';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ElectiveDialog from './ElectiveDialog';
import {Cards, Curriculum} from './Semesters';



export interface BoardProps {
	cards: Cards[],
	updateCards: (newPos: number) => void,
	changeGrade: (pos: number, grade: any) => void,
	clearCard: (pos: number) => void,
	setCards: (pos: number, sub: string, num: string, cred: number, move: number[]) => void,
	label: number,
	fullCurr: Curriculum[]
}

export interface Course {
    subject: string,
    num: string,
    course: string,
    credits: number,
    acceptable: number[]
};
  

export interface BoardState {
	cards: Cards[]
}



const boardStyle: React.CSSProperties = {
	width: 350,
	height: 80,
	flexWrap: 'wrap',
	display: "block",
}


const squareStyle: React.CSSProperties = { width: 350, height: 80, display:"block" }



export const WhiteBoard: React.FC<BoardProps> = ({
	cards,
	updateCards, 
	changeGrade,
	clearCard,
	setCards,
	label,
	fullCurr
}) => {

	const [electiveDialogOpen, setElectiveDialogOpen] = useState(false);
	const [ctxMenuOpen, setCtxMenuOpen] = useState(false);
	const [anchorEl, setAnchorEl] = React.useState(null);

	function handleSetCourseForElective(index: number, course: Course) {
		// Close the elective dialog
		setElectiveDialogOpen(false);
		setCards(index, course.subject, course.num, course.credits, course.acceptable)
	  }
	
	function handleClear(i: number) {
		console.log("clear course");
		clearCard(i)
	  }
	
	  function handleSet() {
		console.log("Set course");
		setElectiveDialogOpen(true)
		
	  }

	function renderSquare(i: number) {
		let elec: boolean = false
		let index: number = -1
		for(let x = 0; x < cards.length; x++) {
			if(i === cards[x].index - cards[0].index)
			{
				index = cards[x].index
				elec = cards[i].elec
			}
		}

		if (renderPiece(i) != null) {
			if(elec) {
				return (
						<div  key={i} style={squareStyle} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenuOpen(true); setAnchorEl(e.currentTarget);}}>		
							<BoardSquare x={i} pos={cards} updateCards = {updateCards} fullCurr={fullCurr}>	
								{renderPiece(i)}	
							</BoardSquare>
						<Menu
							anchorEl={anchorEl}
							keepMounted
							open={ctxMenuOpen}
							onClose={() => setCtxMenuOpen(false)}
						>
							<MenuItem onClick={() => { handleSet(); setCtxMenuOpen(false); }}>
								Set Course
							</MenuItem>
							<MenuItem onClick={() => { handleClear(index); setCtxMenuOpen(false); }}>
								Clear Course
							</MenuItem>
						</Menu>
						<ElectiveDialog
							currReq = {index}
							open={electiveDialogOpen}
							onClose={() => setElectiveDialogOpen(false)}
							onSelectCourse={handleSetCourseForElective} />
						</div>
				)
			}
				else {
					return (
						<div key={i} style={squareStyle} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenuOpen(false); }}>
						<BoardSquare x={i} pos={cards} updateCards = {updateCards} fullCurr={fullCurr}>
							{renderPiece(i)}
						</BoardSquare>
						</div>
					)
				}
			}
				else {
					return (
						<div key={i} style={squareStyle} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenuOpen(true); setAnchorEl(e.currentTarget);}}>
							<BoardSquare x={i} pos={cards} updateCards = {updateCards} fullCurr={fullCurr}>
								{renderPiece(i)}
							</BoardSquare>
							<Menu
								anchorEl={anchorEl}
								keepMounted
								open={ctxMenuOpen}
								onClose={() => setCtxMenuOpen(false)}
							>
							<MenuItem onClick={() => { handleSet(); setCtxMenuOpen(false); }}>
								Set Course
							</MenuItem>
							</Menu>
							<ElectiveDialog
								currReq = {index}
								open={electiveDialogOpen}
								onClose={() => setElectiveDialogOpen(false)}
								onSelectCourse={handleSetCourseForElective} />
						</div>
					)
				}
	}

	function renderPiece(x: number) {	
		let isClassHere: boolean = false
		let j = 0	
		for (let i = 0; i < cards.length; i++){
			if ( x === cards[i].index - cards[0].index && cards[i].className != "NONE")
			{
				isClassHere = true
				break
			}
			j++
		}	
	
		return isClassHere ? 	<ClassCard 
						id= {cards[j].id} 
						index = {cards[j].index}
						className= {cards[j].className} 
						classNum= {cards[j].classNum} 
						grade = {cards[j].grade}
						cred = {cards[j].cred}
						elec = {cards[j].elec}
						changeGrade= {changeGrade}
						acceptableElec = {cards[j].acceptableElec}
					/> : null
	}
	
			

	return 	(
		<>
			<div style={boardStyle}>{renderSquare(label)}</div>
		</>
	)
}

