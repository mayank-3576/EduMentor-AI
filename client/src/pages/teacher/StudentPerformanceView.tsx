import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Award, Flame, Clock, 
  Target, GraduationCap, ChevronRight 
} from 'lucide-react';
import { api } from '../../services/api.js';

export const StudentPerformanceView: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await api.teacher.getStudentPerformance();
        if (res.success) setStudents(res.students);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Cohort Telemetry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Performance Roster
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Inspect individual diagnostic trajectory, study engagement streaks, and average accuracy scores.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Gathering student records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="font-semibold text-slate-300">No students matched.</p>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider pb-3">
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Target Goal</th>
                <th className="pb-3 text-center">Benchmark Goal</th>
                <th className="pb-3 text-center">Daily Streak</th>
                <th className="pb-3 text-center">Study Time</th>
                <th className="pb-3 text-center">Quizzes Taken</th>
                <th className="pb-3 text-right">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-4">
                    <p className="font-bold text-white text-sm">{s.name}</p>
                    <p className="text-slate-400 text-[11px]">{s.email}</p>
                  </td>
                  <td className="py-4 text-slate-300 font-medium">
                    {s.target_goal || 'B.Tech Core Mastery'}
                  </td>
                  <td className="py-4 text-center font-mono font-bold text-indigo-400">
                    {s.target_score}%
                  </td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                      <Flame className="w-3.5 h-3.5" /> {s.current_streak || 1}d
                    </span>
                  </td>
                  <td className="py-4 text-center text-slate-300 font-mono">
                    {Math.round((s.total_study_minutes || 0) / 60)} hrs
                  </td>
                  <td className="py-4 text-center font-bold text-white">
                    {s.total_quizzes_taken}
                  </td>
                  <td className="py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                      s.average_score >= 70
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : s.average_score >= 50
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {s.average_score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
