import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Target, ArrowRight, BookOpen, ExternalLink, 
  CheckCircle2, XCircle, TrendingDown, TrendingUp, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ExplanationBadge } from '../../components/ExplanationBadge.js';
import { XAIModal } from '../../components/XAIModal.js';
import { Recommendation } from '../../types/index.js';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const { notify } = useNotification();

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.recommendations.getAll();
      if (res.success) {
        setRecommendations(res.recommendations);
      }
    } catch (err: any) {
      notify('error', 'Failed to load recommendations', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleDismiss = async (id: number) => {
    try {
      await api.recommendations.dismiss(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      notify('info', 'Recommendation Dismissed');
    } catch (err: any) {
      notify('error', 'Action failed', err.message);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.recommendations.complete(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      notify('success', 'Recommendation Completed!', 'Your study progress has been marked.');
    } catch (err: any) {
      notify('error', 'Action failed', err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Diagnostic Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explainable AI Recommendations
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Unlike opaque black-box recommendations, EduMentor AI provides clear mathematical attribution and pedagogical reasoning for every suggested topic, resource, and difficulty calibration.
        </p>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Computing Explainable AI diagnostic matrix...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800 p-8 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All Recommendations Addressed!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You currently have no active weak-topic alerts. Keep taking quizzes to discover new optimization areas.
          </p>
          <Link
            to="/subjects"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors inline-block mt-2"
          >
            Browse Subjects & Quizzes
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/50 shadow-xl space-y-5 transition-all"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    {rec.topic_name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">in {rec.subject_name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <ExplanationBadge
                    level={rec.current_score < 40 ? 'very_weak' : rec.current_score < 60 ? 'needs_improvement' : 'good'}
                    score={rec.current_score}
                    delta={rec.score_delta}
                  />
                  <span className="text-xs text-slate-500">• Target: {rec.target_score}%</span>
                </div>
              </div>

              {/* Title & Reason */}
              <div>
                <h3 className="text-base font-bold text-white">{rec.reason_title}</h3>
                <div className="mt-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                  <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Explainable AI Attribution Insight:
                  </div>
                  <p>{rec.explanation_markdown.replace(/### |#|\*\*|`/g, '')}</p>
                </div>
              </div>

              {/* Curated Resource */}
              {rec.resource_title && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Curated Study Asset ({rec.resource_type || 'Guide'})
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      {rec.resource_title}
                    </h4>
                  </div>
                  {rec.resource_url && (
                    <a
                      href={rec.resource_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <span>Study Resource</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setSelectedRec(rec)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Full Mathematical Attribution Breakdown →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleComplete(rec.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                  </button>
                  <Link
                    to={`/topics/${rec.topic_id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    Study Topic <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* XAI Attribution Modal */}
      <XAIModal
        isOpen={Boolean(selectedRec)}
        recommendation={selectedRec}
        onClose={() => setSelectedRec(null)}
      />
    </div>
  );
};
