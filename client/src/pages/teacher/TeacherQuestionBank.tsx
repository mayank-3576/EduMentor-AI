import React, { useState, useEffect } from 'react';
import { 
  FileQuestion, PlusCircle, Search, Filter, 
  CheckCircle2, XCircle, Trash2, ArrowRight, X 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Subject, Topic } from '../../types/index.js';

export const TeacherQuestionBank: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formSubjectId, setFormSubjectId] = useState<number | ''>('');
  const [formTopicId, setFormTopicId] = useState<number | ''>('');
  const [questionText, setQuestionText] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(10);
  const [options, setOptions] = useState([
    { text: '', isCorrect: true, explanation: '' },
    { text: '', isCorrect: false, explanation: '' },
    { text: '', isCorrect: false, explanation: '' },
    { text: '', isCorrect: false, explanation: '' },
  ]);

  const [saving, setSaving] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.subjects.getAll();
        if (res.success && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    const fetchSubjectDetail = async () => {
      try {
        const res = await api.subjects.getById(selectedSubjectId);
        if (res.success && res.subject.topics) {
          setTopics(res.subject.topics);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      }
    };
    fetchSubjectDetail();
  }, [selectedSubjectId]);

  const handleOptionChange = (idx: number, field: string, val: any) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (field === 'isCorrect') {
          return { ...opt, isCorrect: i === idx };
        }
        if (i === idx) {
          return { ...opt, [field]: val };
        }
        return opt;
      })
    );
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId || !formTopicId || !questionText.trim()) {
      notify('error', 'Validation Error', 'Please complete all required question fields.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.teacher.createQuestion({
        subjectId: Number(formSubjectId),
        topicId: Number(formTopicId),
        questionText: questionText.trim(),
        codeContext: codeContext.trim() || undefined,
        difficulty,
        explanation: explanation.trim(),
        points,
        options,
      });

      if (res.success) {
        notify('success', 'Question Added!', 'Saved into the institutional question bank.');
        setIsAddModalOpen(false);
        // Reset form
        setQuestionText('');
        setCodeContext('');
        setExplanation('');
      }
    } catch (err: any) {
      notify('error', 'Creation Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Question Bank Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Institutional Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Author and categorize diagnostic MCQs, code analysis problems, and pedagogical explanations.
          </p>
        </div>

        <button
          onClick={() => {
            setFormSubjectId(selectedSubjectId || '');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Add New Question
        </button>
      </div>

      {/* Subject Filter Pills */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Filter by Subject
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubjectId === sub.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Topics & Diagnostic Questions List */}
      <div className="space-y-6">
        {topics.map((t) => (
          <div key={t.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{t.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold">
                  {t.difficulty_level}
                </span>
              </div>
              <span className="text-xs text-slate-400">{t.description}</span>
            </div>

            <p className="text-xs text-slate-400">
              All questions linked to this topic are dynamically evaluated by the Explainable AI recommendation engine upon student submission.
            </p>
          </div>
        ))}
      </div>

      {/* Add Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Add Question to Bank
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                  <select
                    required
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Topic</label>
                  <select
                    required
                    value={formTopicId}
                    onChange={(e) => setFormTopicId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Topic</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Which normal form addresses partial functional dependency on composite candidate keys?"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Code Context (Optional)</label>
                <textarea
                  rows={2}
                  value={codeContext}
                  onChange={(e) => setCodeContext(e.target.value)}
                  placeholder="// Paste optional code snippet or relation schema..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-300 font-semibold">
                  Answer Options (Select the correct radio button)
                </label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => handleOptionChange(i, 'isCorrect', true)}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                      placeholder={`Option ${i + 1} text...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pedagogical Solution Explanation</label>
                <textarea
                  required
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the marked answer is correct and why other options fail..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {saving ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
