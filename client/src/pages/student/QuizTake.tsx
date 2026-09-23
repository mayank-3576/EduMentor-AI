import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Clock, ArrowLeft, ArrowRight, CheckCircle2, 
  Flag, AlertCircle, HelpCircle, Code, Target, ShieldAlert 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';

export const QuizTake: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const isRetest = Boolean((location.state as any)?.isRetest);
  const parentAttemptId = (location.state as any)?.parentAttemptId || null;

  const [testData, setTestData] = useState<any>(null);
  const [isAssessmentMode, setIsAssessmentMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins default
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      setLoading(true);
      try {
        if (id) {
          // Try loading as new centralized assessment first
          try {
            const res = await api.tests.getById(id);
            if (res.success && res.assessment) {
              setTestData(res.assessment);
              setIsAssessmentMode(true);
              setTimeLeft((res.assessment.time_limit_minutes || 20) * 60);
              setLoading(false);
              return;
            }
          } catch {
            // Fallback to legacy quizzes
          }

          const legacyRes = await api.quizzes.getById(id);
          if (legacyRes.success) {
            setTestData(legacyRes.quiz);
            setIsAssessmentMode(false);
            setTimeLeft((legacyRes.quiz.time_limit_minutes || 10) * 60);
          }
        }
      } catch (err: any) {
        notify('error', 'Test Load Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!testData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testData, timeLeft]);

  const handleSelectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleToggleFlag = (questionId: number) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitTest = async () => {
    if (!id || submitting || !testData) return;
    setSubmitting(true);
    setIsSubmitModalOpen(false);

    try {
      const totalTimeSeconds = Math.max(10, (testData.time_limit_minutes * 60) - timeLeft);

      if (isAssessmentMode) {
        const res = await api.tests.submit(id, {
          answers,
          timeTakenSeconds: totalTimeSeconds,
          isRetest,
          parentAttemptId,
        });

        if (res.success && res.result) {
          notify('success', 'Assessment Evaluated!', 'Your Explainable AI diagnostic report is ready.');
          navigate(`/quizzes/result/${res.attemptId}`, {
            state: {
              result: {
                ...res.result,
                quizTitle: testData.title,
                subject_name: testData.subject_name,
                test_type: testData.test_type,
                recommendationsGenerated: res.result.recommendation ? [res.result.recommendation] : [],
                answersReview: res.result.answers,
              },
            },
          });
        }
      } else {
        const answersPayload = testData.questions.map((q: any) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id] || null,
        }));

        const res = await api.quizzes.submit(id, answersPayload, totalTimeSeconds);
        if (res.success && res.result) {
          notify('success', 'Quiz Evaluated!', 'Your Explainable AI diagnostic report is ready.');
          navigate(`/quizzes/result/${res.result.attemptId}`, {
            state: { result: res.result },
          });
        }
      }
    } catch (err: any) {
      notify('error', 'Submission Failed', err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Preparing academic evaluation environment...</p>
      </div>
    );
  }

  if (!testData || !testData.questions || testData.questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Assessment contains no questions yet.</p>
        <Link to="/dashboard" className="text-xs text-indigo-400 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentQuestion = testData.questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;
  const totalCount = testData.questions.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Timer Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl sticky top-20 z-20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              {testData.subject_name || 'Academic Assessment'} {testData.unit_title ? `• ${testData.unit_title}` : ''}
            </span>
            {isRetest && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Targeted Re-Test
              </span>
            )}
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white mt-0.5">{testData.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
            timeLeft < 120 
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
              : 'bg-slate-950 text-slate-200 border-slate-800'
          }`}>
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            {submitting ? 'Evaluating...' : 'Submit Test'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Card (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            {/* Question metadata */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Question <strong className="text-white">{currentIndex + 1}</strong> of {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-300' :
                  currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-300' :
                  'bg-rose-500/15 text-rose-300'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <button
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                    flagged[currentQuestion.id]
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flag</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            {/* Code Context if present */}
            {currentQuestion.code_context && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                <pre>{currentQuestion.code_context}</pre>
              </div>
            )}

            {/* Multiple Choice Options */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options?.map((opt: any, optIdx: number) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 text-slate-400 border-slate-700 group-hover:text-white'
                      }`}
                    >
                      {optionLetters[optIdx] || optIdx + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                      {opt.option_text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {currentIndex < totalCount - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  Review & Submit <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Question Navigator
            </h3>

            {/* Question numbers grid */}
            <div className="grid grid-cols-5 gap-2">
              {testData.questions.map((q: any, idx: number) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = Boolean(flagged[q.id]);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></span>
                  Answered
                </span>
                <span className="font-bold text-white">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800"></span>
                  Unanswered
                </span>
                <span className="font-bold text-white">{totalCount - answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></span>
                  Flagged for Review
                </span>
                <span className="font-bold text-white">{Object.values(flagged).filter(Boolean).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isSubmitModalOpen}
        title="Submit Academic Assessment?"
        message={`You have answered ${answeredCount} of ${totalCount} questions. Submitting will evaluate your score, record unit-level mastery, and trigger Explainable AI recommendations.`}
        confirmLabel="Yes, Submit Now"
        cancelLabel="Continue Test"
        onConfirm={handleSubmitTest}
        onCancel={() => setIsSubmitModalOpen(false)}
      />
    </div>
  );
};
