import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, CheckCircle2, Award, 
  Layers, Sparkles, Shield, Cpu, Terminal 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/StatCard.js';

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [anRes, aiRes] = await Promise.all([
          api.admin.getAnalytics(),
          api.ai.getStatus(),
        ]);
        if (anRes.success) setAnalytics(anRes);
        if (aiRes.success) setAiStatus(aiRes);
      } catch (err) {
        console.error('Failed to load platform analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Compiling platform telemetry and system engine telemetry...</p>
      </div>
    );
  }

  const stats = analytics?.stats;
  const categories = analytics?.categories || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Platform Health & System Telemetry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Analytics & AI Adapters
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Real-time platform metrics, user adoption curves, and pluggable external AI/Code runner integration status.
        </p>
      </div>

      {/* Key Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle="Registered accounts"
          icon={<Users className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Curriculum Entities"
          value={(stats?.totalSubjects || 0) + (stats?.totalTopics || 0) + (stats?.totalLessons || 0)}
          subtitle={`${stats?.totalSubjects || 0} Subjects • ${stats?.totalTopics || 0} Topics`}
          icon={<Layers className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Quiz Evaluations"
          value={stats?.totalAttempts || 0}
          subtitle="Processed diagnostic sessions"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="XAI Recommendations"
          value={stats?.totalRecommendations || 0}
          subtitle="Explainable attributions generated"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Engine Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI & Engine Layer Readiness */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> AI Service Layer Readiness
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Operational
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {aiStatus?.features?.map((feat: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3 text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-white">External API Integration Instructions:</p>
            <p>
              To plug in live OpenAI or Gemini API keys, set <code className="text-indigo-300">GEMINI_API_KEY</code> or <code className="text-indigo-300">OPENAI_API_KEY</code> in the server <code className="text-indigo-300">.env</code>. The adapter will automatically switch from the deterministic engine to live LLM streaming.
            </p>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> B.Tech Academic Coverage
          </h3>

          <div className="space-y-3">
            {categories.map((cat: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-white">{cat.category}</span>
                <span className="font-bold text-indigo-400">{cat.subject_count} Subjects Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
