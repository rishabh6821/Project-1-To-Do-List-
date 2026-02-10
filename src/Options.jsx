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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [tasks, setTasks] = useState([]);
  const [allUsersTasks, setAllUsersTasks] = useState({});

  // Load users on mount
  useEffect(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('todo.users') || '[]');
      setAllUsers(storedUsers);
      
      // Initialize admin user if not exists
      if (!storedUsers.find(u => u.isAdmin)) {
        const adminUser = { name: 'Admin', password: 'admin123', isAdmin: true };
        const updatedUsers = [...storedUsers, adminUser];
        setAllUsers(updatedUsers);
        localStorage.setItem('todo.users', JSON.stringify(updatedUsers));
        Notify('Admin account created (username: Admin, password: admin123)', 'info');
      }
    } catch (e) {
      console.warn('Failed to load users', e);
    }
  }, []);

  // Load all users' tasks when logged in as admin
  useEffect(() => {
    if (!isAdmin || !isLoggedIn) return;
    
    const allTasks = {};
    allUsers.forEach(user => {
      if (!user.isAdmin) {
        try {
          const raw = localStorage.getItem(`todo.tasks.${user.name}`);
          if (raw) {
            allTasks[user.name] = JSON.parse(raw);
          } else {
            allTasks[user.name] = [];
          }
        } catch (e) {
          console.warn(`Failed to load tasks for ${user.name}`, e);
          allTasks[user.name] = [];
        }
      }
    });
    setAllUsersTasks(allTasks);
  }, [isAdmin, isLoggedIn, allUsers]);

  function handleLogin() {
    const user = allUsers.find(u => u.name === loginUsername && u.password === loginPassword);
    if (!user) return Notify('Invalid username or password', 'error');
    
    setCurrentUser(user.name);
    setIsLoggedIn(true);
    setIsAdmin(user.isAdmin || false);
    setLoginUsername("");
    setLoginPassword("");
    Notify(`Welcome ${user.name}!`, 'success');
  }

  function handleRegister() {
    const name = newUserName.trim();
    const password = newPassword.trim();
    
    if (!name || !password) return Notify('Enter both username and password', 'error');
    if (allUsers.find(u => u.name === name)) return Notify('User already exists', 'error');

    const updatedUsers = [...allUsers, { name, password, isAdmin: false }];
    setAllUsers(updatedUsers);
    localStorage.setItem('todo.users', JSON.stringify(updatedUsers));
    setNewUserName("");
    setNewPassword("");
    Notify(`User ${name} registered! Please log in.`, 'success');
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsAdmin(false);
    setSelectedIndex(null);
    setInputValue("");
    setTasks([]);
    Notify('Logged out successfully', 'info');
  }

  // Load regular user tasks when logged in
  useEffect(() => {
    if (!isLoggedIn || isAdmin || !currentUser) return;
    
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/tasks?user=${encodeURIComponent(currentUser)}`);
        if (!res.ok) throw new Error('Server unavailable');
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          setTasks(data);
          return;
        }
      } catch (err) {
        console.info('Could not fetch tasks from API, using local storage fallback', err);
      }

      try {
        const raw = localStorage.getItem(`todo.tasks.${currentUser}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && mounted) {
            const tasksWithIds = parsed.map((t, idx) => ({
              ...t,
              id: t.id || `t${currentUser}${idx}${Date.now()}`
            }));
            setTasks(tasksWithIds);
          }
        } else {
          setTasks([]);
        }
      } catch (e) {
        console.warn('Failed to load tasks from localStorage', e);
        setTasks([]);
      }
    }

    load();
    return () => { mounted = false; };
  }, [isLoggedIn, isAdmin, currentUser]);

  // Save user tasks to localStorage whenever tasks change
  useEffect(() => {
    if (!currentUser || isAdmin) return;
    try {
      localStorage.setItem(`todo.tasks.${currentUser}`, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }, [tasks, currentUser, isAdmin]);

  async function addTask() {
    const val = inputValue.trim();
    if (!val) return Notify('Enter a task', 'error');

    // Create task with proper ID
    const temp = { id: `t${Date.now()}`, text: val, completed: false };
    setTasks(prev => [...prev, temp]);
    setInputValue("");

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: val, user: currentUser })
      });

      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      setTasks(prev => prev.map(t => (t.id === temp.id ? { ...saved, id: saved.id || temp.id } : t)));
      Notify('Task added successfully!', 'success');
    } catch (e) {
      Notify('Task added locally', 'info');
      console.warn('Add task to server failed', e);
    }
  }


  async function removeTask(taskId) {
    if (!taskId) return Notify('Invalid task', 'error');

    const previous = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser })
      });
      if (!res.ok) throw new Error('Delete failed');
      Notify('Task removed!', 'success');
    } catch (e) {
      setTasks(previous);
      Notify('Task removed locally', 'info');
      console.warn('Remove failed', e);
    }
  }

  async function toggleComplete(taskId) {
    if (!taskId) return Notify('Invalid task', 'error');

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const previous = [...tasks];
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed, user: currentUser })
      });
      if (!res.ok) throw new Error('Update failed');
      Notify(task.completed ? 'Marked as incomplete!' : 'Marked as complete!', 'success');
    } catch (e) {
      setTasks(previous);
      Notify('Task toggled locally', 'info');
      console.warn('Toggle failed', e);
    }
  }

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <>
        <div className="App-structure">
          <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '500px', margin: '50px auto' }}>
            <h1 style={{ marginBottom: '30px', color: '#38320d' }}>To-Do App Login</h1>
            
            <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Login</h2>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleLogin}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#12c986',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Login
              </button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Demo: Username: <strong>Admin</strong>, Password: <strong>admin123</strong>
              </p>
            </div>

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '25px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Create New Account</h2>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="New Username"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={handleRegister}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#3a7bd5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Register
              </button>
            </div>
          </div>
          <ToastContainer />
        </div>
      </>
    );
  }

  // ADMIN DASHBOARD
  if (isAdmin) {
    return (
      <>
        <div className="App-structure">
          <div style={{ padding: '15px 20px', backgroundColor: '#38320d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Admin Dashboard - All Users Tasks</h2>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f8223d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Logout
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {allUsers.filter(u => !u.isAdmin).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>No users yet.</p>
            ) : (
              <div>
                {allUsers.filter(u => !u.isAdmin).map(user => (
                  <div key={user.name} style={{ marginBottom: '30px', border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#38320d' }}>{user.name}'s Tasks</h3>
                    
                    {(!allUsersTasks[user.name] || allUsersTasks[user.name].length === 0) ? (
                      <p style={{ color: '#999', margin: 0 }}>No tasks</p>
                    ) : (
                      <div>
                        <div style={{ marginBottom: '15px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>To Do:</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {allUsersTasks[user.name]
                              .filter(t => !t.completed)
                              .map(task => (
                                <li key={task.id} style={{ marginBottom: '5px' }}>{task.text}</li>
                              ))}
                          </ul>
                          {allUsersTasks[user.name].filter(t => !t.completed).length === 0 && (
                            <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>No pending tasks</p>
                          )}
                        </div>

                        <div>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Completed:</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none' }}>
                            {allUsersTasks[user.name]
                              .filter(t => t.completed)
                              .map(task => (
                                <li key={task.id} style={{ marginBottom: '5px', textDecoration: 'line-through', color: '#999' }}>
                                  {task.text}
                                </li>
                              ))}
                          </ul>
                          {allUsersTasks[user.name].filter(t => t.completed).length === 0 && (
                            <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>No completed tasks</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <ToastContainer />
        </div>
      </>
    );
  }
  // REGULAR USER VIEW
  return (
    <>
      <div className="App-structure">
        <div style={{ padding: '15px 20px', backgroundColor: '#38320d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>My Tasks - {currentUser}</h2>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f8223d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>

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