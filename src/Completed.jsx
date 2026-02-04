import React from 'react';

function Completed({ tasks = [], removeTask = () => {}, toggleComplete = () => {}, onExit = () => {} }) {
  const hasCompleted = tasks.some(t => t.completed);

  return (
    <div>
      <div className="app-header">
        <button id="exit-button" onClick={onExit}>Exit</button>
        <h2>Completed Tasks</h2>
      </div>

      {!hasCompleted ? (
        <div style={{ padding: '12px 0' }}>
          <p>No completed tasks yet.</p>
        </div>
      ) : (
        <div className="list-of-tasks-more">
          <ul>
            {tasks.map((task, index) => {
              if (!task.completed) return null;
              return (
                <li key={task.id || index}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id)} />
                      <span className="task-completed">{task.text}</span>
                    </label>
                    <div style={{ marginLeft: 'auto' }}>
                      <button onClick={() => removeTask(task.id)}>&times;</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Completed;