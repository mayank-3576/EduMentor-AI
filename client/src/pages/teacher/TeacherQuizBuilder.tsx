import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, PlusCircle, Clock, Target, 
  CheckCircle2, ArrowRight, Save 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Subject, Topic } from '../../types/index.js';

export const TeacherQuizBuilder: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | ''>('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [passingScore, setPassingScore] = useState(60);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [saving, setSaving] = useState(false);

  const { notify } = useNotification();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.subjects.getAll();
        if (res.success) setSubjects(res.subjects);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      return;
    }
    const fetchSubject = async () => {
      try {
        const res = await api.subjects.getById(selectedSubjectId);
        if (res.success && res.subject.topics) {
          setTopics(res.subject.topics);
        }
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    fetchSubject();
  }, [selectedSubjectId]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedTopicId || !title.trim()) {
      notify('error', 'Validation Error', 'Subject, Topic, and Quiz Title are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.teacher.createQuiz({
        subjectId: Number(selectedSubjectId),
        topicId: Number(selectedTopicId),
        title: title.trim(),
        description: description.trim(),
        timeLimitMinutes,
        passingScore,
        difficulty,
      });

      if (res.success) {
        notify('success', 'Quiz Published!', `Quiz "${title}" is now active in curriculum.`);
        setTitle('');
        setDescription('');
      }
    } catch (err: any) {
      notify('error', 'Publish Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Curriculum Authoring</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Quiz Builder & Assessment Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Compose targeted diagnostic assessments with automated Explainable AI scoring criteria.
        </p>
      </div>

      {/* Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <form onSubmit={handleCreateQuiz} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Target Subject</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select Target Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Target Topic</label>
              <select
                required
                disabled={!selectedSubjectId}
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 disabled:opacity-40"
              >
                <option value="">Select Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Quiz Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database Normalization & BCNF Diagnostic Checkpoint"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Description & Guidelines</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the objectives, expected competencies, and scope covered in this assessment..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Time Limit (Minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Passing Score (%)</label>
              <input
                type="number"
                min="40"
                max="90"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Difficulty Tier</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Easy">Easy (Diagnostic)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Competitive/GATE)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing Quiz...' : 'Publish Quiz Assessment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
