import React from 'react';
import { ExplanationBadge } from './ExplanationBadge.js';

interface TopicPerformanceBarProps {
  topicName: string;
  subjectName?: string;
  score: number;
  quizzesAttempted?: number;
  masteryLevel: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
  onExplain?: () => void;
}

export const TopicPerformanceBar: React.FC<TopicPerformanceBarProps> = ({
  topicName,
  subjectName,
  score,
  quizzesAttempted,
  masteryLevel,
  onExplain,
}) => {
  const getProgressColor = () => {
    switch (masteryLevel) {
      case 'very_weak':
        return 'bg-rose-500';
      case 'needs_improvement':
        return 'bg-amber-500';
      case 'good':
        return 'bg-indigo-500';
      case 'strong':
        return 'bg-emerald-500';
      default:
        return 'bg-indigo-500';
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h4 className="text-sm font-semibold text-white">{topicName}</h4>
          {subjectName && <p className="text-[11px] text-slate-400 mt-0.5">{subjectName}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExplanationBadge level={masteryLevel} score={score} onClick={onExplain} />
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{quizzesAttempted ? `${quizzesAttempted} quizzes taken` : 'Diagnostic tested'}</span>
        <button
          onClick={onExplain}
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          View XAI Breakdown →
        </button>
      </div>
    </div>
  );
};
