import React, { useState, useEffect } from 'react';
import { 
  FileQuestion, FolderKanban, PlusCircle, Search, 
  Trash2, Clock, Target, HelpCircle, CheckCircle2 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';
import { Quiz } from '../../types/index.js';

export const AdminQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);

  const { notify } = useNotification();

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.quizzes.getAll();
      if (res.success) setQuizzes(res.quizzes);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const filtered = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.subject_name && q.subject_name.toLowerCase().includes(search.toLowerCase())) ||
      (q.topic_name && q.topic_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Evaluation Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Quizzes & Assessments Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Inspect, configure, and monitor all active diagnostic quizzes across subjects and topics.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter quizzes by title or topic..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading quiz registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {quiz.difficulty} Difficulty
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" /> {quiz.time_limit_minutes}m
                  </span>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {quiz.subject_name} • {quiz.topic_name}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Passing: <strong className="text-white">{quiz.passing_score}%</strong></span>
                <span>{quiz.total_questions || 0} Questions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
