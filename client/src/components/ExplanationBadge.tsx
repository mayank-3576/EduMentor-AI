import React from 'react';
import { Sparkles, TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ExplanationBadgeProps {
  level: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
  score?: number;
  delta?: number;
  showIcon?: boolean;
  onClick?: () => void;
}

export const ExplanationBadge: React.FC<ExplanationBadgeProps> = ({
  level,
  score,
  delta,
  showIcon = true,
  onClick,
}) => {
  const configs = {
    very_weak: {
      label: 'Very Weak (< 40%)',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
    },
    needs_improvement: {
      label: 'Needs Improvement (40-60%)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      icon: <TrendingDown className="w-3.5 h-3.5 text-amber-400" />,
    },
    good: {
      label: 'Good (60-80%)',
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />,
    },
    strong: {
      label: 'Strong (> 80%)',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
    },
  };

  const config = configs[level] || configs.needs_improvement;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.badgeClass} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
      {typeof score === 'number' && (
        <span className="font-semibold ml-1">({score}%)</span>
      )}
      {typeof delta === 'number' && delta !== 0 && (
        <span className={`text-[10px] ml-0.5 ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {delta > 0 ? `+${delta}%` : `${delta}%`}
        </span>
      )}
    </span>
  );
};
