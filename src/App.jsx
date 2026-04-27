import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { CheckCircle2, Circle, Trash2, LogOut, Plus, Calendar, Flag, Filter, Moon, Sun, Play, Pause, RotateCcw, Timer, MessageSquare, X, Send } from 'lucide-react';

const TEAM_MEMBERS = ['Mudit', 'Jatin', 'Vansh', 'Prince'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  // Theme & Focus State
  const [isDark, setIsDark] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  
  // Form & Filter State
  const [newTask, setNewTask] = useState('');
  const [assignee, setAssignee] = useState(TEAM_MEMBERS[0]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [filterAssignee, setFilterAssignee] = useState('All');

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const login = async () => signInWithPopup(auth, googleProvider);
  const logout = async () => signOut(auth);

  // Focus Timer Logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      alert("Focus session complete! Take a 5-minute break.");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const resetTimer = () => { setIsTimerRunning(false); setTimeLeft(25 * 60); };

  // Real-time Database: Tasks
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      taskData.sort((a, b) => {
        if (a.completed === b.completed) return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        return a.completed ? 1 : -1;
      });
      setTasks(taskData);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time Database: Chat Messages
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // Task & Chat Actions
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), {
      title: newTask, assignee, dueDate, priority, completed: false,
      createdBy: user.displayName, createdAt: serverTimestamp(),
    });
    setNewTask(''); setDueDate(''); setPriority('Medium');
  };

  const toggleComplete = async (task) => updateDoc(doc(db, 'tasks', task.id), { completed: !task.completed });
  const deleteTask = async (id) => deleteDoc(doc(db, 'tasks', id));

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      sender: user.displayName,
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  };

  // Dynamic Theme Classes
  const theme = {
    bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
    card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100',
    text: isDark ? 'text-gray-100' : 'text-gray-800',
    subtext: isDark ? 'text-gray-400' : 'text-gray-500',
    input: isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500',
    hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    timer: isDark ? 'bg-gray-950 border-gray-700 text-blue-400' : 'bg-gray-900 border-gray-800 text-blue-400',
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg} transition-colors duration-300`}>
        <div className={`${theme.card} p-8 rounded-xl shadow-lg max-w-sm w-full text-center border`}>
          <h1 className={`text-2xl font-bold ${theme.text} mb-6`}>Collaborative Study Planner</h1>
          <p className={`${theme.subtext} mb-8`}>Sign in to coordinate tasks with your team.</p>
          <button onClick={login} className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const filteredTasks = filterAssignee === 'All' ? tasks : tasks.filter(t => t.assignee === filterAssignee);

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300 p-4 md:p-8 font-sans pb-24`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <header className={`flex-1 flex justify-between items-center ${theme.card} p-5 rounded-xl shadow-sm border w-full`}>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${theme.text}`}>Project Workspace</h1>
              <p className={`text-sm mt-1 ${theme.subtext}`}>Logged in as <span className="font-medium">{user.displayName}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg ${theme.hover} ${theme.subtext} transition`}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={logout} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${theme.subtext} hover:text-red-500 transition`}>
                <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Focus Timer Widget */}
          <div className={`flex items-center gap-4 px-6 py-4 rounded-xl shadow-sm border ${theme.timer} w-full md:w-auto justify-center`}>
            <Timer size={24} className="opacity-80" />
            <div className="text-3xl font-mono font-bold tracking-wider w-24 text-center">
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={resetTimer} className="p-2 rounded-full hover:bg-white/10 transition text-gray-400 hover:text-white">
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={addTask} className={`${theme.card} p-5 rounded-xl shadow-sm border mb-8`}>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input 
              type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} required
              placeholder="What needs to be done?" 
              className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${theme.input}`}
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium">
              <Plus size={20} /> Add Task
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={`px-3 py-2 border rounded-md cursor-pointer flex-1 ${theme.input}`}>
              {TEAM_MEMBERS.map(member => <option key={member} value={member}>{member}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`px-3 py-2 border rounded-md cursor-pointer flex-1 ${theme.input}`} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`px-3 py-2 border rounded-md cursor-pointer flex-1 ${theme.input}`}>
              {PRIORITIES.map(level => <option key={level} value={level}>{level} Priority</option>)}
            </select>
          </div>
        </form>

        {/* Task List */}
        <div className={`${theme.card} rounded-xl shadow-sm border overflow-hidden`}>
          <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
            <h2 className={`font-semibold ${theme.text}`}>Team Tasks</h2>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className={`px-3 py-1 border rounded-md cursor-pointer text-sm ${theme.input}`}>
              <option value="All">All Members</option>
              {TEAM_MEMBERS.map(member => <option key={member} value={member}>Just {member}</option>)}
            </select>
          </div>
          <ul className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {filteredTasks.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No tasks found.</div>
            ) : (
              filteredTasks.map((task) => (
                <li key={task.id} className={`flex items-center justify-between p-4 transition group ${theme.hover} ${task.completed ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-4 flex-1">
                    <button onClick={() => toggleComplete(task)} className={`mt-1 focus:outline-none ${task.completed ? 'text-blue-500' : theme.subtext}`}>
                      {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <div>
                      <p className={`text-lg font-medium ${task.completed ? 'line-through' : theme.text}`}>{task.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium">
                        <span className={`px-2 py-1 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                          👤 {task.assignee}
                        </span>
                        {task.dueDate && (
                          <span className={`px-2 py-1 rounded-md border flex items-center gap-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                            <Calendar size={12} /> {task.dueDate}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-md border ${task.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={20} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* FLOATING CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition transform hover:scale-105 flex items-center justify-center"
          >
            <MessageSquare size={24} />
          </button>
        ) : (
          <div className={`w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Chat Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare size={18} /> Team Chat
              </h3>
              <button onClick={() => setIsChatOpen(false)} className="text-blue-100 hover:text-white transition">
                <X size={20}/>
              </button>
            </div>

            {/* Messages Container */}
            <div className={`h-80 overflow-y-auto p-4 flex flex-col gap-3 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-auto mb-auto text-sm">No messages yet. Start the conversation!</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender === user.displayName;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-gray-500 mb-1 px-1">{isMe ? 'You' : msg.sender}</span>
                      <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : isDark 
                            ? 'bg-gray-700 text-gray-100 rounded-bl-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className={`p-3 border-t flex gap-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-transparent'}`}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center h-10 w-10"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}