import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, School, Layers, Calendar, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotification } from '../../context/NotificationContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');

  // Academic Curriculum selections
  const [universities, setUniversities] = useState<any[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const [selectedUniversityId, setSelectedUniversityId] = useState<number | ''>('');
  const [selectedDegreeId, setSelectedDegreeId] = useState<number | ''>('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [selectedYearId, setSelectedYearId] = useState<number | ''>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | ''>('');
  const [targetScore, setTargetScore] = useState(75);
  const [targetGoal, setTargetGoal] = useState('B.Tech Semester 5 Placement & Core Mastery');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    // Load academic curriculum hierarchy options
    api.curriculum.getStructure()
      .then((data) => {
        if (data.success && data.structure) {
          const s = data.structure;
          setUniversities(s.universities || []);
          setDegrees(s.degrees || []);
          setBranches(s.branches || []);
          setYears(s.years || []);
          setSemesters(s.semesters || []);

          // Set sensible defaults (AKTU, B.Tech, CSE AIML, 3rd Year, Sem 5)
          if (s.universities?.length > 0) setSelectedUniversityId(s.universities[0].id);
          if (s.degrees?.length > 0) setSelectedDegreeId(s.degrees[0].id);
          const cseAiml = s.branches?.find((b: any) => b.code === 'CSE_AIML') || s.branches?.[0];
          if (cseAiml) setSelectedBranchId(cseAiml.id);
          const thirdYear = s.years?.find((y: any) => y.year_number === 3) || s.years?.[0];
          if (thirdYear) setSelectedYearId(thirdYear.id);
          const sem5 = s.semesters?.find((sem: any) => sem.semester_number === 5) || s.semesters?.[0];
          if (sem5) setSelectedSemesterId(sem5.id);
        }
      })
      .catch((err) => console.error('Failed to load academic taxonomy:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        universityId: role === 'student' ? Number(selectedUniversityId) || undefined : undefined,
        degreeId: role === 'student' ? Number(selectedDegreeId) || undefined : undefined,
        branchId: role === 'student' ? Number(selectedBranchId) || undefined : undefined,
        academicYearId: role === 'student' ? Number(selectedYearId) || undefined : undefined,
        semesterId: role === 'student' ? Number(selectedSemesterId) || undefined : undefined,
        targetScore: role === 'student' ? targetScore : undefined,
        targetGoal: role === 'student' ? targetGoal : undefined,
        department: role === 'teacher' ? department : undefined,
      });

      notify('success', 'Account created!', `Welcome to EduMentor AI as ${role}.`);
      if (role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <GraduationCap className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          Create EduMentor AI Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Personalized, curriculum-based learning powered by Explainable AI
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registering as:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === 'student'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Undergraduate Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === 'teacher'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Faculty / Teacher</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@institution.edu"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>

            {role === 'student' ? (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <School className="w-4 h-4" />
                  <span>Academic Curriculum Placement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">University</label>
                    <select
                      value={selectedUniversityId}
                      onChange={(e) => setSelectedUniversityId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs focus:outline-none"
                    >
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} - {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Degree</label>
                    <select
                      value={selectedDegreeId}
                      onChange={(e) => setSelectedDegreeId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs focus:outline-none"
                    >
                      {degrees.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs focus:outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                    <select
                      value={selectedYearId}
                      onChange={(e) => setSelectedYearId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs focus:outline-none"
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current Semester</label>
                    <select
                      value={selectedSemesterId}
                      onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs focus:outline-none"
                    >
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Target Mastery Goal Score:</span>
                    </label>
                    <span className="text-xs font-bold text-indigo-400">{targetScore}%</span>
                  </div>
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
                    Explainable AI recommendations will trigger whenever test scores fall below this target.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department / Specialization</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Academic Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
