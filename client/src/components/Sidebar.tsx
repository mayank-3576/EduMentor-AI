import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Sparkles, Binary, Code2, 
  Map, BarChart2, UserCheck, FileQuestion, FolderKanban, 
  Library, Users, FileText, School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const studentLinks: SidebarLink[] = [
    { to: '/dashboard', label: 'My Curriculum', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/subjects', label: 'Semester Subjects', icon: <BookOpen className="w-4 h-4" /> },
    { to: '/pyq', label: 'University PYQs', icon: <FileText className="w-4 h-4 text-emerald-400" />, badge: 'AKTU' },
    { to: '/recommendations', label: 'Explainable AI', icon: <Sparkles className="w-4 h-4 text-indigo-400" />, badge: 'XAI' },
    { to: '/dsa', label: 'DSA Roadmap', icon: <Binary className="w-4 h-4" /> },
    { to: '/coding', label: 'Coding Arena', icon: <Code2 className="w-4 h-4" /> },
    { to: '/learning-paths', label: 'Learning Paths', icon: <Map className="w-4 h-4" /> },
    { to: '/analytics', label: 'Performance Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { to: '/profile', label: 'Academic Profile', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const teacherLinks: SidebarLink[] = [
    { to: '/teacher/dashboard', label: 'Teacher Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/teacher/questions', label: 'Question Bank & PYQ', icon: <FileQuestion className="w-4 h-4" /> },
    { to: '/teacher/quizzes', label: 'Test & Quiz Builder', icon: <FolderKanban className="w-4 h-4" /> },
    { to: '/teacher/resources', label: 'Manage Resources', icon: <Library className="w-4 h-4" /> },
    { to: '/teacher/students', label: 'Student Performance', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  const adminLinks: SidebarLink[] = [
    { to: '/admin/dashboard', label: 'Admin Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/admin/users', label: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/curriculum', label: 'Curriculum Hierarchy', icon: <School className="w-4 h-4 text-cyan-400" />, badge: 'CMS' },
    { to: '/admin/quizzes', label: 'Tests & Question Bank', icon: <FileQuestion className="w-4 h-4" /> },
    { to: '/admin/resources', label: 'Resource Repository', icon: <Library className="w-4 h-4" /> },
    { to: '/admin/problems', label: 'DSA & Coding Problems', icon: <Code2 className="w-4 h-4" /> },
    { to: '/admin/analytics', label: 'Platform Analytics', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  const currentLinks = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation links */}
        <div className="p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {role === 'admin' ? 'Administration' : role === 'teacher' ? 'Faculty Portal' : 'Curriculum Track'}
            </p>
            <nav className="space-y-1">
              {currentLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Quick Info Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Strict semester-based curriculum. Transparent mathematical Explainable AI recommendations.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>EduMentor AI v2.0</span>
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </aside>
    </>
  );
};
