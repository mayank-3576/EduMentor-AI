import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Map, CheckCircle2, Circle, ArrowRight, 
  Layers, Clock, Trophy, BookOpen 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';

export const LearningPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { notify } = useNotification();

  useEffect(() => {
    const fetchPaths = async () => {
      setLoading(true);
      try {
        const res = await api.learningPaths.getAll();
        if (res.success && res.paths.length > 0) {
          setPaths(res.paths);
          setSelectedPathId(res.paths[0].id);
        }
      } catch (err) {
        console.error('Failed to load learning paths:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []);

  useEffect(() => {
    if (!selectedPathId) return;
    const fetchDetail = async () => {
      try {
        const res = await api.learningPaths.getById(selectedPathId);
        if (res.success) {
          setSelectedPath(res.path);
        }
      } catch (err) {
        console.error('Failed to load path detail:', err);
      }
    };
    fetchDetail();
  }, [selectedPathId]);

  const handleToggleStep = async (stepId: number) => {
    if (!selectedPathId) return;
    try {
      const res = await api.learningPaths.toggleStep(selectedPathId, stepId);
      if (res.success) {
        setSelectedPath((prev: any) => ({
          ...prev,
          progressPercentage: res.percentage,
          steps: prev.steps.map((s: any) =>
            s.id === stepId ? { ...s, isCompleted: res.completedSteps.includes(s.id) } : s
          ),
        }));
        notify('success', 'Roadmap Updated', `Current progress: ${res.percentage}%`);
      }
    } catch (err: any) {
      notify('error', 'Update Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading structured career roadmaps...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Map className="w-3.5 h-3.5" />
          <span>Curated Career Roadmaps</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Personalized Learning Paths
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Step-by-step sequential learning pathways connecting theoretical foundations, DSA drills, and practical system design milestones.
        </p>
      </div>

      {/* Path Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paths.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPathId(p.id)}
            className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              selectedPathId === p.id
                ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-indigo-400">{p.category}</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> {p.estimated_weeks} Weeks
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{p.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 w-full">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>Completion Status</span>
                <span>{p.progressPercentage || 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${p.progressPercentage || 0}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detailed Stepper View */}
      {selectedPath && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Target Role: {selectedPath.target_role}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{selectedPath.title}</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{selectedPath.progressPercentage || 0}%</span>
              <p className="text-[11px] text-slate-400">Completed</p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800 before:z-0">
            {selectedPath.steps?.map((step: any, idx: number) => {
              const isCompleted = Boolean(step.isCompleted);

              return (
                <div key={step.id} className="relative z-10 flex items-start gap-4">
                  {/* Step Checkbox Node */}
                  <button
                    onClick={() => handleToggleStep(step.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-indigo-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-mono font-bold">0{idx + 1}</span>}
                  </button>

                  {/* Step Card */}
                  <div className="flex-1 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {step.subject_name}
                        </span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-xs text-indigo-400 font-semibold">{step.topic_name}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{step.step_title}</h4>
                      {step.topic_description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{step.topic_description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/topics/${step.topic_id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        Study Topic <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
