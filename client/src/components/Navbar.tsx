import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Search, Bell, LogOut, User as UserIcon, 
  Sparkles, Shield, BookOpen, Layers, Menu, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleSidebar }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleRoleChange = async (newRole: UserRole) => {
    setRoleDropdownOpen(false);
    await quickDemoLogin(newRole);
    if (newRole === 'student') navigate('/dashboard');
    else if (newRole === 'teacher') navigate('/teacher/dashboard');
    else if (newRole === 'admin') navigate('/admin/dashboard');
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
    }
    if (role === 'teacher') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Teacher</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Student</span>;
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">EDUMENTOR</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold tracking-wider">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Explainable Adaptive Learning</p>
          </div>
        </Link>
      </div>

      {/* Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenSearch}
          className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-400 text-xs flex items-center justify-between transition-all group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Search subjects, topics, DSA, quizzes...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Role Switcher & User Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <Search className="w-5 h-5" />
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                title="Switch demo persona"
              >
                {getRoleBadge(user.role)}
                <span className="text-[11px] text-slate-400 hidden lg:inline">Switch</span>
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => handleRoleChange('student')}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 ${
                      user.role === 'student' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>Student Persona</span>
                    {user.role === 'student' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                  </button>
                  <button
                    onClick={() => handleRoleChange('teacher')}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 ${
                      user.role === 'teacher' ? 'text-amber-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>Teacher Persona</span>
                    {user.role === 'teacher' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  </button>
                  <button
                    onClick={() => handleRoleChange('admin')}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 ${
                      user.role === 'admin' ? 'text-rose-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>Admin Persona</span>
                    {user.role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                to={user.role === 'student' ? '/profile' : '#'}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
                />
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
