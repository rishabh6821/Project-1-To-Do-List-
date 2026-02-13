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
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  // Load users on mount
  useEffect(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('todo.users') || '[]');
      setAllUsers(storedUsers);
      // Restore session if user was previously logged in
      try {
        const storedCurrent = localStorage.getItem('todo.currentUser');
        if (storedCurrent) {
          const found = storedUsers.find(u => u.name === storedCurrent);
          if (found) {
            setCurrentUser(found.name);
            setIsLoggedIn(true);
            setIsAdmin(found.isAdmin || false);
            Notify(`Welcome back ${found.name}!`, 'info');
          }
        }
      } catch (e) {
        console.warn('Failed to restore session from localStorage', e);
      }
      
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
          allTasks[user.name] = raw ? JSON.parse(raw) : [];
        } catch (e) {
          console.warn(`Failed to load tasks for ${user.name} from localStorage`, e);
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
    try { localStorage.setItem('todo.currentUser', user.name); } catch (e) { console.warn('Failed to persist session', e); }
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
    try { localStorage.removeItem('todo.currentUser'); } catch (e) { console.warn('Failed to clear persisted session', e); }
    Notify('Logged out successfully', 'info');
  }

  function changePassword() {
    if (!currentUser) return Notify('No user logged in', 'error');
    if (!oldPasswordInput) return Notify('Enter current password', 'error');
    if (!newPasswordInput) return Notify('Enter a new password', 'error');
    if (newPasswordInput !== confirmPasswordInput) return Notify('New passwords do not match', 'error');

    const idx = allUsers.findIndex(u => u.name === currentUser);
    if (idx === -1) return Notify('User not found', 'error');
    const user = allUsers[idx];
    if (user.password !== oldPasswordInput) return Notify('Current password is incorrect', 'error');

    const updatedUsers = [...allUsers];
    updatedUsers[idx] = { ...user, password: newPasswordInput };
    setAllUsers(updatedUsers);
    try { localStorage.setItem('todo.users', JSON.stringify(updatedUsers)); } catch (e) { console.warn('Failed to persist new password', e); }

    setShowChangePwd(false);
    setOldPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    Notify('Password changed successfully', 'success');
  }

  // Load regular user tasks when logged in
  useEffect(() => {
    if (!isLoggedIn || isAdmin || !currentUser) return;

    let mounted = true;
    function loadLocal() {
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
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load tasks from localStorage', e);
      }
      if (mounted) setTasks([]);
    }

    loadLocal();
    return () => { mounted = false; };
  }, [isLoggedIn, isAdmin, currentUser]);

  // Provide functions to export/import tasks to/from the user's device
  async function exportTasksToDevice() {
    if (!currentUser) return Notify('No user selected', 'error');
    const data = JSON.stringify(tasks, null, 2);
    try {
      if (window.showSaveFilePicker) {
        const opts = {
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] }
            }
          ]
        };
        const handle = await window.showSaveFilePicker(opts);
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        Notify('Tasks saved to device', 'success');
        return;
      }

      // Fallback: trigger a download
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentUser || 'tasks'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      Notify('Tasks downloaded', 'success');
    } catch (e) {
      console.warn('Export failed', e);
      Notify('Failed to save tasks to device', 'error');
    }
  }

  async function importTasksFromDevice() {
    if (!currentUser) return Notify('No user selected', 'error');
    try {
      let file;
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }] });
        file = await handle.getFile();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.click();
        file = await new Promise((resolve) => { input.onchange = () => resolve(input.files[0]); });
      }

      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return Notify('Invalid tasks file', 'error');
      const tasksWithIds = parsed.map((t, idx) => ({ ...t, id: t.id || `t${Date.now()}${idx}` }));
      setTasks(tasksWithIds);
      Notify('Tasks imported from device', 'success');
    } catch (e) {
      console.warn('Import failed', e);
      Notify('Import cancelled or failed', 'error');
    }
  }

  function addTask() {
    const val = inputValue.trim();
    if (!val) return Notify('Enter a task', 'error');

    const newTask = { id: `t${Date.now()}`, text: val, completed: false };
    setTasks(prev => {
      const next = [...prev, newTask];
      try { localStorage.setItem(`todo.tasks.${currentUser}`, JSON.stringify(next)); } catch (e) { console.warn('Failed to save tasks', e); }
      return next;
    });
    setInputValue("");
    Notify('Task added', 'success');
  }


  function removeTask(taskId) {
    if (!taskId) return Notify('Invalid task', 'error');
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      try { localStorage.setItem(`todo.tasks.${currentUser}`, JSON.stringify(next)); } catch (e) { console.warn('Failed to save after remove', e); }
      return next;
    });
    Notify('Task removed', 'success');
  }

  function toggleComplete(taskId) {
    if (!taskId) return Notify('Invalid task', 'error');
    setTasks(prev => {
      const next = prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      try { localStorage.setItem(`todo.tasks.${currentUser}`, JSON.stringify(next)); } catch (e) { console.warn('Failed to save after toggle', e); }
      return next;
    });
    const task = tasks.find(t => t.id === taskId);
    Notify(task && task.completed ? 'Marked as incomplete!' : 'Marked as complete!', 'success');
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={exportTasksToDevice}
              style={{
                padding: '8px 12px',
                backgroundColor: '#0ea5a4',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Save to device
            </button>
            <button
              onClick={importTasksFromDevice}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Load from device
            </button>
            <button
              onClick={() => setShowChangePwd(true)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Change password
            </button>
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
        </div>

        {showChangePwd && (
          <div style={{ padding: '12px', background: '#ffffff', borderRadius: '8px', margin: '12px 20px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="password" placeholder="Current password" value={oldPasswordInput} onChange={(e) => setOldPasswordInput(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="password" placeholder="New password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="password" placeholder="Confirm new password" value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={changePassword} style={{ padding: '8px 12px', backgroundColor: '#0ea5a4', color: 'white', border: 'none', borderRadius: '6px' }}>Change</button>
                <button onClick={() => setShowChangePwd(false)} style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

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