import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, Calendar, Target, 
  Award, CheckCircle2, AlertTriangle, Layers 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { StatCard } from '../../components/StatCard.js';
import { ExplanationBadge } from '../../components/ExplanationBadge.js';
import { TopicPerformanceBar } from '../../components/TopicPerformanceBar.js';
import { XAIModal } from '../../components/XAIModal.js';

export const StudentAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopicPerf, setSelectedTopicPerf] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.student.getAnalytics();
        if (res.success) setAnalytics(res.analytics);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Computing student telemetry analytics...</p>
      </div>
    );
  }

  const scoreHistory = analytics?.scoreHistory || [];
  const topicBreakdown = analytics?.topicBreakdown || [];
  const categoryStats = analytics?.categoryStats || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Continuous Evaluation Telemetry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Visual trace of your quiz milestones, mastery retention across engineering categories, and historical score trajectories.
        </p>
      </div>

      {/* 1. Score History Timeline */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> Quiz Score Progression
        </h2>

        {scoreHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No quiz history recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {scoreHistory.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{item.quiz_title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Topic: <strong className="text-slate-300">{item.topic_name}</strong> • Attempted on {new Date(item.attempted_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white">{item.percentage}%</span>
                    <p className="text-[10px] text-slate-500">{item.score} / {item.max_score} pts</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {item.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Topic Mastery Distribution */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" /> Topic Mastery Distribution
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topicBreakdown.map((tp: any) => (
            <TopicPerformanceBar
              key={tp.id}
              topicName={tp.topic_name}
              subjectName={`${tp.subject_name} (${tp.category})`}
              score={tp.average_score}
              quizzesAttempted={tp.quizzes_attempted}
              masteryLevel={tp.mastery_level}
              onExplain={() => setSelectedTopicPerf(tp)}
            />
          ))}
        </div>
      </div>

      {/* 3. Category Performance Summary */}
      {categoryStats.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" /> B.Tech Category Performance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((cs: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  {cs.category}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{Math.round(cs.avg_score || 0)}%</span>
                  <span className="text-xs text-slate-400">{cs.topics_covered} Topics Tested</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${Math.min(100, Math.max(5, cs.avg_score || 0))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XAI Attribution Modal for Topic Performance */}
      {selectedTopicPerf && (
        <XAIModal
          isOpen={Boolean(selectedTopicPerf)}
          recommendation={{
            id: 0,
            user_id: selectedTopicPerf.user_id,
            topic_id: selectedTopicPerf.topic_id,
            reason_title: `Performance Diagnostic Breakdown: ${selectedTopicPerf.topic_name}`,
            explanation_markdown: `### Detailed Telemetry\n\n- **Cumulative Average:** \`${selectedTopicPerf.average_score}%\`\n- **Mastery Classification:** **${selectedTopicPerf.mastery_level.toUpperCase()}**\n- **Total Questions Attempted:** ${selectedTopicPerf.total_questions}\n- **Correct Answers:** ${selectedTopicPerf.correct_answers}\n\nThis metric influences your automated recommendations and practice problem difficulty.`,
            current_score: selectedTopicPerf.average_score,
            target_score: 75,
            score_delta: 0,
            priority: 'medium',
            status: 'active',
            created_at: selectedTopicPerf.last_updated_at,
            topic_name: selectedTopicPerf.topic_name,
            subject_name: selectedTopicPerf.subject_name,
          }}
          onClose={() => setSelectedTopicPerf(null)}
        />
      )}
    </div>
  );
};
