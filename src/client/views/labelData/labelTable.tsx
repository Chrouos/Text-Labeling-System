import React, { useState, FC } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

interface LabelTableProps {
  items: string[];
}

export const LabelTable: FC<LabelTableProps> = ({ items }) => {
 
  return (
      <h1>Todo</h1>
      
  );
}
