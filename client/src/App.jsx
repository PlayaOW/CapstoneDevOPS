import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Pause, RotateCcw, Music, User, LogIn, Trophy, Leaf, Book, Shield, Swords, Crown } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const API_BASE = '/api';
const MUSIC_BASE = 'https://pub-c14bfc8648b04a798e410b3f82a156ea.r2.dev';

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // pomodoro, short, long
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentMusic, setCurrentMusic] = useState(null);
  const audioRef = useRef(new Audio());
  const alertAudioRef = useRef(new Audio(`${MUSIC_BASE}/bell.mp3`));
  const [isDark, setIsDark] = useState(true);
  const [task, setTask] = useState('');
  const [dailySessions, setDailySessions] = useState(0);
  const [quote, setQuote] = useState('');
  const [notification, setNotification] = useState(null);

  const quotes = [
    "The best way to predict the future is to create it.",
    "One step at a time.",
    "Focus on the process, not the outcome.",
    "Dream big, work hard, stay focused.",
    "Your future self will thank you.",
    "Small progress is still progress.",
    "Make it happen."
  ];

  const timerRef = useRef(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
    
    if (type === 'success' && Notification.permission === 'granted') {
      new Notification('PomodoroGame', {
        body: message,
        icon: '/vite.svg'
      });
    }
  };

  async function fetchProfile(token) {
    try {
      const res = await axios.get(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');
    }
  }

  function resetTimer(newMode = mode) {
    setIsActive(false);
    if (newMode === 'pomodoro') setTimeLeft(25 * 60);
    else if (newMode === 'short') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  }

  async function handleSessionComplete() {
    setIsActive(false);
    setDailySessions(prev => prev + 1);
    alertAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
    showNotification('Session complete! Great work.', 'success');
    if (user) {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/session`, { duration: mode === 'pomodoro' ? 25 : 5 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfile(token);
    }
    resetTimer();
  }

  const toggleTimer = () => setIsActive(!isActive);

  async function handleAuth(e) {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API_BASE}/register`, { username, password });
        setIsRegister(false);
        showNotification('Registered successfully! Please login.', 'success');
      } else {
        const res = await axios.post(`${API_BASE}/login`, { username, password });
        localStorage.setItem('token', res.data.token);
        fetchProfile(res.data.token);
        setShowAuth(false);
        showNotification(`Welcome back, ${username}!`, 'success');
      }
    } catch {
      showNotification('Authentication failed. Please try again.', 'error');
    }
  }

  function playMusic(genre) {
    const file = `${genre}.mp3`;
    if (currentMusic === genre) {
      audioRef.current.pause();
      setCurrentMusic(null);
    } else {
      audioRef.current.src = `${MUSIC_BASE}/${file}`;
      audioRef.current.loop = true;
      audioRef.current.play();
      setCurrentMusic(genre);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchProfile(token);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDark]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current);
      handleSessionComplete();
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 transition-colors duration-300">
      {/* Header */}
      <nav className="flex flex-col sm:grid sm:grid-cols-3 items-center gap-6 mb-8 sm:mb-12">
        {/* Left: Dark Mode Toggle & Mobile Title */}
        <div className="flex justify-between items-center w-full sm:justify-start">
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors duration-300 ${isDark ? 'bg-white/20 justify-start' : 'bg-[#3E2723]/20 justify-end'}`}
          >
            <Motion.div 
              layout
              className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#F5F5DC]'}`}
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
            >
               {isDark ? '🌙' : '☀️'}
            </Motion.div>
          </button>
          
          <div className="sm:hidden">
            <h1 className="text-xl font-bold tracking-tight">
              Pomodoro<span>Game</span>
            </h1>
          </div>
        </div>

        {/* Center: Title (Desktop) */}
        <div className="hidden sm:flex justify-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Pomodoro<span>Game</span>
          </h1>
        </div>
        
        {/* Right: Auth */}
        <div className="flex gap-2 items-center justify-center sm:justify-end w-full">
          {user ? (
            <div className="flex items-center gap-3 glass px-3 py-2 sm:px-4">
              <span className="text-xl">{user.badge}</span>
              <div className="text-sm">
                <p className="font-bold leading-none">{user.username}</p>
                <p className="text-xs opacity-60">{user.title} • {user.xp} XP</p>
              </div>
              <button 
                onClick={() => { localStorage.removeItem('token'); setUser(null); }}
                className="ml-2 text-xs opacity-50 hover:opacity-100"
              >Logout</button>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => { setIsRegister(false); setShowAuth(true); }}
                className="glass flex-1 sm:flex-none px-4 sm:px-6 py-2 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-sm sm:text-base"
              >
                <LogIn size={18} /> Login
              </button>
              <button 
                onClick={() => { setIsRegister(true); setShowAuth(true); }}
                className="bg-[#A1887F] text-white flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-[#8d756c] transition-colors shadow-lg text-sm sm:text-base"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8">
        {/* Focus Intent Input */}
        <div className="w-full max-w-md px-4">
          <input 
            type="text" 
            placeholder="What are you focusing on?" 
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full bg-transparent text-center text-lg sm:text-xl placeholder-opacity-50 focus:outline-none border-b border-transparent focus:border-white/20 pb-2 transition-colors"
          />
        </div>

        {/* Timer UI */}
        <div className="glass p-6 sm:p-12 w-full max-w-md text-center flex flex-col gap-6 sm:gap-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {['pomodoro', 'short', 'long'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); resetTimer(m); }}
                className={`px-3 py-1 sm:px-4 rounded-full text-[10px] sm:text-xs font-medium transition-all ${mode === m ? 'bg-[#A1887F] text-white' : 'hover:bg-white/5'}`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <Motion.div 
            key={timeLeft}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl sm:text-8xl font-black tracking-tighter"
          >
            {formatTime(timeLeft)}
          </Motion.div>

          <div className="flex justify-center gap-4 sm:gap-6">
            <button onClick={toggleTimer} className="w-14 h-14 sm:w-16 sm:h-16 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
              {isActive ? <Pause size={28} /> : <Play size={28} fill="black" />}
            </button>
            <button onClick={() => resetTimer(mode)} className="w-14 h-14 sm:w-16 sm:h-16 glass flex items-center justify-center hover:scale-105 transition-transform">
              <RotateCcw size={28} />
            </button>
          </div>

          {/* Daily Progress Dots */}
          <div className="flex justify-center gap-2 mt-2 sm:mt-4">
            {[...Array(4)].map((_, i) => (
               <div 
                 key={i} 
                 className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-500 ${i < dailySessions % 5 ? 'bg-[#A1887F]' : 'bg-white/10'}`}
               />
            ))}
          </div>
        </div>

        {/* Music Player */}
        <div className="glass p-4 sm:p-6 w-full max-w-md">
          <h3 className="text-xs sm:text-sm font-semibold opacity-60 mb-3 sm:mb-4 flex items-center gap-2">
            <Music size={16} /> Ambient Sounds
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { id: 'lofi', icon: '🎧', label: 'Lofi' },
              { id: 'classical', icon: '🎻', label: 'Classical' },
              { id: 'nature', icon: '🌿', label: 'Nature' },
            ].map((track) => (
              <button
                key={track.id}
                onClick={() => playMusic(track.id)}
                className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 transition-all border ${currentMusic === track.id ? 'bg-[#A1887F]/20 border-[#A1887F]' : 'glass border-transparent hover:border-white/20'}`}
              >
                <span className="text-xl sm:text-2xl">{track.icon}</span>
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">{track.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Quote Footer */}
      <footer className="mt-12 text-center flex flex-col gap-2">
        <p className="text-sm opacity-80">"{quote}"</p>
        <p className="text-xs opacity-40">&copy; 2026 PomodoroGame</p>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 glass border-[#A1887F]/30 shadow-2xl min-w-[280px] text-center"
          >
            <p className="text-sm font-bold tracking-wide">
              {notification.type === 'error' ? '⚠️ ' : '✨ '}
              {notification.message}
            </p>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <Motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAuth(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-6 sm:p-8 w-full max-w-sm relative z-10"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#A1887F]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#A1887F]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="btn-primary mt-2">{isRegister ? 'Sign Up' : 'Sign In'}</button>
              </form>
              <p className="mt-6 text-center text-sm opacity-60">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => setIsRegister(!isRegister)} className="text-[#A1887F] font-bold hover:underline">
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
