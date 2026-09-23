import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, BookOpen, Layers, HelpCircle, 
  Binary, FileText, CheckCircle2, ArrowRight, Settings 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/StatCard.js';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        const res = await api.admin.getAnalytics();
        if (res.success) setData(res);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Gathering system-wide operational metrics...</p>
      </div>
    );
  }

  const stats = data?.stats;
  const categories = data?.categories || [];
  const recentAttempts = data?.recentAttempts || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            System Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete platform management: dynamic curriculum CRUD, user roles, quiz evaluation banks, and adaptive AI telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/curriculum"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Manage Curriculum →
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors shadow-sm"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.totalStudents || 0} Students • ${stats?.totalTeachers || 0} Faculty`}
          icon={<Users className="w-5 h-5" />}
          accentColor="rose"
        />
        <StatCard
          title="Active Subjects"
          value={stats?.totalSubjects || 0}
          subtitle={`${stats?.totalTopics || 0} Topics • ${stats?.totalLessons || 0} Lessons`}
          icon={<BookOpen className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Question Bank"
          value={stats?.totalQuestions || 0}
          subtitle={`Across ${stats?.totalQuizzes || 0} Active Quizzes`}
          icon={<HelpCircle className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Quiz Evaluations"
          value={stats?.totalAttempts || 0}
          subtitle={`${stats?.totalRecommendations || 0} XAI Recommendations`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Category breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> B.Tech Categories Configured
          </h3>

          <div className="space-y-3">
            {categories.map((c: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-white">{c.category}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {c.subject_count} Subjects
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Activity */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recent Quiz Executions
          </h3>

          <div className="space-y-2.5">
            {recentAttempts.map((ra: any) => (
              <div
                key={ra.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{ra.user_name}</p>
                  <p className="text-[10px] text-slate-400">{ra.quiz_title}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${ra.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ra.percentage}%
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {new Date(ra.attempted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
