import { useState } from "react";
import Notify from "./assets/notify";
import { ToastContainer } from 'react-toastify';
function App() {
  const [tasks, setTasks] = useState([
    "Go to school", 
    "Complete assignment",
    "Learn React",
    "Complete project",
    "Go to gym"
  ]);
  const [inputValue, setInputValue] = useState("");

  function addTask() {
    if (inputValue.trim() !== "") {
      setTasks([...tasks, inputValue.trim()]);
      setInputValue("");
    } else {
      Notify("Please enter a valid task.", "error");
    }
  }

  function removeTask(index) {
    let updatedTasks = [...tasks];
    updatedTasks.splice(index, 1);
    setTasks(updatedTasks);
  }


  return (
    <>
     <h2>To Do List</h2>
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
        <br />
        {tasks.length > 0 ? (
          <div className="list-of-tasks-more">
            <ul type="none">
              {tasks.map((task, index) => (
                <li key={index}>{task} <button onClick={() => removeTask(index)}>&times;</button></li>
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
