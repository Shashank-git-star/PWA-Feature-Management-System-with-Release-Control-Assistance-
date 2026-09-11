import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, Globe, Users, Target, FlaskConical, 
  Activity, LogOut, Settings, ChevronRight, UserCircle, X
} from 'lucide-react';
import api from './api';

import FlagDashboard from './pages/FlagDashboard';
import Environments from './pages/Environments';
import UserGroups from './pages/UserGroups';
import TargetingRules from './pages/TargetingRules';
import EvaluationTester from './pages/EvaluationTester';
import AuditLogs from './pages/AuditLogs'; 

const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center justify-between p-4 rounded-2xl font-bold transition-all duration-300 group ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
          {icon}
        </span>
        <span className="tracking-tight">{label}</span>
      </div>
      {isActive && <ChevronRight size={16} />}
    </Link>
  );
};

const AuthScreen = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError('');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      let user;
      let token;

      if (mode === 'signup') {
        const response = await api.post('/auth/signup', {
          email: form.email,
          password: form.password,
        });
        user = response.data;

        const loginData = new URLSearchParams();
        loginData.set('username', form.email);
        loginData.set('password', form.password);
        const loginResponse = await api.post('/auth/login', loginData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        token = loginResponse.data.access_token;
      } else {
        const loginData = new URLSearchParams();
        loginData.set('username', form.email);
        loginData.set('password', form.password);
        const loginResponse = await api.post('/auth/login', loginData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        token = loginResponse.data.access_token;

        const usersResponse = await api.get('/auth/users');
        user = usersResponse.data.find((candidate) => candidate.email === form.email) || {
          email: form.email,
        };
      }

      onAuthenticated(user, token);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to complete authentication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Settings className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">INFY_Project</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Feature Management</p>
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-slate-500">
          {mode === 'login' ? 'Sign in to manage your feature releases.' : 'Sign up to start managing feature releases.'}
        </p>

        <form onSubmit={submitForm} className="mt-8 space-y-4">
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={updateField}
            placeholder="Email address"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            minLength={6}
            type="password"
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {mode === 'signup' && (
            <input
              required
              minLength={6}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 p-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'PLEASE WAIT...' : mode === 'login' ? 'LOGIN' : 'SIGN UP'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
          className="mt-6 w-full text-center text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('infy_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleAuthenticated = (authenticatedUser, token) => {
    localStorage.setItem('infy_token', token);
    localStorage.setItem('infy_user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('infy_token');
      localStorage.removeItem('infy_user');
      setIsProfileOpen(false);
      setUser(null);
    }
  };

  return (
    <Router>
      {!user ? (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      ) : (
      <div className="flex min-h-screen bg-[#f8fafc]">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-80 bg-[#0f172a] text-white flex flex-col fixed h-full shadow-2xl z-50">
          
          {/* Logo Section */}
          <div className="p-8 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-inner">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none italic">INFY_Project</h1>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Feature Management</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-4">Feature Management</p>
            <SidebarLink to="/" icon={<LayoutGrid size={20}/>} label="Core Dashboard" />
            <SidebarLink to="/targeting" icon={<Target size={20}/>} label="Targeting Rules" />
            <SidebarLink to="/environments" icon={<Globe size={20}/>} label="Environments" />
            <SidebarLink to="/groups" icon={<Users size={20}/>} label="User/Groups" />
            
            <div className="my-8 border-t border-slate-800/50 pt-8">
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-4">Evaluation & Analytics</p>
               <SidebarLink to="/test" icon={<FlaskConical size={20}/>} label="Evaluation Tester" />
               <SidebarLink to="/audit" icon={<Activity size={20}/>} label="Audit Logs" />
            </div>
          </nav>

          {/* Logout Section */}
          <div className="p-6 border-t border-slate-800/50 bg-[#0c1222]">
            {isProfileOpen && (
              <div className="relative mb-4 rounded-2xl bg-slate-800 p-4 text-sm">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  aria-label="Close profile details"
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
                <p className="text-xs font-black uppercase tracking-widest text-blue-400">Profile</p>
                <p className="mt-3 font-bold text-white break-all">{user.email}</p>
                {user.id && <p className="mt-1 text-xs text-slate-400">User ID: {user.id}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  Status: {user.is_active === false ? 'Inactive' : 'Active'}
                </p>
                {user.created_at && (
                  <p className="mt-1 text-xs text-slate-400">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                )}
                {user.updated_at && (
                  <p className="mt-1 text-xs text-slate-400">
                    Updated: {new Date(user.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="mb-3 w-full flex items-center gap-3 rounded-[1.25rem] p-3 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition"
              aria-expanded={isProfileOpen}
            >
              <UserCircle size={28} className="text-blue-400" />
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Signed in as</span>
                <span className="block truncate font-bold">{user.email}</span>
              </span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-[1.25rem] font-black hover:bg-red-500 hover:text-white transition-all duration-300 group shadow-sm"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> 
              LOGOUT SESSION
            </button>
          </div>
        </aside>

        {/* --- MAIN INTERACTIVE CONTENT AREA --- */}
        <main className="flex-1 ml-80 p-12 transition-all">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<FlagDashboard />} />
              <Route path="/environments" element={<Environments />} />
              <Route path="/targeting" element={<TargetingRules />} />
              <Route path="/groups" element={<UserGroups />} />
              <Route path="/test" element={<EvaluationTester />} />
              <Route path="/audit" element={<AuditLogs />} />
            </Routes>
          </div>
        </main>

      </div>
      )}
    </Router>
  );
};

export default App;