import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Layers, HelpCircle, BookOpen, Clock, 
  ArrowRight, ExternalLink, Sparkles, CheckCircle2, Circle,
  FileText, ShieldAlert, Award, ChevronDown, ChevronUp, Target
} from 'lucide-react';
import { api } from '../../services/api.js';
import { ExplanationBadge } from '../../components/ExplanationBadge.js';
import { Subject, Unit, Topic, Assessment } from '../../types/index.js';

export const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'units' | 'assessments' | 'pyq' | 'resources'>('units');
  const [expandedUnit, setExpandedUnit] = useState<number | null>(4); // Expand Unit IV by default

  useEffect(() => {
    const fetchSubject = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await api.subjects.getById(id);
          if (res.success) setData(res.subject);
        }
      } catch (err) {
        console.error('Error fetching subject:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading academic syllabus, Units I-V, and assessments...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Subject not found.</p>
        <Link to="/dashboard" className="text-xs text-indigo-400 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const units: Unit[] = data.units || [];
  const assessments: Assessment[] = data.assessments || [];
  const performance = data.performance;
  const pyqSummary = (data as any).pyqSummary || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Hero Subject Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {data.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Code: {data.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                5 Academic Units
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {data.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Subject Mastery</p>
              <p className="text-xl font-extrabold text-white">
                {performance?.average_score ? `${performance.average_score}%` : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">Syllabus Progress: {performance?.progress_percentage || 0}%</p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          {assessments.find((a) => a.test_type === 'subject_test') && (
            <Link
              to={`/quizzes/${assessments.find((a) => a.test_type === 'subject_test')?.id}`}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" />
              <span>Take Full Subject Mock Test</span>
            </Link>
          )}

          <Link
            to={`/pyq?subjectId=${data.id}`}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Practice University PYQs</span>
          </Link>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="border-b border-slate-800 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('units')}
          className={`pb-3 px-2 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'units'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Units I to V ({units.length})
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`pb-3 px-2 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'assessments'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Assessments & Tests ({assessments.length})
        </button>
        <button
          onClick={() => setActiveTab('pyq')}
          className={`pb-3 px-2 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'pyq'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Previous Year Questions
        </button>
      </div>

      {/* Tab 1: Units I through V */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {units.map((unit) => {
            const isExpanded = expandedUnit === unit.unit_number;
            const unitTest = assessments.find((a) => a.unit_id === unit.id && a.test_type === 'unit_test');
            const unitPerf = unit.performance;

            return (
              <div
                key={unit.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden shadow-md"
              >
                {/* Unit Header */}
                <div
                  onClick={() => setExpandedUnit(isExpanded ? null : unit.unit_number)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
                        UNIT {unit.unit_number === 1 ? 'I' : unit.unit_number === 2 ? 'II' : unit.unit_number === 3 ? 'III' : unit.unit_number === 4 ? 'IV' : 'V'}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {unit.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                      {unit.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {unitPerf && unitPerf.tests_attempted > 0 ? (
                      <ExplanationBadge
                        level={unitPerf.mastery_level}
                        score={unitPerf.average_score}
                      />
                    ) : (
                      <span className="text-[11px] text-slate-500">Not Tested</span>
                    )}

                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Unit Body (Topics & Unit Test) */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-800/60 space-y-4">
                    {/* Topics List */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Syllabus Topics & Detailed Notes:
                      </h4>

                      {unit.topics && unit.topics.length > 0 ? (
                        unit.topics.map((t) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  t.difficulty_level === 'Beginner' ? 'bg-emerald-500/15 text-emerald-300' :
                                  t.difficulty_level === 'Intermediate' ? 'bg-amber-500/15 text-amber-300' :
                                  'bg-rose-500/15 text-rose-300'
                                }`}>
                                  {t.difficulty_level}
                                </span>
                                <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {t.name}
                                </h5>
                                {t.user_status === 'completed' && (
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {t.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                to={`/topics/${t.id}`}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <span>Study Notes</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">
                          Standard core curriculum topics enrolled for this unit.
                        </p>
                      )}
                    </div>

                    {/* Unit Test CTA */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          UNIT {unit.unit_number} EVALUATION
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Comprehensive Unit Test ({unit.title.split(':')[1] || unit.title})
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Evaluates all concepts of Unit {unit.unit_number} to calibrate Explainable AI recommendations.
                        </p>
                      </div>

                      {unitTest ? (
                        <Link
                          to={`/quizzes/${unitTest.id}`}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5"
                        >
                          <span>Take Unit {unit.unit_number} Test</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Test scheduled</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Assessments List */}
      {activeTab === 'assessments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((test) => (
            <div
              key={test.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    test.test_type === 'diagnostic_test' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    test.test_type === 'unit_test' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {test.test_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {test.time_limit_minutes} mins
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{test.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{test.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Passing Benchmark: <strong className="text-white">{test.passing_score}%</strong>
                </span>
                <Link
                  to={`/quizzes/${test.id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  Start Assessment →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: PYQ Practice Shortcut */}
      {activeTab === 'pyq' && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">University Previous Year Questions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore past exam problems for {data.name} from AKTU and Autonomous colleges with detailed step-by-step academic solutions.
            </p>
          </div>
          <Link
            to={`/pyq?subjectId=${data.id}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            Launch PYQ Explorer for {data.code}
          </Link>
        </div>
      )}
    </div>
  );
};
