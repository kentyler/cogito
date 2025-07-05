import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import './KanbanBoard.css';

const Task = ({ task, index }) => (
  <Draggable draggableId={task.id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`task ${snapshot.isDragging ? 'dragging' : ''}`}
        style={{
          ...provided.draggableProps.style,
          backgroundColor: snapshot.isDragging ? '#e3f2fd' : '#fff'
        }}
      >
        <div className="task-header">
          <span className="task-id">{task.id}</span>
          <span className="task-type">{task.type}</span>
        </div>
        <div className="task-content">{task.content}</div>
      </div>
    )}
  </Draggable>
);

const Column = ({ column, tasks, index, onRemoveColumn }) => (
  <div className="column">
    <div className="column-header">
      <div className="column-title-section">
        <h3 className="column-title">{column.title}</h3>
        {column.wipLimit && <span className="wip-limit">WIP: {column.wipLimit}</span>}
        {column.rules?.type === 'waiting' && <span className="column-type waiting">WAITING</span>}
      </div>
      <button 
        className="remove-column-btn"
        onClick={() => onRemoveColumn(column.id)}
        title="Remove column"
      >
        ×
      </button>
    </div>
    <div className="task-count">{tasks.length} tasks</div>
    
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
        >
          {tasks.map((task, taskIndex) => (
            <Task key={task.id} task={task} index={taskIndex} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const AddColumnForm = ({ onAddColumn, onCancel }) => {
  const [columnName, setColumnName] = React.useState('');
  const [wipLimit, setWipLimit] = React.useState('');
  const [skipWaiting, setSkipWaiting] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (columnName.trim()) {
      onAddColumn({
        columnName: columnName.trim(),
        wipLimit: wipLimit ? parseInt(wipLimit) : null,
        skipWaiting
      });
      setColumnName('');
      setWipLimit('');
      setSkipWaiting(false);
    }
  };

  return (
    <div className="add-column-form">
      <form onSubmit={handleSubmit}>
        <h4>Add Column</h4>
        <input
          type="text"
          placeholder="Column name"
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          autoFocus
        />
        <input
          type="number"
          placeholder="WIP limit (optional)"
          value={wipLimit}
          onChange={(e) => setWipLimit(e.target.value)}
          min="1"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={skipWaiting}
            onChange={(e) => setSkipWaiting(e.target.checked)}
          />
          Skip waiting column (for start/end columns)
        </label>
        <div className="form-buttons">
          <button type="submit">Add Column</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const KanbanBoard = ({ boardState, gameId, gameName, onAddColumn, onRemoveColumn }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);

  const handleAddColumn = (columnData) => {
    onAddColumn(columnData);
    setShowAddForm(false);
  };

  return (
    <div className="kanban-board">
      <div className="board-header">
        <h2>{gameName}</h2>
        <div className="game-info">
          <span>Game #{gameId}</span>
          <span>•</span>
          <span>{Object.values(boardState.columns).reduce((acc, col) => acc + col.tasks.length, 0)} total tasks</span>
        </div>
        <button 
          className="add-column-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Column
        </button>
      </div>
      
      <div className="board-columns">
        {boardState.columnOrder.map((columnId, index) => {
          const column = boardState.columns[columnId];
          const tasks = column.tasks;
          
          return (
            <Column
              key={column.id}
              column={column}
              tasks={tasks}
              index={index}
              onRemoveColumn={onRemoveColumn}
            />
          );
        })}
        
        {showAddForm && (
          <AddColumnForm
            onAddColumn={handleAddColumn}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;