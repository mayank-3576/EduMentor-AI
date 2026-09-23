import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, HelpCircle, FolderKanban, Award, 
  AlertTriangle, TrendingUp, ArrowRight, PlusCircle, BookOpen 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/StatCard.js';

export const TeacherDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.teacher.getDashboard();
        if (res.success) setData(res);
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading faculty oversight telemetry...</p>
      </div>
    );
  }

  const stats = data?.stats;
  const hardestTopics = data?.hardestTopics || [];
  const recentAttempts = data?.recentAttempts || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Faculty Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Teacher Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor class performance distributions, compose diagnostic question banks, and publish curated educational resources.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/teacher/questions"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Add Question
          </Link>
          <Link
            to="/teacher/quizzes"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FolderKanban className="w-4 h-4" /> Create Quiz
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          subtitle="Enrolled learners"
          icon={<Users className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Class Average Score"
          value={`${stats?.averageClassScore || 0}%`}
          subtitle="Across all quizzes"
          icon={<Award className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Diagnostic Quizzes"
          value={stats?.totalQuizzes || 0}
          subtitle={`${stats?.totalQuestions || 0} Questions in bank`}
          icon={<HelpCircle className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalAttempts || 0}
          subtitle="Completed assessments"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Hardest Topics vs Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardest Topics (Lowest Class Average) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Hardest Topics (Lowest Average)
            </h3>
            <span className="text-[11px] text-slate-500">Auto-detected by AI</span>
          </div>

          {hardestTopics.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No topic telemetry gathered yet.</p>
          ) : (
            <div className="space-y-3">
              {hardestTopics.map((ht: any) => (
                <div
                  key={ht.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{ht.name}</h4>
                    <p className="text-[10px] text-slate-400">{ht.subject_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-rose-400">{Math.round(ht.class_average)}%</span>
                      <p className="text-[10px] text-slate-500">{ht.student_count} Students</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Student Quiz Attempts */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Recent Student Submissions
            </h3>
            <Link to="/teacher/students" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              View All →
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No student attempts recorded.</p>
          ) : (
            <div className="space-y-2.5">
              {recentAttempts.slice(0, 5).map((att: any) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{att.student_name}</p>
                    <p className="text-[10px] text-slate-400">{att.quiz_title}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {att.percentage}%
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {new Date(att.attempted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
