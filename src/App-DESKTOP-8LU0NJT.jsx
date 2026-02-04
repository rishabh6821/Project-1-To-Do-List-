import { useState } from "react";
import Notify from "./assets/notify";
import { ToastContainer } from 'react-toastify';
function App({
  tasks: tasksProp,
  addTask: addTaskProp,
  removeTask: removeTaskProp,
  toggleComplete: toggleCompleteProp,
  inputValue: inputValueProp,
  setInputValue: setInputValueProp,
  onExit,
}) {
  // local fallbacks so this component can be used standalone or with parent-managed state
  const [tasksLocal, setTasksLocal] = useState([
    { text: "Go to school", completed: false },
    { text: "Complete assignment", completed: false },
    { text: "Learn React", completed: false },
  ]);
  const [inputValueLocal, setInputValueLocal] = useState("");
  
  const tasks = tasksProp ?? tasksLocal;
  const inputValue = inputValueProp ?? inputValueLocal;
  const setInputValue = setInputValueProp ?? setInputValueLocal;

  function addTask() {
    if (addTaskProp) return addTaskProp();
    if (inputValue.trim() !== "") {
      setTasksLocal([...tasksLocal, { text: inputValue.trim(), completed: false }]);
      setInputValueLocal("");
    } else {
      Notify("Please enter a valid task.", "error");
    }
  }

  function removeTask(index) {
    if (removeTaskProp) return removeTaskProp(index);
    const updated = tasksLocal.filter((_, i) => i !== index);
    setTasksLocal(updated);
  }

  function toggleComplete(index) {
    if (toggleCompleteProp) return toggleCompleteProp(index);
    const updated = tasksLocal.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t));
    setTasksLocal(updated);
  }


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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            id="add-task-button"
            type="submit"
            onClick={addTask}
          >
            Add
          </button>
        </div>
        {tasks.length > 0 ? (
          <div className="list-of-tasks-more">
            <ul type="none">
              {tasks.map((task, index) => (
                <li key={task.id || index}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <input type="checkbox" checked={!!task.completed} onChange={() => toggleComplete(task.id)} />
                      <span className={task.completed ? 'task-completed' : ''}>{task.text}</span>
                    </label>
                    <div style={{marginLeft: 'auto'}}>
                      <button onClick={() => removeTask(task.id)}>&times;</button>
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
