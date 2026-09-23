import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, BookOpen, Layers, FileText, 
  HelpCircle, Binary, ExternalLink, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState('');
  const [results, setResults] = useState<any>({
    subjects: [],
    topics: [],
    lessons: [],
    quizzes: [],
    dsaProblems: [],
    resources: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ subjects: [], topics: [], lessons: [], quizzes: [], dsaProblems: [], resources: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ subjects: [], topics: [], lessons: [], quizzes: [], dsaProblems: [], resources: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query.trim(), { contentType: contentType || undefined });
        if (data.success && data.results) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, contentType]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const totalResults =
    results.subjects.length +
    results.topics.length +
    results.lessons.length +
    results.quizzes.length +
    results.dsaProblems.length +
    results.resources.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-850/50">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, topics, algorithms, quizzes..."
            className="flex-1 bg-transparent border-0 text-white text-sm focus:outline-none placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-400 hover:text-white border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: '', label: 'All Results' },
            { id: 'subject', label: 'Subjects' },
            { id: 'topic', label: 'Topics' },
            { id: 'lesson', label: 'Lessons' },
            { id: 'quiz', label: 'Quizzes' },
            { id: 'dsa', label: 'DSA' },
            { id: 'resource', label: 'Resources' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setContentType(pill.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                contentType === pill.id
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching database...</span>
            </div>
          ) : !query.trim() ? (
            <div className="py-12 text-center text-slate-500">
              <p className="font-medium text-slate-400">Search EduMentor AI Database</p>
              <p className="text-[11px] mt-1">
                Type keywords like "Normalization", "Dynamic Programming", "Deadlocks", or "Two Sum".
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="font-medium text-slate-400">No matching results found for "{query}"</p>
              <p className="text-[11px] mt-1">Try broadening your search term or checking spelling.</p>
            </div>
          ) : (
            <>
              {/* Subjects */}
              {results.subjects.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Subjects</p>
                  <div className="space-y-1">
                    {results.subjects.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelect(`/subjects/${s.id}`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/80 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <div>
                            <span className="font-medium text-white">{s.name}</span>
                            <span className="text-slate-500 ml-2">({s.category})</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {results.topics.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Topics</p>
                  <div className="space-y-1">
                    {results.topics.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect(`/topics/${t.id}`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/80 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="font-medium text-white">{t.name}</span>
                            <span className="text-slate-500 ml-2">in {t.subject_name}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400">
                          {t.difficulty_level}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lessons */}
              {results.lessons.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Lessons</p>
                  <div className="space-y-1">
                    {results.lessons.map((l: any) => (
                      <button
                        key={l.id}
                        onClick={() => handleSelect(`/lessons/${l.id}`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/80 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="font-medium text-white">{l.title}</span>
                            <span className="text-slate-500 ml-2">({l.estimated_minutes} mins)</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes */}
              {results.quizzes.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Quizzes</p>
                  <div className="space-y-1">
                    {results.quizzes.map((q: any) => (
                      <button
                        key={q.id}
                        onClick={() => handleSelect(`/quizzes/${q.id}`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/80 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="w-4 h-4 text-purple-400" />
                          <div>
                            <span className="font-medium text-white">{q.title}</span>
                            <span className="text-slate-500 ml-2">({q.time_limit_minutes} mins)</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                          Take Quiz
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DSA Problems */}
              {results.dsaProblems.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">DSA & Coding Problems</p>
                  <div className="space-y-1">
                    {results.dsaProblems.map((dp: any) => (
                      <button
                        key={dp.id}
                        onClick={() => handleSelect(`/coding/${dp.id}`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/80 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Binary className="w-4 h-4 text-cyan-400" />
                          <div>
                            <span className="font-medium text-white">{dp.title}</span>
                            <span className="text-slate-500 ml-2">{dp.topic_name}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                          dp.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                          dp.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {dp.difficulty}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
