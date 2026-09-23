import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Mail, Target, Flame, Clock, 
  Award, Shield, CheckCircle2, Save, School, GraduationCap,
  Layers, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const [targetScore, setTargetScore] = useState<number>(75);
  const [targetGoal, setTargetGoal] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  // Academic hierarchy state
  const [universities, setUniversities] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const [selectedUniversityId, setSelectedUniversityId] = useState<number>(1);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [selectedYearId, setSelectedYearId] = useState<number>(3);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number>(5);

  const [saving, setSaving] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    const fetchAcademicStructure = async () => {
      try {
        const res = await api.curriculum.getStructure();
        if (res.success && res.structure) {
          setUniversities(res.structure.universities || []);
          setBranches(res.structure.branches || []);
          setYears(res.structure.years || []);
          setSemesters(res.structure.semesters || []);
        }
      } catch (err) {
        console.error('Failed to load academic taxonomy:', err);
      }
    };
    fetchAcademicStructure();
  }, []);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setTargetScore(p.target_score || 75);
      setTargetGoal(p.target_goal || '');
      setBio(p.bio || '');
      if (p.university_id) setSelectedUniversityId(p.university_id);
      if (p.branch_id) setSelectedBranchId(p.branch_id);
      if (p.academic_year_id) setSelectedYearId(p.academic_year_id);
      if (p.semester_id) setSelectedSemesterId(p.semester_id);
    }
  }, [profile]);

  // Filter semesters according to selected academic year
  const filteredSemesters = semesters.filter(
    (s) => !selectedYearId || s.academic_year_id === Number(selectedYearId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.updateProfile({
        targetScore,
        targetGoal,
        bio,
        universityId: Number(selectedUniversityId),
        branchId: Number(selectedBranchId),
        academicYearId: Number(selectedYearId),
        semesterId: Number(selectedSemesterId),
      });
      await refreshUser();
      notify('success', 'Profile & Academic Track Saved', 'Your curriculum mapping and diagnostic benchmarks have been updated.');
    } catch (err: any) {
      notify('error', 'Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const p = profile as any;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>B.Tech Undergraduate Academic Portfolio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Profile & Academic Track
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Calibrate your degree track, enrolled semester, and diagnostic score benchmark. Changes immediately adjust your active curriculum subjects and Explainable AI recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 flex flex-col items-center text-center">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-24 h-24 rounded-full bg-slate-800 border-2 border-indigo-500 shadow-lg"
            />

            <div>
              <h3 className="text-lg font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {user?.role}
                </span>
                {p?.university_code && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {p.university_code}
                  </span>
                )}
              </div>
            </div>

            {/* Academic Track Summary */}
            <div className="w-full pt-4 border-t border-slate-800 text-left space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Enrolled Track
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <School className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{p?.university_name || 'AKTU Technical University'}</span>
                </div>
                <div className="text-[11px] text-slate-400 pl-5">
                  <strong className="text-white">{p?.degree_code || 'B.Tech'}</strong> • {p?.branch_name || 'Computer Science & Engineering'}
                </div>
                <div className="text-[11px] text-indigo-400 font-bold pl-5">
                  {p?.academic_year_name || '3rd Year'} — {p?.semester_name || 'Semester 5'}
                </div>
              </div>
            </div>

            {/* Telemetry Stats */}
            <div className="w-full pt-2 grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Streak
                </p>
                <p className="text-base font-bold text-white mt-1">{p?.current_streak || 1} Days</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Study Time
                </p>
                <p className="text-base font-bold text-white mt-1">
                  {Math.round((p?.total_study_minutes || 0) / 60)} hrs
                </p>
              </div>
            </div>
          </div>

          {/* Explainable AI Benchmark Legend */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>XAI Mastery Classification</span>
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span>&lt; 40%</span>
                <span className="font-bold uppercase text-[9px]">Very Weak (Foundational)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span>40% – 59%</span>
                <span className="font-bold uppercase text-[9px]">Needs Improvement</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <span>60% – 79%</span>
                <span className="font-bold uppercase text-[9px]">Good Mastery</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span>≥ 80%</span>
                <span className="font-bold uppercase text-[9px]">Strong / Exam Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Goals & Academic Track Form */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <School className="w-4 h-4 text-indigo-400" />
                <span>Academic Track & Semester Placement</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select your engineering university, branch, and active semester. The platform strictly serves subjects mapped to this selection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* University */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  University / Board
                </label>
                <select
                  value={selectedUniversityId}
                  onChange={(e) => setSelectedUniversityId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Branch / Specialization
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Year
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => {
                    const newYearId = Number(e.target.value);
                    setSelectedYearId(newYearId);
                    // Automatically adjust semester to first semester of selected year
                    const semsForYear = semesters.filter(s => s.academic_year_id === newYearId);
                    if (semsForYear.length > 0) {
                      setSelectedSemesterId(semsForYear[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} (Year {y.year_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Active Semester
                </label>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {filteredSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Semester {s.semester_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-b border-slate-800 pb-4 pt-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Diagnostic Targets & Learning Parameters</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize your benchmark criteria to guide Explainable AI triggers and adaptive re-testing recommendations.
              </p>
            </div>

            {/* Target Score Slider */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-400" /> Target Diagnostic Benchmark
                </span>
                <span className="font-mono text-base font-black text-indigo-400">
                  {targetScore}%
                </span>
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Any topic quiz or unit test result falling below {targetScore}% will trigger an Explainable AI diagnostic warning and adaptive re-test.
              </p>
            </div>

            {/* Target Goal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Target Goal</label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="e.g. B.Tech Semester 5 Distinction & Tier-1 Software Engineering Placement"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Academic Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Bio / Focus Areas</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your current semester focus, target roles, or dream companies..."
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Academic Profile...' : 'Save Academic Track & Targets'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
