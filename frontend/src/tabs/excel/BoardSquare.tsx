import * as React from 'react';
import { useDrop } from 'react-dnd';
import { Square } from './Square';
import { canMoveKnight } from './Game';
import { ItemTypes } from './ItemTypes';
import { Overlay } from './Overlay';
import {Cards, Curriculum} from './Semesters'

export interface BoardSquareProps {
  x: number
	pos: Cards[]
 	children: any
	updateCards: (newPos: number) => void,
  fullCurr: Curriculum[]
}

export const BoardSquare: React.FC<BoardSquareProps> = ({
  x,
  pos,
  children,
  updateCards,
  fullCurr
}: BoardSquareProps) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.CLASSCARD,
    canDrop: () => canMoveKnight(x, pos, fullCurr),
    drop: () => updateCards(pos[x].index),
    collect: (monitor : any) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  })

  return (
    <div
      ref={drop}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
	      border: "1px solid black",
      }}
    >
      <Square>{children}</Square>
      {isOver && !canDrop && <Overlay color="red" />}
      {!isOver && canDrop && <Overlay color="yellow" />}
      {isOver && canDrop && <Overlay color="green" />}
    </div>
  )
}

