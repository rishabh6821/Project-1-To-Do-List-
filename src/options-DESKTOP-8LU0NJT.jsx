import { useState, useEffect } from "react";
import App from "./App.jsx";
import Completed from "./Completed.jsx";
import AllWorks from "./AllWorks.jsx";
import Notify from "./assets/notify";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const options = [
  "Show works to do",
  "Show completed works",
  "Show all works",
];

function SelectOption() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [tasks, setTasks] = useState([
    { text: "Go to school", completed: false },
    { text: "Complete assignment", completed: true },
    { text: "Learn React", completed: false },
    { text: "Complete project", completed: false },
    { text: "Go to gym", completed: true },
  ]);

  // Try to load tasks from server, fall back to localStorage
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Server unavailable');
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          setTasks(data);
          Notify('Loaded tasks from server', 'success');
          return;
        }
      } catch (err) {
        // ignore and fall back to localStorage
        console.info('Could not fetch tasks from API, using local storage fallback', err);
      }

      try {
        const raw = localStorage.getItem('todo.tasks');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && mounted) setTasks(parsed);
        }
      } catch (e) {
        console.warn('Failed to load tasks from localStorage', e);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // Save tasks to localStorage whenever tasks change (still useful as a fallback)
  useEffect(() => {
    try {
      localStorage.setItem('todo.tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  async function addTask() {
    const val = inputValue.trim();
    if (!val) return Notify('Enter a task', 'error');

    // optimistic UI for immediate feedback
    const temp = { id: `t${Date.now()}`, text: val, completed: false };
    setTasks(prev => [...prev, temp]);
    setInputValue("");

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: val })
      });

      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      // replace temp with saved (id from server)
      setTasks(prev => prev.map(t => (t === temp ? saved : t)));
      Notify('Task saved', 'success');
    } catch (e) {
      Notify('Could not save to server — kept locally', 'error');
      console.warn('Add task failed', e);
    }
  }

  async function removeTask(idOrIndex) {
    let id = idOrIndex;
    if (typeof idOrIndex === 'number') id = tasks[idOrIndex]?.id;
    if (!id) return;

    // optimistic remove
    const previous = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      Notify('Task removed', 'success');
    } catch (e) {
      // rollback
      setTasks(previous);
      Notify('Could not remove task on server', 'error');
      console.warn('Remove failed', e);
    }
  }

  async function toggleComplete(idOrIndex) {
    let id = idOrIndex;
    if (typeof idOrIndex === 'number') id = tasks[idOrIndex]?.id;
    if (!id) return;

    const previous = [...tasks];
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));

    try {
      const task = tasks.find(t => t.id === id);
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task?.completed })
      });
      if (!res.ok) throw new Error('Update failed');
      Notify('Task updated', 'success');
    } catch (e) {
      setTasks(previous);
      Notify('Could not update task on server', 'error');
      console.warn('Toggle failed', e);
    }
  }

  return (
    <>
      <div className="App-structure">
        {selectedIndex !== 0 && (
          <div className="options-list">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={selectedIndex === i ? "option-active" : "option"}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        <div className="option-content">
          <ToastContainer />
          {selectedIndex === 0 && (
            <App
              tasks={tasks}
              addTask={addTask}
              removeTask={removeTask}
              toggleComplete={toggleComplete}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onExit={() => setSelectedIndex(null)}
            />
          )}

          {selectedIndex === 1 && (
            <Completed
              tasks={tasks}
              removeTask={removeTask}
              toggleComplete={toggleComplete}
              onExit={() => setSelectedIndex(null)}
            />
          )}

          {selectedIndex === 2 && (
            <AllWorks
              tasks={tasks}
              removeTask={removeTask}
              toggleComplete={toggleComplete}
              onExit={() => setSelectedIndex(null)}
            />
          )}

          {selectedIndex === null && (
            <div>
              <p>Please select an option above.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SelectOption;