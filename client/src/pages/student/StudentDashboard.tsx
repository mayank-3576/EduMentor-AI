import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Flame, Clock, Award, Target, ArrowRight, 
  BookOpen, Binary, AlertTriangle, CheckCircle, ExternalLink, 
  TrendingUp, GraduationCap, School, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatCard } from '../../components/StatCard.js';
import { ExplanationBadge } from '../../components/ExplanationBadge.js';
import { XAIModal } from '../../components/XAIModal.js';
import { Recommendation, Subject } from '../../types/index.js';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.student.getDashboard();
      if (res.success) {
        setData(res.dashboard);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading class-wise curriculum and adaptive recommendations...</p>
      </div>
    );
  }

  const profile = data?.profile;
  const performance = data?.performance;
  const currentSemesterSubjects: Subject[] = data?.currentSemesterSubjects || [];
  const recommendations: Recommendation[] = data?.recommendations || [];
  const weakTopics = data?.weakTopics || [];
  const strongTopics = data?.strongTopics || [];
  const quickAccessTests = data?.quickAccessTests || [];
  const recentPYQs = data?.recentPYQs || [];

  // Identify if any subject has pending diagnostic tests
  const pendingDiagnostic = currentSemesterSubjects.find((s) => !s.diagnostic_completed && s.diagnostic_test_id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Academic Header Banner (Class-wise Identity) */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Academic Class Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold tracking-wide">
              <School className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {profile?.degree_code || 'B.Tech'} • {profile?.branch_name || 'CSE AIML'} • {profile?.academic_year_name || '3rd Year'} • {profile?.semester_name || 'Semester 5'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Curriculum aligned with <strong className="text-white">{profile?.university_name || 'AKTU'}</strong>. 
              Target Score: <strong className="text-indigo-400">{profile?.target_score || 75}%</strong>. 
              Showing only registered subjects for <strong className="text-indigo-300">{profile?.semester_name || 'Semester 5'}</strong>.
            </p>
          </div>

          {/* Quick Metrics Pill */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Daily Streak</p>
                <p className="text-sm font-extrabold text-white">{profile?.current_streak || 1} Days</p>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Study Time</p>
                <p className="text-sm font-extrabold text-white">
                  {Math.round((profile?.total_study_minutes || 0) / 60)} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Diagnostic Assessment CTA Banner (If pending) */}
      {pendingDiagnostic && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-200">
                Diagnostic Baseline Required: {pendingDiagnostic.name} ({pendingDiagnostic.code})
              </h3>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Take this 5-minute initial diagnostic test so EduMentor AI can evaluate your baseline strengths and calibrate personalized study recommendations.
              </p>
            </div>
          </div>
          <Link
            to={`/quizzes/${pendingDiagnostic.diagnostic_test_id}`}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <span>Take Diagnostic Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Class Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Assessment Score"
          value={`${performance?.averageScore || 0}%`}
          subtitle={`Target Benchmark: ${performance?.targetScore || 75}%`}
          icon={<Award className="w-5 h-5" />}
          accentColor="indigo"
          trend={{
            value: `${(performance?.averageScore || 0) - (performance?.targetScore || 75)}% vs Goal`,
            isPositive: (performance?.averageScore || 0) >= (performance?.targetScore || 75),
          }}
        />
        <StatCard
          title="Registered Subjects"
          value={currentSemesterSubjects.length}
          subtitle={`${profile?.semester_name || 'Semester 5'} Core Track`}
          icon={<BookOpen className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Tests Completed"
          value={performance?.totalTestsAttempted || 0}
          subtitle="Diagnostic & Unit tests"
          icon={<Target className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Concept Weaknesses"
          value={weakTopics.length}
          subtitle="Under target benchmark (<60%)"
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          accentColor="rose"
        />
      </div>

      {/* 4. CURRENT SEMESTER SUBJECTS ("MY SUBJECTS") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              My Subjects ({profile?.semester_name || 'Semester 5'})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Strict Curriculum: {profile?.branch_code} Sem {profile?.semester_number || 5}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSemesterSubjects.map((sub) => {
            const avgScore = sub.average_score || 0;
            const progress = sub.progress_percentage || 0;

            return (
              <div
                key={sub.id}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                          {sub.code}
                        </span>
                        <span className="text-[11px] text-slate-400">{sub.category}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                        {sub.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold ${avgScore >= 75 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {avgScore > 0 ? `${avgScore}% Avg` : 'No score'}
                      </span>
                      <p className="text-[10px] text-slate-500">Units I - V</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Syllabus Progress</span>
                      <span>{progress}% Completed</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Weak topics alert in this subject */}
                  {sub.weakTopics && sub.weakTopics.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span className="truncate">
                        Needs attention: <strong>{sub.weakTopics[0].name}</strong> ({sub.weakTopics[0].average_score}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <Link
                    to={`/subjects/${sub.id}`}
                    className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View Units (I to V)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {sub.diagnostic_test_id && !sub.diagnostic_completed ? (
                      <Link
                        to={`/quizzes/${sub.diagnostic_test_id}`}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors"
                      >
                        Diagnostic Test
                      </Link>
                    ) : null}

                    <Link
                      to={`/subjects/${sub.id}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1"
                    >
                      <span>Study Subject</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Adaptive Explainable AI Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Adaptive Explainable AI Recommendations</h2>
          </div>
          <Link
            to="/recommendations"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            All Recommendations ({recommendations.length}) →
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400">
            <p className="text-xs">No active recommendations. Take a unit test to allow the Explainable AI engine to analyze your conceptual mastery!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 2).map((rec: Recommendation) => (
              <div
                key={rec.id}
                className="p-5 rounded-3xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/50 shadow-xl shadow-indigo-950/20 flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                        {rec.topic_name}
                      </span>
                      <span className="text-[11px] text-slate-400">in {rec.subject_name}</span>
                    </div>
                    <ExplanationBadge
                      level={rec.current_score < 40 ? 'very_weak' : rec.current_score < 60 ? 'needs_improvement' : 'good'}
                      score={rec.current_score}
                      delta={rec.score_delta}
                    />
                  </div>

                  <h3 className="text-sm font-bold text-white">{rec.reason_title}</h3>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <p className="line-clamp-3 leading-relaxed">
                      {rec.explanation_markdown.replace(/### |#|\*\*|`/g, '')}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Score: <strong className="text-rose-400">{rec.current_score}%</strong></span>
                      <span>Target: <strong className="text-slate-200">{rec.target_score}%</strong></span>
                      <span>Gap: <strong className="text-rose-400">{rec.score_delta}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedRec(rec)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    Why this was recommended? →
                  </button>
                  <Link
                    to={`/topics/${rec.topic_id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1"
                  >
                    Study Unit Notes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Quick Access Multi-Tier Tests & PYQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Tests */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Semester 5 Assessments</h3>
            </div>
            <span className="text-xs text-slate-400">Unit & Mock Tests</span>
          </div>

          <div className="space-y-2.5">
            {quickAccessTests.slice(0, 4).map((test: any) => (
              <div
                key={test.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 uppercase">
                      {test.test_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">{test.subject_name}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">{test.title}</h4>
                </div>

                <Link
                  to={`/quizzes/${test.id}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  Start Test
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Previous Year Questions Shortcut */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">University PYQ Explorer</h3>
              </div>
              <Link to="/pyq" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Explore All PYQs →
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentPYQs.map((pyq: any) => (
                <div
                  key={pyq.id}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-300">{pyq.university} • {pyq.year}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">{pyq.marks} Marks</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    {pyq.question_text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/pyq"
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors text-center block mt-2"
          >
            Practice University Exam Questions
          </Link>
        </div>
      </div>

      {/* 7. Weak Topics Alert Box */}
      {weakTopics.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-rose-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Weak Topics Requiring Practice</h3>
            </div>
            <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {weakTopics.length} Identified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {weakTopics.map((wt: any) => (
              <div
                key={wt.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{wt.topic_name}</h4>
                  <p className="text-[10px] text-slate-400">{wt.subject_name} • Unit {wt.unit_number || 'IV'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ExplanationBadge level={wt.mastery_level} score={wt.average_score} />
                  <Link
                    to={`/topics/${wt.topic_id}`}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                  >
                    Revise
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XAI Explanation Modal */}
      <XAIModal
        isOpen={Boolean(selectedRec)}
        recommendation={selectedRec}
        onClose={() => setSelectedRec(null)}
      />
    </div>
  );
};
