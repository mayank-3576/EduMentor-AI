import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  Award, CheckCircle2, XCircle, Clock, Sparkles, 
  ArrowRight, BookOpen, AlertTriangle, ExternalLink, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { ExplanationBadge } from '../../components/ExplanationBadge.js';
import { XAIModal } from '../../components/XAIModal.js';
import { Recommendation } from '../../types/index.js';

export const QuizResult: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const passedResult = (location.state as any)?.result;

  const [attempt, setAttempt] = useState<any>(passedResult || null);
  const [loading, setLoading] = useState(!passedResult);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (!passedResult && attemptId) {
      const fetchAttempt = async () => {
        setLoading(true);
        try {
          const res = await api.quizzes.getAttempt(attemptId);
          if (res.success) setAttempt(res.attempt);
        } catch (err) {
          console.error('Failed to load attempt:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAttempt();
    }
  }, [attemptId, passedResult]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Generating Explainable AI diagnostic report...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Quiz attempt result not found.</p>
        <Link to="/dashboard" className="text-xs text-indigo-400 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const percentage = attempt.percentage;
  const isPassed = Boolean(attempt.passed);
  const answers = attempt.answersReview || attempt.answers || [];
  const recommendations = attempt.recommendationsGenerated || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* 1. Score Summary Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {isPassed ? 'Diagnostic Passed' : 'Below Target Score'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {attempt.quizTitle || attempt.quiz_title || 'Diagnostic Assessment'}
            </h1>
            <p className="text-xs text-slate-400">
              Completed on {new Date().toLocaleDateString()} • Recorded in continuous performance database
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{percentage}%</span>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Score: {attempt.score} / {attempt.maxScore || attempt.max_score}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Explainable AI Recommendations Triggered By This Quiz */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              Generated Explainable AI Recommendations
            </h2>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec: Recommendation) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 shadow-lg space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                      {rec.topic_name}
                    </span>
                    <span className="text-xs text-slate-400">in {rec.subject_name}</span>
                  </div>
                  <ExplanationBadge
                    level={rec.current_score < 40 ? 'very_weak' : rec.current_score < 60 ? 'needs_improvement' : 'good'}
                    score={rec.current_score}
                    delta={rec.score_delta}
                  />
                </div>

                <h3 className="text-sm font-bold text-white">{rec.reason_title}</h3>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                  {rec.explanation_markdown.replace(/### |#|\*\*|`/g, '')}
                </p>

                {rec.resource_title && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{rec.resource_title}</p>
                      <p className="text-[10px] text-slate-400">Recommended Next Material</p>
                    </div>
                    {rec.resource_url && (
                      <a
                        href={rec.resource_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 shrink-0"
                      >
                        Study Resource <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSelectedRec(rec)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View Mathematical Attribution Breakdown →
                  </button>
                  <Link
                    to={`/topics/${rec.topic_id}`}
                    className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    Go to Topic Syllabus <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detailed Question-by-Question Review */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Question Review & Explanations</h2>

        <div className="space-y-4">
          {answers.map((ans: any, idx: number) => {
            const isCorrect = Boolean(ans.isCorrect ?? ans.is_correct);

            return (
              <div
                key={ans.questionId || ans.question_id || idx}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">Q0{idx + 1}.</span>
                    <h3 className="text-sm font-semibold text-white">
                      {ans.questionText || ans.question_text}
                    </h3>
                  </div>
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                {/* Options List with Highlights */}
                <div className="space-y-2 pt-1 text-xs">
                  {ans.options?.map((opt: any) => {
                    const isSelected = (ans.selectedOptionId ?? ans.selected_option_id) === opt.id;
                    const isOptionCorrect = Boolean(opt.isCorrect ?? opt.is_correct);

                    let optionStyle = 'bg-slate-950/50 border-slate-800 text-slate-300';
                    if (isOptionCorrect) {
                      optionStyle = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 font-semibold';
                    } else if (isSelected && !isOptionCorrect) {
                      optionStyle = 'bg-rose-950/30 border-rose-500/40 text-rose-300 font-medium';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <span>{opt.option_text}</span>
                        {isOptionCorrect && (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">
                            Correct Answer
                          </span>
                        )}
                        {isSelected && !isOptionCorrect && (
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider shrink-0">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation Box */}
                {ans.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-indigo-400">💡 Explanation & Solution Insight:</p>
                    <p className="leading-relaxed text-slate-300">{ans.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
        >
          ← Return to Dashboard
        </Link>
        <Link
          to="/recommendations"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" /> View Full Explainable AI Plan
        </Link>
      </div>

      {/* XAI Attribution Modal */}
      <XAIModal
        isOpen={Boolean(selectedRec)}
        recommendation={selectedRec}
        onClose={() => setSelectedRec(null)}
      />
    </div>
  );
};
