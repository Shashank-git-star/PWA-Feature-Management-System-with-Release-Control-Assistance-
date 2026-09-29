import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Globe, Users, Target, FlaskConical,
  Activity, LogOut, Settings, ChevronRight, UserCircle, X, PanelLeftClose, PanelLeftOpen,
  Flag
} from 'lucide-react';
import api from './api';
import { LanguageSelector, useLanguage } from './i18n.jsx';

import AnalyticsOverview from './pages/AnalyticsOverview';
import FlagDashboard from './pages/FlagDashboard';
import Environments from './pages/Environments';
import UserGroups from './pages/UserGroups';
import TargetingRules from './pages/TargetingRules';
import EvaluationTester from './pages/EvaluationTester';
import AuditLogs from './pages/AuditLogs'; 

const SidebarLink = ({ to, icon, label, onNavigate }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      onClick={onNavigate}
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
  const { t } = useLanguage();
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
      setError(t('Passwords do not match.'));
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
      setError(t(requestError.response?.data?.detail || 'Unable to complete authentication. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="fixed right-3 top-3 z-50 rounded-xl border border-white/70 bg-white/90 p-1 shadow-lg backdrop-blur sm:right-5 sm:top-5"><LanguageSelector /></div>
      <div className="auth-card w-full max-w-md rounded-3xl border border-white/80 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <Settings className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{t('Feature Flag')}</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">{t('Management System')}</p>
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900">
          {mode === 'login' ? t('Welcome back') : t('Create your account')}
        </h2>
        <p className="mt-2 text-slate-500">
          {mode === 'login' ? t('Sign in to manage your feature releases.') : t('Sign up to start managing feature releases.')}
        </p>

        <form onSubmit={submitForm} className="mt-8 space-y-4">
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={updateField}
            placeholder={t('Email address')}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            minLength={6}
            type="password"
            name="password"
            value={form.password}
            onChange={updateField}
            placeholder={t('Password')}
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
              placeholder={t('Confirm password')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 p-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t('PLEASE WAIT...') : mode === 'login' ? t('LOGIN') : t('SIGN UP')}
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
          {mode === 'login' ? t("Don't have an account? Sign up") : t('Already have an account? Login')}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const { t, locale } = useLanguage();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('infy_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsSidebarOpen(false);
    }
  };

  const handleAuthenticated = (authenticatedUser, token) => {
    localStorage.setItem('infy_token', token);
    localStorage.setItem('infy_user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    if (window.confirm(t("Are you sure you want to logout?"))) {
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
      <div className="app-shell flex min-h-screen">
        <div className={`fixed right-5 top-5 z-50 rounded-xl bg-white p-1 shadow-md ${isSidebarOpen ? 'hidden md:block' : ''}`}>
          <LanguageSelector />
        </div>
        {isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={t('Hide sidebar')}
            className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px] md:hidden"
          />
        )}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label={t('Show sidebar')}
            title={t('Show sidebar')}
            className="fixed left-4 top-4 z-50 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-md transition hover:bg-slate-50"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        
        {/* --- SIDEBAR --- */}
        {isSidebarOpen && <aside className="app-sidebar fixed z-40 flex h-full flex-col text-white shadow-2xl">
          
          {/* Logo Section */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800/50 p-5 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-inner">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none italic">{t('Feature Flag')}</h1>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{t('Management System')}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label={t('Hide sidebar')}
              title={t('Hide sidebar')}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="sidebar-language mb-6 md:hidden">
              <LanguageSelector />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-4">{t('Feature Management')}</p>
            <SidebarLink to="/analytics" icon={<Activity size={20}/>} label={t('Dashboard')} onNavigate={closeSidebarOnMobile} />
            <SidebarLink to="/" icon={<Flag size={20}/>} label={t('Flag Management')} onNavigate={closeSidebarOnMobile} />
            <SidebarLink to="/targeting" icon={<Target size={20}/>} label={t('Targeting Rules')} onNavigate={closeSidebarOnMobile} />
            <SidebarLink to="/environments" icon={<Globe size={20}/>} label={t('Environments')} onNavigate={closeSidebarOnMobile} />
            <SidebarLink to="/groups" icon={<Users size={20}/>} label={t('User/Groups')} onNavigate={closeSidebarOnMobile} />
            
            <div className="my-8 border-t border-slate-800/50 pt-8">
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-4">{t('Evaluation & Analytics')}</p>
               <SidebarLink to="/test" icon={<FlaskConical size={20}/>} label={t('Evaluation Tester')} onNavigate={closeSidebarOnMobile} />
               <SidebarLink to="/audit" icon={<Activity size={20}/>} label={t('Audit Logs')} onNavigate={closeSidebarOnMobile} />
            </div>
          </nav>

          {/* Logout Section */}
          <div className="border-t border-slate-800/50 bg-[#0c1222] p-4 sm:p-6">
            {isProfileOpen && (
              <div className="relative mb-4 rounded-2xl bg-slate-800 p-4 text-sm">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  aria-label={t('Close profile details')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
                <p className="text-xs font-black uppercase tracking-widest text-blue-400">{t('Profile')}</p>
                <p className="mt-3 font-bold text-white break-all">{user.email}</p>
                {user.id && <p className="mt-1 text-xs text-slate-400">{t('User ID')}: {user.id}</p>}
                <p className="mt-1 text-xs text-slate-400">{t('Role')}: {user.is_admin ? t('Administrator') : t('Regular user')}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {t('Status')}: {user.is_active === false ? t('Inactive') : t('Active')}
                </p>
                {user.created_at && (
                  <p className="mt-1 text-xs text-slate-400">
                    {t('Joined')}: {new Date(user.created_at).toLocaleDateString(locale)}
                  </p>
                )}
                {user.updated_at && (
                  <p className="mt-1 text-xs text-slate-400">
                    {t('Updated')}: {new Date(user.updated_at).toLocaleDateString(locale)}
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
                <span className="block text-xs font-black uppercase tracking-widest text-slate-500">{t('Signed in as')}</span>
                <span className="block truncate font-bold">{user.email}</span>
              </span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-[1.25rem] font-black hover:bg-red-500 hover:text-white transition-all duration-300 group shadow-sm"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> 
              {t('LOGOUT SESSION')}
            </button>
          </div>
        </aside>}

        {/* --- MAIN INTERACTIVE CONTENT AREA --- */}
        <main className={`app-main min-w-0 flex-1 px-4 pb-8 pt-20 transition-all sm:px-6 md:pt-24 md:px-8 lg:px-12 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/analytics" element={<AnalyticsOverview />} />
              <Route path="/" element={<FlagDashboard isAdmin={user.is_admin === true} />} />
              <Route path="/environments" element={<Environments isAdmin={user.is_admin === true} />} />
              <Route path="/targeting" element={<TargetingRules isAdmin={user.is_admin === true} />} />
              <Route path="/groups" element={<UserGroups isAdmin={user.is_admin === true} />} />
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