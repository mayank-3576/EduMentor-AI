import React, { useState, useEffect } from 'react';
import { 
  Library, PlusCircle, ExternalLink, Save, BookOpen 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Subject, Topic, Resource } from '../../types/index.js';

export const TeacherResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [topicId, setTopicId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Article' | 'Video' | 'Notes' | 'PDF' | 'Practice'>('Notes');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [saving, setSaving] = useState(false);

  const { notify } = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRes, subRes] = await Promise.all([
        api.resources.getAll(),
        api.subjects.getAll(),
      ]);
      if (resRes.success) setResources(resRes.resources);
      if (subRes.success) setSubjects(subRes.subjects);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    const fetchTopics = async () => {
      try {
        const res = await api.subjects.getById(subjectId);
        if (res.success && res.subject.topics) {
          setTopics(res.subject.topics);
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      }
    };
    fetchTopics();
  }, [subjectId]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !topicId || !title.trim() || !url.trim()) {
      notify('error', 'Validation Error', 'Please complete all required fields.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.teacher.createResource({
        subjectId: Number(subjectId),
        topicId: Number(topicId),
        title: title.trim(),
        type,
        url: url.trim(),
        description: description.trim(),
        difficulty,
      });

      if (res.success) {
        notify('success', 'Resource Published!', 'Resource is now accessible to all students.');
        setTitle('');
        setUrl('');
        setDescription('');
        await loadData();
      }
    } catch (err: any) {
      notify('error', 'Publish Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Library className="w-3.5 h-3.5" />
          <span>Curated Learning Assets</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Curated Educational Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Upload and organize academic study notes, video tutorials, and interactive references mapped to specific topics and difficulty tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Publish Form (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-indigo-400" /> Publish Learning Resource
          </h3>

          <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : '')}
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
                disabled={!subjectId}
                value={topicId}
                onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
              >
                <option value="">Select Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Resource Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Dive into BCNF Decomposition"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Notes">Notes</option>
                  <option value="Article">Article</option>
                  <option value="Video">Video</option>
                  <option value="PDF">PDF</option>
                  <option value="Practice">Practice Set</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Resource URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of key concepts covered..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing...' : 'Publish Resource'}</span>
            </button>
          </form>
        </div>

        {/* Existing Resources List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Active Curated Repository ({resources.length})
          </h3>

          <div className="space-y-3">
            {resources.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {res.type}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-indigo-400 font-medium">{res.topic_name}</span>
                    <span className="text-slate-500">({res.difficulty})</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{res.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{res.description}</p>
                </div>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
