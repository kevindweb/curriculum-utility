import * as React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { Box } from '@material-ui/core';
import { WhiteBoard } from './WhiteBoard';
import {Cards, Curriculum} from './Semesters';
 
export interface CourseRow {
  semester: number,
  num: string,
  subject: string,
  elecType: number
}

//in semesters add elec type id and then pass down to white board

interface SemesterTableProps {
  semester: number,
  cards: Cards[],
  updateCards: (newPos: number) => void,
  changeGrade: (pos: number, grade:any) => void,
  clearCard: (pos: number) => void,
  setCards: (pos: number, sub: string, num: string, cred: number, move: number[]) => void,
  curr: CourseRow[], 
  start: number,
  fullCurr: Curriculum[]
}

export default function SemesterTable({ semester, cards, updateCards, changeGrade, clearCard, setCards, curr, start, fullCurr}: SemesterTableProps) {

  return (
    <div>
      <Typography variant="h4">Semester {semester}</Typography>
      <TableContainer component={Paper} style= {{width: 500, display: "block", clear: "both"}}>
        <Table aria-label={`semester ${semester} table`}>
          <TableHead>
            <TableRow>
              <TableCell style = {{fontSize: 18}} >Requirement</TableCell>
              <TableCell align="left" style = {{fontSize: 18}} >Satisfied By</TableCell>
              <TableCell align="left" style = {{fontSize: 18}} >Credits</TableCell>
              <TableCell align="left" style = {{fontSize: 18}} >Grade</TableCell>
            </TableRow>
          </TableHead>
	 </Table>
    </TableContainer>
     <Box display="flex" flexDirection="row" m={1}>
     <Box style = {{display: "block"}}>
      <TableContainer component={Paper} style={{width:150, display:"block", clear: "both"}}>
          <Table >
	          <TableBody>
              {curr.map((curr, index) => ( 
                <TableRow key={index} style={{height:80, display:"block"}}>
                  <TableCell style = {{fontSize: 14, height:80, maxHeight:80, textOverflow: "ellipsis", display: "block", overflow: "hidden"}} >
                    {curr.subject + " " + curr.num}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </TableContainer>
      </Box>
      <Box style = {{display: "block"}}>
          {curr.map((curr, index) => (
          <DndProvider backend={HTML5Backend}>
              <WhiteBoard cards = {cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCard} setCards={setCards} label = {index + start} fullCurr={fullCurr}/>
          </DndProvider>
          ))}
      </Box>
      </Box>

    </div>
  )
}
