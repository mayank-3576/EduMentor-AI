import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, HelpCircle, Binary, Clock, 
  CheckCircle, ArrowRight, ExternalLink, Sparkles, CheckCircle2,
  FileText, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ExplanationBadge } from '../../components/ExplanationBadge.js';
import { XAIModal } from '../../components/XAIModal.js';
import { Topic, LearningMaterial, PYQRecord } from '../../types/index.js';

export const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { notify } = useNotification();
  const [data, setData] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isXAIModalOpen, setIsXAIModalOpen] = useState(false);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});

  const fetchTopic = async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await api.topics.getById(id);
        if (res.success) {
          setData(res.topic);
          setIsCompleted(Boolean(res.topic.isCompleted));
        }
      }
    } catch (err) {
      console.error('Error fetching topic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const handleMarkCompleted = async () => {
    if (!data) return;
    setCompleting(true);
    try {
      const res = await api.topics.markCompleted(data.id);
      if (res.success) {
        setIsCompleted(true);
        notify('success', 'Topic Completed!', `Topic recorded as completed. Subject progress updated to ${res.progress.subjectProgressPercentage}%.`);
      }
    } catch (err: any) {
      notify('error', 'Update Failed', err.message);
    } finally {
      setCompleting(false);
    }
  };

  const toggleSolution = (pyqId: number) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [pyqId]: !prev[pyqId],
    }));
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading comprehensive academic notes and PYQs...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Topic not found.</p>
        <Link to="/dashboard" className="text-xs text-indigo-400 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const mat: LearningMaterial | undefined = data.learningMaterial;
  const pyqs: PYQRecord[] = data.pyqs || [];
  const assessments = data.assessments || [];
  const topicQuiz = assessments.find((a) => a.test_type === 'topic_quiz') || assessments[0];
  const unitTest = assessments.find((a) => a.test_type === 'unit_test');
  const perf = data.userPerformance;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Back Link & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link
          to={data.subject_id ? `/subjects/${data.subject_id}` : '/dashboard'}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {data.subject_name || 'Subject Units'}
        </Link>

        <span className="text-slate-500">
          {data.subject_name} &gt; {data.unit_title || 'Unit IV'} &gt; <strong className="text-slate-300">{data.name}</strong>
        </span>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {data.unit_title || 'Academic Unit'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
              data.difficulty_level === 'Beginner' ? 'bg-emerald-500/15 text-emerald-300' :
              data.difficulty_level === 'Intermediate' ? 'bg-amber-500/15 text-amber-300' :
              'bg-rose-500/15 text-rose-300'
            }`}>
              {data.difficulty_level} Difficulty
            </span>
          </div>

          {perf && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Mastery:</span>
              <ExplanationBadge
                level={perf.mastery_level}
                score={perf.average_score}
                onClick={() => setIsXAIModalOpen(true)}
              />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {data.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed mt-2">
            {data.description}
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {topicQuiz && (
              <Link
                to={`/quizzes/${topicQuiz.id}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Take Topic Quiz</span>
              </Link>
            )}

            {unitTest && (
              <Link
                to={`/quizzes/${unitTest.id}`}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Take Unit Test</span>
              </Link>
            )}
          </div>

          <button
            onClick={handleMarkCompleted}
            disabled={completing || isCompleted}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isCompleted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Completed ✓' : completing ? 'Saving...' : 'Mark as Completed'}</span>
          </button>
        </div>
      </div>

      {/* 1. Learning Objectives */}
      {mat?.learning_objectives && (
        <div className="p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Learning Objectives</span>
          </div>
          <div className="text-xs text-slate-300 space-y-1.5 whitespace-pre-line leading-relaxed">
            {mat.learning_objectives}
          </div>
        </div>
      )}

      {/* 2. Detailed Concept & Theory */}
      {mat?.concept_explanation && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Core Theoretical Concepts & Formulations</span>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
            <div className="whitespace-pre-wrap font-sans">
              {mat.concept_explanation}
            </div>
          </div>
        </div>
      )}

      {/* 3. Important Definitions */}
      {mat?.important_definitions && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Key University Exam Definitions</span>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed space-y-3">
            {mat.important_definitions}
          </div>
        </div>
      )}

      {/* 4. Solved Examples & Decomposition Problems */}
      {mat?.examples && mat.examples.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <Binary className="w-5 h-5 text-cyan-400" />
            <span>Step-by-Step Solved Problem Examples</span>
          </div>

          <div className="space-y-4">
            {mat.examples.map((ex, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
              >
                <h4 className="text-xs sm:text-sm font-bold text-cyan-300">{ex.title}</h4>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] sm:text-xs text-slate-200 whitespace-pre-wrap overflow-x-auto">
                  {ex.code_or_text}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Explanation: </strong>
                  {ex.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Diagrams / Schema Architecture */}
      {mat?.diagrams_markdown && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Structural Schema Architecture & Diagrams
          </h3>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {mat.diagrams_markdown}
          </div>
        </div>
      )}

      {/* 6. High-Frequency Exam Points & Common Mistakes (Side-by-side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mat?.exam_points && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/20 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>High-Frequency Exam Tips (Scoring Guide)</span>
            </div>
            <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {mat.exam_points}
            </div>
          </div>
        )}

        {mat?.common_mistakes && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-rose-500/20 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Common Student Mistakes to Avoid</span>
            </div>
            <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {mat.common_mistakes}
            </div>
          </div>
        )}
      </div>

      {/* 7. Previous Year Questions (PYQs) for this topic */}
      {pyqs.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>University Previous Year Questions (PYQs)</span>
            </div>
            <span className="text-xs text-slate-400">{pyqs.length} Solved Questions</span>
          </div>

          <div className="space-y-4">
            {pyqs.map((q) => {
              const isRevealed = revealedSolutions[q.id];

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                        {q.university} • {q.year} ({q.exam_season})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                        {q.marks} Marks
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                    {q.question_text}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => toggleSolution(q.id)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Hide Step-by-Step Solution' : 'Reveal Step-by-Step Solution'}</span>
                    </button>

                    {isRevealed && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-emerald-500/20 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-200">
                        {q.solution_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Topic Summary */}
      {mat?.summary && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2 text-center text-xs text-slate-400">
          <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Topic Summary & Revision</p>
          <p className="max-w-2xl mx-auto leading-relaxed">{mat.summary}</p>
        </div>
      )}

      {/* XAI Attribution Modal */}
      {perf && (
        <XAIModal
          isOpen={isXAIModalOpen}
          recommendation={{
            id: 0,
            user_id: perf.user_id,
            topic_id: perf.topic_id,
            reason_title: `Diagnostic Performance: ${data.name}`,
            explanation_markdown: `### Explainable AI Evaluation\n\n- **Topic:** ${data.name}\n- **Average Score:** ${perf.average_score}%\n- **Classification:** **${perf.mastery_level.toUpperCase()}**\n\nReview the theory and solve the university PYQs before attempting the re-test!`,
            current_score: perf.average_score,
            target_score: 75,
            score_delta: 0,
            priority: 'medium',
            status: 'active',
            created_at: perf.last_updated_at,
            topic_name: data.name,
            subject_name: data.subject_name,
          }}
          onClose={() => setIsXAIModalOpen(false)}
        />
      )}
    </div>
  );
};
