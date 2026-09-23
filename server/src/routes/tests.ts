import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { generateExplainableRecommendation } from '../services/explainableAI.js';

const router = Router();

// 1. Get tests list (Filter by type, subjectId, unitId)
router.get('/', (req, res): void => {
  try {
    const { testType, subjectId, unitId } = req.query;
    let sql = `
      SELECT a.*,
             s.name as subject_name, s.code as subject_code,
             u.title as unit_title, u.unit_number,
             t.name as topic_name,
             (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id) as question_count
      FROM assessments a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN units u ON a.unit_id = u.id
      LEFT JOIN topics t ON a.topic_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (testType && typeof testType === 'string' && testType !== 'All') {
      sql += ' AND a.test_type = ?';
      params.push(testType);
    }
    if (subjectId) {
      sql += ' AND a.subject_id = ?';
      params.push(subjectId);
    }
    if (unitId) {
      sql += ' AND a.unit_id = ?';
      params.push(unitId);
    }

    sql += ' ORDER BY a.id ASC';

    const tests = queryAll<any>(sql, params);
    res.json({ success: true, count: tests.length, tests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get test details and questions (Sanitized without exposing is_correct)
router.get('/:id', (req, res): void => {
  try {
    const { id } = req.params;

    const assessment = queryOne<any>(
      `SELECT a.*,
              s.name as subject_name, s.code as subject_code, s.slug as subject_slug,
              u.title as unit_title, u.unit_number,
              t.name as topic_name
       FROM assessments a
       JOIN subjects s ON a.subject_id = s.id
       LEFT JOIN units u ON a.unit_id = u.id
       LEFT JOIN topics t ON a.topic_id = t.id
       WHERE a.id = ?`,
      [id]
    );

    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found.' });
      return;
    }

    const questions = queryAll<any>(
      `SELECT q.id, q.question_text, q.code_context, q.difficulty, q.points, q.topic_id, q.unit_id,
              t.name as topic_name, u.unit_number
       FROM assessment_questions aq
       JOIN questions q ON aq.question_id = q.id
       LEFT JOIN topics t ON q.topic_id = t.id
       LEFT JOIN units u ON q.unit_id = u.id
       WHERE aq.assessment_id = ?
       ORDER BY aq.order_index ASC`,
      [assessment.id]
    );

    const questionsWithOptions = questions.map((q) => {
      const options = queryAll<any>(
        `SELECT id, question_id, option_text FROM question_options WHERE question_id = ? ORDER BY id ASC`,
        [q.id]
      );
      return {
        ...q,
        options,
      };
    });

    res.json({
      success: true,
      assessment: {
        ...assessment,
        questions: questionsWithOptions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Submit assessment attempt and evaluate with Explainable AI
router.post('/:id/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { answers, timeTakenSeconds = 0, isRetest = false, parentAttemptId = null } = req.body;

    const assessment = queryOne<any>(
      `SELECT a.*, s.name as subject_name FROM assessments a JOIN subjects s ON a.subject_id = s.id WHERE a.id = ?`,
      [id]
    );

    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found.' });
      return;
    }

    // Load full questions with correct answers
    const questions = queryAll<any>(
      `SELECT q.*, aq.order_index
       FROM assessment_questions aq
       JOIN questions q ON aq.question_id = q.id
       WHERE aq.assessment_id = ?
       ORDER BY aq.order_index ASC`,
      [assessment.id]
    );

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    const topicScores: Record<number, { correct: number; total: number; unitId: number }> = {};
    const detailedAnswers: any[] = [];

    for (const q of questions) {
      const points = q.points || 10;
      maxScore += points;

      const userSelectedOptionId = answers ? answers[q.id] : null;
      const correctOption = queryOne<any>(
        `SELECT id, option_text, explanation FROM question_options WHERE question_id = ? AND is_correct = 1`,
        [q.id]
      );

      const isCorrect = userSelectedOptionId && correctOption && Number(userSelectedOptionId) === Number(correctOption.id);

      if (isCorrect) {
        totalScore += points;
        correctCount += 1;
      }

      // Track by topic
      if (!topicScores[q.topic_id]) {
        topicScores[q.topic_id] = { correct: 0, total: 0, unitId: q.unit_id || assessment.unit_id };
      }
      topicScores[q.topic_id].total += 1;
      if (isCorrect) {
        topicScores[q.topic_id].correct += 1;
      }

      // All options for review
      const options = queryAll<any>(
        `SELECT id, option_text, is_correct, explanation FROM question_options WHERE question_id = ?`,
        [q.id]
      );

      detailedAnswers.push({
        questionId: q.id,
        questionText: q.question_text,
        codeContext: q.code_context,
        difficulty: q.difficulty,
        selectedOptionId: userSelectedOptionId,
        correctOptionId: correctOption?.id,
        isCorrect: Boolean(isCorrect),
        explanation: q.explanation,
        options,
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;
    const passed = percentage >= assessment.passing_score ? 1 : 0;

    // Record assessment attempt
    const attemptRes = run(
      `INSERT INTO assessment_attempts (
        user_id, assessment_id, test_type, score, max_score, percentage, passed,
        time_taken_seconds, is_retest, parent_attempt_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        assessment.id,
        assessment.test_type,
        totalScore,
        maxScore,
        percentage,
        passed,
        timeTakenSeconds,
        isRetest ? 1 : 0,
        parentAttemptId || null,
      ]
    );

    const attemptId = attemptRes.lastInsertRowid;

    // Record individual answers
    for (const ans of detailedAnswers) {
      run(
        `INSERT INTO assessment_answers (
          attempt_id, question_id, selected_option_id, is_correct, time_spent_seconds
        ) VALUES (?, ?, ?, ?, ?)`,
        [attemptId, ans.questionId, ans.selectedOptionId || null, ans.isCorrect ? 1 : 0, 30]
      );
    }

    // Multi-level Rollups:
    // 1. Topic Performance Update
    const weakTopics: Array<{ topicId: number; topicName: string; scorePct: number; unitId: number }> = [];

    for (const [topicIdStr, stats] of Object.entries(topicScores)) {
      const tId = Number(topicIdStr);
      const topicPct = Math.round((stats.correct / stats.total) * 100);

      let mastery: 'very_weak' | 'needs_improvement' | 'good' | 'strong' = 'needs_improvement';
      if (topicPct < 40) mastery = 'very_weak';
      else if (topicPct < 60) mastery = 'needs_improvement';
      else if (topicPct < 80) mastery = 'good';
      else mastery = 'strong';

      const topicInfo = queryOne<any>(`SELECT name FROM topics WHERE id = ?`, [tId]);

      if (topicPct < 60) {
        weakTopics.push({
          topicId: tId,
          topicName: topicInfo?.name || 'Topic',
          scorePct: topicPct,
          unitId: stats.unitId,
        });
      }

      run(
        `INSERT INTO topic_performance (
          user_id, topic_id, unit_id, quizzes_attempted, total_questions, correct_answers,
          average_score, mastery_level, last_updated_at
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, topic_id) DO UPDATE SET
          quizzes_attempted = quizzes_attempted + 1,
          total_questions = total_questions + ?,
          correct_answers = correct_answers + ?,
          average_score = (average_score + ?) / 2,
          mastery_level = ?,
          last_updated_at = CURRENT_TIMESTAMP`,
        [
          userId, tId, stats.unitId, stats.total, stats.correct, topicPct, mastery,
          stats.total, stats.correct, topicPct, mastery
        ]
      );
    }

    // 2. Unit Performance Update
    if (assessment.unit_id) {
      let unitMastery: 'very_weak' | 'needs_improvement' | 'good' | 'strong' = 'needs_improvement';
      if (percentage < 40) unitMastery = 'very_weak';
      else if (percentage < 60) unitMastery = 'needs_improvement';
      else if (percentage < 80) unitMastery = 'good';
      else unitMastery = 'strong';

      run(
        `INSERT INTO unit_performance (
          user_id, unit_id, subject_id, tests_attempted, average_score, mastery_level, last_updated_at
        ) VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, unit_id) DO UPDATE SET
          tests_attempted = tests_attempted + 1,
          average_score = (average_score + ?) / 2,
          mastery_level = ?,
          last_updated_at = CURRENT_TIMESTAMP`,
        [userId, assessment.unit_id, assessment.subject_id, percentage, unitMastery, percentage, unitMastery]
      );
    }

    // 3. Subject Performance Update
    const isDiag = assessment.test_type === 'diagnostic_test';
    run(
      `INSERT INTO subject_performance (
        user_id, subject_id, tests_attempted, average_score, diagnostic_completed, diagnostic_score, last_updated_at
      ) VALUES (?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, subject_id) DO UPDATE SET
        tests_attempted = tests_attempted + 1,
        average_score = (average_score + ?) / 2,
        diagnostic_completed = CASE WHEN ? = 1 THEN 1 ELSE diagnostic_completed END,
        diagnostic_score = CASE WHEN ? = 1 THEN ? ELSE diagnostic_score END,
        last_updated_at = CURRENT_TIMESTAMP`,
      [
        userId, assessment.subject_id, percentage, isDiag ? 1 : 0, isDiag ? percentage : 0,
        percentage, isDiag ? 1 : 0, isDiag ? 1 : 0, percentage
      ]
    );

    // 4. Trigger Explainable AI Recommendation if performance indicates a gap
    let generatedRecommendation = null;
    const studentProfile = queryOne<any>(`SELECT target_score FROM student_profiles WHERE user_id = ?`, [userId]);
    const targetScore = studentProfile?.target_score || 75.0;

    if (percentage < targetScore && weakTopics.length > 0) {
      const primeWeakTopic = weakTopics[0];
      const delta = Math.round(percentage - targetScore);

      const explanationMarkdown = `### ⚠️ Adaptive Explainable AI Attribution

**Diagnostic Summary:**
- **Score Attained:** **${percentage}%** on *"${assessment.title}"*
- **Target Goal:** **${targetScore}%** (Gap: **${delta}%**)
- **Critical Focus Area:** **${primeWeakTopic.topicName}** (Score in this test: **${primeWeakTopic.scorePct}%**)

**Pedagogical Guidance:**
Our XAI assessment engine identified conceptual gaps in ${primeWeakTopic.topicName}. 
1. Review the Unit Notes and definitions for this topic.
2. Solve the university Previous Year Questions (PYQs) to understand exam patterns.
3. Take the targeted **Re-Test** to verify your improvement and boost your academic score.`;

      const recRes = run(
        `INSERT INTO recommendations (
          user_id, topic_id, unit_id, reason_title, explanation_markdown,
          triggering_test_id, current_score, target_score, score_delta, priority, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'high', 'active')`,
        [
          userId,
          primeWeakTopic.topicId,
          primeWeakTopic.unitId,
          `Conceptual Reinforcement Needed: ${primeWeakTopic.topicName}`,
          explanationMarkdown,
          assessment.id,
          percentage,
          targetScore,
          delta,
        ]
      );

      generatedRecommendation = {
        id: recRes.lastInsertRowid,
        topicName: primeWeakTopic.topicName,
        explanationMarkdown,
        targetScore,
        currentScore: percentage,
        delta,
      };

      run(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Explainable AI Recommendation Generated', ?, 'recommendation', '/recommendations')`,
        [userId, `Score of ${percentage}% in ${assessment.title} triggered targeted recommendations.`]
      );
    }

    // 5. If this was a re-test, compute before vs after improvement!
    let improvementDelta = null;
    if (isRetest && parentAttemptId) {
      const parentAttempt = queryOne<any>(
        `SELECT percentage FROM assessment_attempts WHERE id = ?`,
        [parentAttemptId]
      );
      if (parentAttempt) {
        improvementDelta = Math.round((percentage - parentAttempt.percentage) * 10) / 10;
      }
    }

    res.json({
      success: true,
      attemptId,
      result: {
        score: totalScore,
        maxScore,
        percentage,
        passed: Boolean(passed),
        correctCount,
        totalQuestions: questions.length,
        timeTakenSeconds,
        isRetest: Boolean(isRetest),
        improvementDelta,
        answers: detailedAnswers,
        recommendation: generatedRecommendation,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get attempt details by attempt ID
router.get('/attempts/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const attempt = queryOne<any>(
      `SELECT aa.*,
              a.title as assessment_title, a.test_type, a.passing_score,
              s.name as subject_name, s.code as subject_code,
              u.title as unit_title, u.unit_number
       FROM assessment_attempts aa
       JOIN assessments a ON aa.assessment_id = a.id
       JOIN subjects s ON a.subject_id = s.id
       LEFT JOIN units u ON a.unit_id = u.id
       WHERE aa.id = ? AND aa.user_id = ?`,
      [id, userId]
    );

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }

    const answers = queryAll<any>(
      `SELECT ans.*,
              q.question_text, q.code_context, q.difficulty, q.explanation, q.topic_id,
              t.name as topic_name
       FROM assessment_answers ans
       JOIN questions q ON ans.question_id = q.id
       LEFT JOIN topics t ON q.topic_id = t.id
       WHERE ans.attempt_id = ?`,
      [attempt.id]
    );

    const answersWithOptions = answers.map((ans) => {
      const options = queryAll<any>(
        `SELECT id, option_text, is_correct, explanation FROM question_options WHERE question_id = ?`,
        [ans.question_id]
      );
      return {
        ...ans,
        options,
      };
    });

    res.json({
      success: true,
      attempt: {
        ...attempt,
        answers: answersWithOptions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
