import React from 'react';

function AllWorks({ tasks = [], removeTask = () => {}, toggleComplete = () => {}, onExit = () => {} }) {
  return (
    <div>
      <div className="app-header">
        <button id="exit-button" onClick={onExit}>Exit</button>
        <h2>All Works</h2>
      </div>

      {tasks.length === 0 ? (
        <div style={{ padding: '12px 0' }}>
          <p>No tasks yet.</p>
        </div>
      ) : (
        <div className="list-of-tasks-more">
          <ul>
            {tasks.map((task, index) => (
              <li key={task.id || index}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={!!task.completed} onChange={() => toggleComplete(task.id)} />
                    <span className={task.completed ? 'task-completed' : ''}>{task.text}</span>
                  </label>
                  <div style={{ marginLeft: 'auto' }}>
                    <button onClick={() => removeTask(task.id)}>&times;</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AllWorks;