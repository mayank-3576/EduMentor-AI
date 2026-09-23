import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Search, ArrowRight, Layers, HelpCircle, 
  Binary, Database, Cpu, Network, Code, Terminal, 
  BrainCircuit, Layout, Server, GraduationCap, School 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Subject } from '../../types/index.js';

export const BrowseSubjects: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'student') {
          // Fetch student's strictly mapped semester subjects
          const currRes = await api.curriculum.getStudentCurriculum();
          if (currRes.success) {
            setSubjects(currRes.subjects);
            setProfile(currRes.profile);
          }
        } else {
          // Admin / Faculty browse all
          const subRes = await api.subjects.getAll();
          if (subRes.success) setSubjects(subRes.subjects);
        }

        const catRes = await api.subjects.getCategories();
        if (catRes.success) setCategories(catRes.categories);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredSubjects = subjects.filter((s) => {
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query) || s.code.toLowerCase().includes(query);
  });

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Binary': return <Binary className="w-6 h-6 text-indigo-400" />;
      case 'Database': return <Database className="w-6 h-6 text-blue-400" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-emerald-400" />;
      case 'Network': return <Network className="w-6 h-6 text-cyan-400" />;
      case 'Code': return <Code className="w-6 h-6 text-purple-400" />;
      case 'Terminal': return <Terminal className="w-6 h-6 text-amber-400" />;
      case 'BrainCircuit': return <BrainCircuit className="w-6 h-6 text-rose-400" />;
      case 'Layout': return <Layout className="w-6 h-6 text-orange-400" />;
      case 'Server': return <Server className="w-6 h-6 text-teal-400" />;
      default: return <BookOpen className="w-6 h-6 text-indigo-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
          <School className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {profile?.degree_code || 'B.Tech'} • {profile?.branch_name || 'CSE AIML'} • {profile?.semester_name || 'Semester 5'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Current Semester Subjects ({profile?.semester_name || 'Semester 5'})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Students exclusively see subjects allocated to their degree, branch, and semester in accordance with university regulation.
        </p>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === 'All'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter subjects..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Loading curriculum subjects from database...</span>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="font-semibold text-slate-300">No subjects found matching criteria.</p>
          <p className="text-xs mt-1">Try selecting 'All Categories' or resetting search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredSubjects.map((sub) => (
            <Link
              key={sub.id}
              to={`/subjects/${sub.id}`}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg hover:shadow-indigo-950/20 space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    {getSubjectIcon(sub.icon)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {sub.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      5 Units
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {sub.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>5 Units (I - V)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unit & Diagnostic Tests</span>
                  </span>
                </div>
                <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Explore Units <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
