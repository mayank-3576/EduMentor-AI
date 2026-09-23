import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Binary, Search, CheckCircle2, ArrowRight, 
  Layers, Code2, Sparkles, Filter 
} from 'lucide-react';
import { api } from '../../services/api.js';

export const DSAPage: React.FC = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [topRes, probRes] = await Promise.all([
          api.dsa.getTopics(),
          api.dsa.getProblems({
            topicId: selectedTopic || undefined,
            difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
            search: searchQuery || undefined,
          }),
        ]);
        if (topRes.success) setTopics(topRes.topics);
        if (probRes.success) setProblems(probRes.problems);
      } catch (err) {
        console.error('Error fetching DSA data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTopic, selectedDifficulty, searchQuery]);

  const solvedCount = problems.filter((p) => p.isSolved).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Binary className="w-3.5 h-3.5" />
              <span>DSA Mastery Track</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Data Structures & Algorithms
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Topic-wise theoretical foundations, time-space complexities, and interactive coding arena problems.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-right shrink-0">
            <p className="text-xs text-slate-400 font-medium">Problems Solved</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {solvedCount} <span className="text-xs text-slate-500 font-normal">/ {problems.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Topics Strip */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Filter by Data Structure / Algorithm
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTopic === null
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All DSA Topics
          </button>
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTopic === t.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.name} ({t.total_problems})
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Difficulty filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedDifficulty === diff
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Loading algorithmic problems...</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="font-semibold text-slate-300">No problems match your current filter.</p>
          <p className="text-xs mt-1">Try clearing filters or search queries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((prob) => (
            <Link
              key={prob.id}
              to={`/coding/${prob.id}`}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${
                  prob.isSolved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}>
                  {prob.isSolved ? <CheckCircle2 className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {prob.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      prob.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-300' :
                      prob.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-300' :
                      'bg-rose-500/15 text-rose-300'
                    }`}>
                      {prob.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Topic: <span className="text-slate-300 font-medium">{prob.topic_name}</span> • 
                    Time: <span className="text-cyan-400 font-mono font-medium">{prob.time_complexity}</span> • 
                    Space: <span className="text-cyan-400 font-mono font-medium">{prob.space_complexity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Solve Challenge <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
