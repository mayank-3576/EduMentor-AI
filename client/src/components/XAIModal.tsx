import React from 'react';
import { X, Sparkles, Target, ArrowRight, BookOpen, BrainCircuit } from 'lucide-react';
import { Recommendation } from '../types/index.js';
import { ExplanationBadge } from './ExplanationBadge.js';
import { Link } from 'react-router-dom';

interface XAIModalProps {
  recommendation: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const XAIModal: React.FC<XAIModalProps> = ({ recommendation, isOpen, onClose }) => {
  if (!isOpen || !recommendation) return null;

  const getMastery = (score: number) => {
    if (score < 40) return 'very_weak';
    if (score < 60) return 'needs_improvement';
    if (score < 80) return 'good';
    return 'strong';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Explainable AI Diagnostic Attribution
              </h3>
              <p className="text-xs text-slate-400">
                Transparent attribution model for {recommendation.topic_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <p className="text-xs text-slate-400 font-medium">Topic Mastery</p>
              <div className="mt-1">
                <ExplanationBadge
                  level={getMastery(recommendation.current_score)}
                  score={recommendation.current_score}
                  delta={recommendation.score_delta}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Target Benchmark</p>
              <p className="text-sm font-semibold text-white mt-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                {recommendation.target_score}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Deficit / Gap</p>
              <p className={`text-sm font-semibold mt-1 ${
                recommendation.current_score < recommendation.target_score ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {Math.round(recommendation.current_score - recommendation.target_score)}%
              </p>
            </div>
          </div>

          {/* Reason Title */}
          <div>
            <h4 className="text-sm font-semibold text-indigo-300 mb-1">
              {recommendation.reason_title}
            </h4>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-3 bg-slate-850/30 p-4 rounded-xl border border-slate-800/80">
              {recommendation.explanation_markdown.split('\n\n').map((paragraph, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(paragraph) }} />
              ))}
            </div>
          </div>

          {/* Linked Resource */}
          {recommendation.resource_title && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Curated Action Material
              </p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{recommendation.resource_title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Type: <span className="text-indigo-300">{recommendation.resource_type || 'Study Guide'}</span>
                  </p>
                </div>
                {recommendation.resource_url && (
                  <a
                    href={recommendation.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shrink-0"
                  >
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};

function formatMarkdownPreview(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-2 mb-1">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs">$1</code>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>');
}
