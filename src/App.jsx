function App({
  tasks: tasksProp,
  addTask: addTaskProp,
  removeTask: removeTaskProp,
  toggleComplete: toggleCompleteProp,
  inputValue: inputValueProp,
  setInputValue: setInputValueProp,
  onExit,
}) {
  // Ensure tasks have IDs and filter only incomplete ones
  const incompleteTasks = (tasksProp || []).filter(t => !t.completed);

  return (
    <>
     <div className="app-header">
       <button id="exit-button" onClick={() => onExit ? onExit() : null}>Exit</button>
       <h2>To Do List</h2>
     </div>
        <div className="input-row">
          <input 
            type="text" 
            placeholder="Enter your Task"
            id="input-task-entry"
            value={inputValueProp}
            onChange={(e) => setInputValueProp(e.target.value)}
          />
          <button 
            id="add-task-button"
            type="submit"
            onClick={addTaskProp}
          >
            Add
          </button>
        </div>
        {incompleteTasks.length > 0 ? (
          <div className="list-of-tasks-more">
            <ul type="none">
              {incompleteTasks.map((task) => (
                <li key={task.id}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <input 
                        type="checkbox" 
                        checked={!!task.completed}
                        onChange={() => toggleCompleteProp && toggleCompleteProp(task.id)} 
                      />
                      <span className={task.completed ? 'task-completed' : ''}>{task.text}</span>
                    </label>
                    <div style={{marginLeft: 'auto'}}>
                      <button onClick={() => removeTaskProp && removeTaskProp(task.id)}>&times;</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
          <div style={{margin: "10px", fontSize: "20px", padding: "10px"}}>
          <span>There is no task/All task completed</span>
          </div>
          </>
        )}
    </>
  );
}
export default App;
