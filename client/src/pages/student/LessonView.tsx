import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, CheckCircle2, ArrowRight, 
  HelpCircle, BookOpen, Sparkles 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';

export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const { notify } = useNotification();

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await api.lessons.getById(id);
          if (res.success) {
            setLesson(res.lesson);
            setCompleted(Boolean(res.lesson.isCompleted));
          }
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  const handleMarkComplete = async () => {
    if (!id || completed) return;
    setCompleting(true);
    try {
      await api.lessons.markCompleted(id);
      setCompleted(true);
      notify('success', 'Lesson Completed!', `Added ${lesson.estimated_minutes} minutes to your study record.`);
    } catch (err: any) {
      notify('error', 'Update Failed', err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading educational content...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Lesson not found.</p>
        <Link to="/subjects" className="text-xs text-indigo-400 mt-2 inline-block">
          ← Back to Curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb back */}
      <Link
        to={`/topics/${lesson.topic_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {lesson.topic_name}
      </Link>

      {/* Lesson Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {lesson.subject_name}
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-medium">{lesson.topic_name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" /> {lesson.estimated_minutes} min read
            </span>

            <button
              onClick={handleMarkComplete}
              disabled={completed || completing}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                completed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completed ? 'Completed' : completing ? 'Saving...' : 'Mark as Complete'}</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {lesson.title}
        </h1>
      </div>

      {/* Markdown Content Viewer */}
      <article className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 text-slate-200 leading-relaxed text-sm space-y-4">
        {lesson.content_markdown.split('\n\n').map((paragraph: string, idx: number) => {
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-xl font-bold text-white mt-6 mb-2 border-b border-slate-800 pb-2">
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-indigo-300 mt-4 mb-1">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-sm font-semibold text-slate-200 mt-3 mb-1">
                {paragraph.replace('#### ', '')}
              </h4>
            );
          }
          if (paragraph.startsWith('```')) {
            const lines = paragraph.split('\n');
            const lang = lines[0].replace('```', '') || 'code';
            const code = lines.slice(1, -1).join('\n');
            return (
              <div key={idx} className="my-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md">
                <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 text-[11px] font-mono text-slate-400 font-semibold uppercase">
                  {lang}
                </div>
                <pre className="p-4 text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }
          if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
            const items = paragraph.split('\n');
            return (
              <ul key={idx} className="list-disc list-inside space-y-1 my-2 text-slate-300">
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} dangerouslySetInnerHTML={{ __html: formatInline(item.replace(/^[-*] /, '')) }} />
                ))}
              </ul>
            );
          }
          return (
            <p key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(paragraph) }} />
          );
        })}
      </article>

      {/* Post-Lesson Action Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Diagnostic Assessment Ready
          </span>
          <h4 className="text-sm font-bold text-white mt-1">
            Test Your Mastery of {lesson.topic_name}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit a diagnostic quiz to trigger adaptive Explainable AI feedback on your performance.
          </p>
        </div>
        <Link
          to={`/topics/${lesson.topic_id}`}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0 text-center flex items-center justify-center gap-1.5"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Go to Topic Quizzes</span>
        </Link>
      </div>

      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
        {lesson.prevLesson ? (
          <Link
            to={`/lessons/${lesson.prevLesson.id}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev: {lesson.prevLesson.title}</span>
          </Link>
        ) : (
          <div></div>
        )}

        {lesson.nextLesson && (
          <Link
            to={`/lessons/${lesson.nextLesson.id}`}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            <span>Next: {lesson.nextLesson.title}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs">$1</code>');
}
