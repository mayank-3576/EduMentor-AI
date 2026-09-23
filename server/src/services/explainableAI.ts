import { queryAll, queryOne, run, transaction } from '../db/index.js';
import { Recommendation, TopicPerformance } from '../types/index.js';

export interface EvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  topicPerformanceUpdates: TopicPerformance[];
  recommendationsGenerated: Recommendation[];
}

export interface IAIEngineService {
  processQuizAttempt(
    userId: number,
    quizId: number,
    attemptId: number,
    topicScores: { topicId: number; correct: number; total: number; pointsEarned: number; totalPoints: number }[]
  ): Promise<EvaluationResult>;
  getRecommendationsForUser(userId: number): Promise<Recommendation[]>;
  generateDirectRecommendation(userId: number, topicId: number, manualReason?: string): Promise<Recommendation>;
}

export class ExplainableAIEngine implements IAIEngineService {
  /**
   * Main adaptive learning pipeline executed after every quiz submission.
   */
  async processQuizAttempt(
    userId: number,
    quizId: number,
    attemptId: number,
    topicScores: { topicId: number; correct: number; total: number; pointsEarned: number; totalPoints: number }[]
  ): Promise<EvaluationResult> {
    const quiz = queryOne<any>(
      `SELECT q.*, s.name as subject_name, t.name as topic_name 
       FROM quizzes q
       JOIN subjects s ON q.subject_id = s.id
       JOIN topics t ON q.topic_id = t.id
       WHERE q.id = ?`,
      [quizId]
    );

    const userProfile = queryOne<any>(
      `SELECT * FROM student_profiles WHERE user_id = ?`,
      [userId]
    );
    const targetScore = userProfile?.target_score || 70.0;

    const topicPerformanceUpdates: TopicPerformance[] = [];
    const recommendationsGenerated: Recommendation[] = [];

    // Process each topic tested in the quiz
    for (const ts of topicScores) {
      const topic = queryOne<any>(
        `SELECT t.*, s.name as subject_name FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE t.id = ?`,
        [ts.topicId]
      );
      if (!topic) continue;

      const quizTopicPercentage = ts.total > 0 ? Math.round((ts.correct / ts.total) * 100) : 0;

      // Fetch existing topic performance
      const existingPerf = queryOne<any>(
        `SELECT * FROM topic_performance WHERE user_id = ? AND topic_id = ?`,
        [userId, ts.topicId]
      );

      let previousScore = existingPerf ? existingPerf.average_score : quizTopicPercentage;
      let totalQuizzes = existingPerf ? existingPerf.quizzes_attempted + 1 : 1;
      let totalQuestions = existingPerf ? existingPerf.total_questions + ts.total : ts.total;
      let totalCorrect = existingPerf ? existingPerf.correct_answers + ts.correct : ts.correct;

      // Exponential moving average: 60% recent quiz, 40% historical to adapt quickly while smoothing
      let newAverage = existingPerf
        ? Math.round(existingPerf.average_score * 0.4 + quizTopicPercentage * 0.6)
        : quizTopicPercentage;

      const scoreDelta = Math.round(newAverage - previousScore);

      // Determine Explainable AI Mastery Level
      let masteryLevel: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
      if (newAverage < 40) {
        masteryLevel = 'very_weak';
      } else if (newAverage < 60) {
        masteryLevel = 'needs_improvement';
      } else if (newAverage < 80) {
        masteryLevel = 'good';
      } else {
        masteryLevel = 'strong';
      }

      // Upsert topic performance
      if (existingPerf) {
        run(
          `UPDATE topic_performance 
           SET quizzes_attempted = ?, total_questions = ?, correct_answers = ?, average_score = ?, mastery_level = ?, last_updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [totalQuizzes, totalQuestions, totalCorrect, newAverage, masteryLevel, existingPerf.id]
        );
      } else {
        run(
          `INSERT INTO topic_performance (user_id, topic_id, quizzes_attempted, total_questions, correct_answers, average_score, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, ts.topicId, totalQuizzes, totalQuestions, totalCorrect, newAverage, masteryLevel]
        );
      }

      const updatedPerf = queryOne<TopicPerformance>(
        `SELECT tp.*, t.name as topic_name, s.name as subject_name
         FROM topic_performance tp
         JOIN topics t ON tp.topic_id = t.id
         JOIN subjects s ON t.subject_id = s.id
         WHERE tp.user_id = ? AND tp.topic_id = ?`,
        [userId, ts.topicId]
      );
      if (updatedPerf) topicPerformanceUpdates.push(updatedPerf);

      // Generate Explainable AI Recommendation based on pedagogical diagnostic rules
      const rec = this.synthesizeRecommendation({
        userId,
        topicId: ts.topicId,
        topicName: topic.name,
        subjectName: topic.subject_name,
        quizTitle: quiz?.title || 'Diagnostic Quiz',
        quizId,
        currentScore: newAverage,
        previousScore,
        scoreDelta,
        targetScore,
        masteryLevel,
      });

      if (rec) {
        recommendationsGenerated.push(rec);
      }
    }

    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      passed: true,
      topicPerformanceUpdates,
      recommendationsGenerated,
    };
  }

  /**
   * Explainable AI Synthesis with human-understandable attribution & justification
   */
  private synthesizeRecommendation(params: {
    userId: number;
    topicId: number;
    topicName: string;
    subjectName: string;
    quizTitle: string;
    quizId: number;
    currentScore: number;
    previousScore: number;
    scoreDelta: number;
    targetScore: number;
    masteryLevel: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
  }): Recommendation | null {
    const {
      userId,
      topicId,
      topicName,
      subjectName,
      quizTitle,
      quizId,
      currentScore,
      previousScore,
      scoreDelta,
      targetScore,
      masteryLevel,
    } = params;

    // Pick best resource for this topic according to mastery level
    const targetDifficulty =
      masteryLevel === 'very_weak'
        ? 'Beginner'
        : masteryLevel === 'needs_improvement'
        ? 'Intermediate'
        : 'Advanced';

    const resource = queryOne<any>(
      `SELECT * FROM resources 
       WHERE topic_id = ? 
       ORDER BY CASE WHEN difficulty = ? THEN 0 ELSE 1 END, id ASC 
       LIMIT 1`,
      [topicId, targetDifficulty]
    );

    let reasonTitle = '';
    let explanationMarkdown = '';
    let priority: 'high' | 'medium' | 'low' = 'medium';

    const deltaSign = scoreDelta >= 0 ? `+${scoreDelta}%` : `${scoreDelta}%`;
    const deltaText = scoreDelta !== 0 ? ` (Recent change: **${deltaSign}**)` : '';

    if (masteryLevel === 'very_weak') {
      priority = 'high';
      reasonTitle = `Critical Conceptual Gap Detected in ${topicName}`;
      explanationMarkdown = 
`### ⚠️ Foundational Reinforcement Required

**Why this was recommended:**
- **Current Score:** \`${currentScore}%\` (Target: \`${targetScore}%\`)${deltaText}
- **Triggering Quiz:** "${quizTitle}"
- **Diagnostic Category:** **Very Weak (< 40%)**

**Pedagogical Analysis:**
Your recent answers show difficulty with the core definitions and fundamentals of **${topicName}** within *${subjectName}*. 

To build an intuitive foundation, we recommend starting with fundamental concept breakdowns and easy-level verification questions before advancing to complex multi-step problems.`;
    } else if (masteryLevel === 'needs_improvement') {
      priority = 'high';
      reasonTitle = `Targeted Concept Revision in ${topicName}`;
      explanationMarkdown = 
`### 📈 Bridge the Gap to Mastery

**Why this was recommended:**
- **Current Score:** \`${currentScore}%\` (Target: \`${targetScore}%\`)${deltaText}
- **Triggering Quiz:** "${quizTitle}"
- **Diagnostic Category:** **Needs Improvement (40% - 60%)**

**Pedagogical Analysis:**
You have acquired basic familiarity with **${topicName}**, but accuracy drops on corner cases and composite question types. 

Revising core algorithmic steps and reviewing curated study notes will help you breach the 70% threshold.`;
    } else if (masteryLevel === 'good') {
      priority = 'medium';
      reasonTitle = `Strengthen Mastery in ${topicName}`;
      explanationMarkdown = 
`### 🚀 Elevate to Advanced Proficiency

**Why this was recommended:**
- **Current Score:** \`${currentScore}%\` (Target: \`${targetScore}%\`)${deltaText}
- **Triggering Quiz:** "${quizTitle}"
- **Diagnostic Category:** **Good (60% - 80%)**

**Pedagogical Analysis:**
Great work! You have established solid competence in **${topicName}**. 

We recommend moving to medium-difficulty interview problems, time-complexity optimizations, and real-world system design applications.`;
    } else {
      priority = 'low';
      reasonTitle = `Excellence Challenge for ${topicName}`;
      explanationMarkdown = 
`### 🏆 Advanced Mastery Maintained

**Why this was recommended:**
- **Current Score:** \`${currentScore}%\` (Target: \`${targetScore}%\`)${deltaText}
- **Triggering Quiz:** "${quizTitle}"
- **Diagnostic Category:** **Strong (> 80%)**

**Pedagogical Analysis:**
You have demonstrated exceptional mastery in **${topicName}**. 

To maintain competitive sharpness for technical interviews and GATE, attempt hard-difficulty constraint problems and speed drills.`;
    }

    // Check if an identical active recommendation already exists
    const existingRec = queryOne<any>(
      `SELECT id FROM recommendations 
       WHERE user_id = ? AND topic_id = ? AND status = 'active'`,
      [userId, topicId]
    );

    let recId: number;
    if (existingRec) {
      run(
        `UPDATE recommendations 
         SET reason_title = ?, explanation_markdown = ?, triggering_quiz_id = ?, 
             current_score = ?, target_score = ?, score_delta = ?, priority = ?, resource_id = ?
         WHERE id = ?`,
        [reasonTitle, explanationMarkdown, quizId, currentScore, targetScore, scoreDelta, priority, resource?.id || null, existingRec.id]
      );
      recId = existingRec.id;
    } else {
      const insertResult = run(
        `INSERT INTO recommendations (user_id, topic_id, resource_id, reason_title, explanation_markdown, triggering_quiz_id, current_score, target_score, score_delta, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [userId, topicId, resource?.id || null, reasonTitle, explanationMarkdown, quizId, currentScore, targetScore, scoreDelta, priority]
      );
      recId = insertResult.lastInsertRowid;

      // Also create a notification for the student
      run(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, 'recommendation', ?)`,
        [userId, `New AI Recommendation: ${topicName}`, `Your recent performance in ${topicName} triggered a personalized study plan.`, `/recommendations`]
      );
    }

    return queryOne<Recommendation>(
      `SELECT r.*, t.name as topic_name, s.name as subject_name, res.title as resource_title, res.url as resource_url, res.type as resource_type
       FROM recommendations r
       JOIN topics t ON r.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN resources res ON r.resource_id = res.id
       WHERE r.id = ?`,
      [recId]
    )!;
  }

  async getRecommendationsForUser(userId: number): Promise<Recommendation[]> {
    return queryAll<Recommendation>(
      `SELECT r.*, t.name as topic_name, s.name as subject_name, res.title as resource_title, res.url as resource_url, res.type as resource_type
       FROM recommendations r
       JOIN topics t ON r.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN resources res ON r.resource_id = res.id
       WHERE r.user_id = ? AND r.status = 'active'
       ORDER BY 
         CASE r.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         r.created_at DESC`,
      [userId]
    );
  }

  async generateDirectRecommendation(userId: number, topicId: number, manualReason?: string): Promise<Recommendation> {
    const topic = queryOne<any>(
      `SELECT t.*, s.name as subject_name FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE t.id = ?`,
      [topicId]
    );
    if (!topic) throw new Error(`Topic with id ${topicId} not found`);

    const perf = queryOne<any>(
      `SELECT * FROM topic_performance WHERE user_id = ? AND topic_id = ?`,
      [userId, topicId]
    );

    const currentScore = perf?.average_score || 45.0;
    const previousScore = perf?.average_score || 45.0;

    return this.synthesizeRecommendation({
      userId,
      topicId,
      topicName: topic.name,
      subjectName: topic.subject_name,
      quizTitle: 'Direct Diagnostic Assessment',
      quizId: 0,
      currentScore,
      previousScore,
      scoreDelta: 0,
      targetScore: 75.0,
      masteryLevel: perf?.mastery_level || 'needs_improvement',
    })!;
  }
}

export const explainableAIEngine = new ExplainableAIEngine();
