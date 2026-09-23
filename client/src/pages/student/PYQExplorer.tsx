import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  FileText, Filter, ChevronDown, ChevronUp, CheckCircle, 
  ArrowLeft, Search, School, BookOpen, Layers, Award 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { PYQRecord } from '../../types/index.js';

export const PYQExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subjectId') || '';

  const [pyqs, setPyqs] = useState<PYQRecord[]>([]);
  const [filters, setFilters] = useState<any>({
    universities: ['AKTU', 'Autonomous', 'JNTUH'],
    years: [2024, 2023, 2022, 2021],
    subjects: [],
  });

  const [selectedUniversity, setSelectedUniversity] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Load filter options
    api.pyq.getFilters()
      .then((res) => {
        if (res.success) setFilters(res.filters);
      })
      .catch((err) => console.error('Failed to load PYQ filters:', err));
  }, []);

  const loadPYQs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedUniversity !== 'All') params.university = selectedUniversity;
      if (selectedYear !== 'All') params.year = selectedYear;
      if (selectedSubjectId) params.subjectId = Number(selectedSubjectId);
      if (selectedUnit !== 'All') params.unitId = Number(selectedUnit);

      const res = await api.pyq.getAll(params);
      if (res.success) {
        setPyqs(res.pyqs);
      }
    } catch (err) {
      console.error('Failed to fetch PYQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPYQs();
  }, [selectedUniversity, selectedYear, selectedSubjectId, selectedUnit]);

  const toggleSolution = (id: number) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredPYQs = pyqs.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.question_text.toLowerCase().includes(q) ||
      p.solution_notes.toLowerCase().includes(q) ||
      (p.subject_name && p.subject_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Back to Dashboard */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          <span>University Question Bank & Solutions</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Previous Year Questions (PYQs)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Master real university examination patterns from AKTU and Autonomous Institutions. 
          Each problem features step-by-step model solutions and marking schemes.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Curriculum Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* University Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">University</label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Universities</option>
              {filters.universities?.map((u: string) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Exam Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Years</option>
              {filters.years?.map((y: number) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Subjects</option>
              {filters.subjects?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Normalization, TCP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* PYQ Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-white">{filteredPYQs.length}</strong> university exam questions</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs">Loading university questions...</p>
          </div>
        ) : filteredPYQs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
            <p className="text-sm font-semibold">No previous year questions match the selected filters.</p>
            <p className="text-xs mt-1 text-slate-500">Try resetting the university or subject filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPYQs.map((q) => {
              const isRevealed = revealedSolutions[q.id];

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                        {q.university} • {q.year} ({q.exam_season})
                      </span>
                      {q.subject_name && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {q.subject_name}
                        </span>
                      )}
                      {q.unit_number && (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold text-[10px]">
                          UNIT {q.unit_number === 1 ? 'I' : q.unit_number === 2 ? 'II' : q.unit_number === 3 ? 'III' : q.unit_number === 4 ? 'IV' : 'V'}
                        </span>
                      )}
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                      {q.marks} Marks
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {q.question_text}
                  </h3>

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleSolution(q.id)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                    >
                      {isRevealed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>{isRevealed ? 'Hide Model Solution & Derivation' : 'Reveal Step-by-Step Model Solution'}</span>
                    </button>

                    {isRevealed && (
                      <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-emerald-500/20 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Official University Examination Model Answer & Marking Scheme:</span>
                        </div>
                        {q.solution_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
