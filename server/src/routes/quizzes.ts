import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { explainableAIEngine } from '../services/explainableAI.js';

const router = Router();

// List quizzes with filters
router.get('/', (req, res): void => {
  const { subjectId, topicId, difficulty } = req.query;

  let sql = `
    SELECT 
      q.*,
      s.name as subject_name,
      s.slug as subject_slug,
      t.name as topic_name,
      t.slug as topic_slug,
      COUNT(qq.question_id) as total_questions
    FROM quizzes q
    JOIN subjects s ON q.subject_id = s.id
    JOIN topics t ON q.topic_id = t.id
    LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (subjectId) {
    sql += ` AND q.subject_id = ?`;
    params.push(subjectId);
  }
  if (topicId) {
    sql += ` AND q.topic_id = ?`;
    params.push(topicId);
  }
  if (difficulty) {
    sql += ` AND q.difficulty = ?`;
    params.push(difficulty);
  }

  sql += ` GROUP BY q.id ORDER BY q.id ASC`;

  const quizzes = queryAll(sql, params);
  res.json({ success: true, count: quizzes.length, quizzes });
});

// Get quiz details and questions for taking the quiz (Omits is_correct)
router.get('/:id', (req, res): void => {
  const { id } = req.params;

  const quiz = queryOne<any>(
    `SELECT q.*, s.name as subject_name, t.name as topic_name
     FROM quizzes q
     JOIN subjects s ON q.subject_id = s.id
     JOIN topics t ON q.topic_id = t.id
     WHERE q.id = ?`,
    [id]
  );

  if (!quiz) {
    res.status(404).json({ success: false, message: 'Quiz not found.' });
    return;
  }

  // Fetch ordered questions
  const questions = queryAll<any>(
    `SELECT q.id, q.topic_id, q.subject_id, q.question_text, q.code_context, q.difficulty, q.points, qq.order_index
     FROM questions q
     JOIN quiz_questions qq ON q.id = qq.question_id
     WHERE qq.quiz_id = ?
     ORDER BY qq.order_index ASC`,
    [quiz.id]
  );

  // Fetch options for each question without revealing correct answer
  const questionsWithOptions = questions.map((question) => {
    const options = queryAll<any>(
      `SELECT id, question_id, option_text 
       FROM question_options 
       WHERE question_id = ? 
       ORDER BY id ASC`,
      [question.id]
    );
    return {
      ...question,
      options,
    };
  });

  res.json({
    success: true,
    quiz: {
      ...quiz,
      questions: questionsWithOptions,
    },
  });
});

// Submit Quiz Attempt (Adaptive Evaluation & Explainable AI Pipeline)
router.post('/:id/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { answers, timeTakenSeconds = 0 } = req.body as {
      answers: { questionId: number; selectedOptionId: number | null }[];
      timeTakenSeconds: number;
    };

    const quiz = queryOne<any>(
      `SELECT * FROM quizzes WHERE id = ?`,
      [id]
    );

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found.' });
      return;
    }

    // Load actual quiz questions with correct options
    const quizQuestions = queryAll<any>(
      `SELECT q.id, q.topic_id, q.points, q.explanation, q.question_text
       FROM questions q
       JOIN quiz_questions qq ON q.id = qq.question_id
       WHERE qq.quiz_id = ?
       ORDER BY qq.order_index ASC`,
      [quiz.id]
    );

    let totalPointsEarned = 0;
    let maxPossiblePoints = 0;
    const answersReview: any[] = [];
    const topicScoreMap: Record<number, { correct: number; total: number; pointsEarned: number; totalPoints: number }> = {};

    for (const q of quizQuestions) {
      maxPossiblePoints += q.points;

      if (!topicScoreMap[q.topic_id]) {
        topicScoreMap[q.topic_id] = { correct: 0, total: 0, pointsEarned: 0, totalPoints: 0 };
      }
      topicScoreMap[q.topic_id].total += 1;
      topicScoreMap[q.topic_id].totalPoints += q.points;

      const userAns = answers?.find((a) => a.questionId === q.id);
      const selectedOptionId = userAns?.selectedOptionId || null;

      // Get correct option
      const correctOption = queryOne<any>(
        `SELECT id, option_text, explanation FROM question_options WHERE question_id = ? AND is_correct = 1`,
        [q.id]
      );

      const allOptions = queryAll<any>(
        `SELECT id, option_text, is_correct, explanation FROM question_options WHERE question_id = ?`,
        [q.id]
      );

      const isCorrect = correctOption && selectedOptionId === correctOption.id ? 1 : 0;
      if (isCorrect) {
        totalPointsEarned += q.points;
        topicScoreMap[q.topic_id].correct += 1;
        topicScoreMap[q.topic_id].pointsEarned += q.points;
      }

      answersReview.push({
        questionId: q.id,
        questionText: q.question_text,
        topicId: q.topic_id,
        selectedOptionId,
        correctOptionId: correctOption?.id,
        isCorrect: Boolean(isCorrect),
        points: isCorrect ? q.points : 0,
        explanation: q.explanation,
        options: allOptions,
      });
    }

    const percentage = maxPossiblePoints > 0 ? Math.round((totalPointsEarned / maxPossiblePoints) * 100) : 0;
    const passed = percentage >= quiz.passing_score ? 1 : 0;

    // Record quiz attempt
    const attemptResult = run(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, max_score, percentage, passed, time_taken_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, quiz.id, totalPointsEarned, maxPossiblePoints, percentage, passed, timeTakenSeconds]
    );
    const attemptId = attemptResult.lastInsertRowid;

    // Record individual answers
    for (const ans of answersReview) {
      run(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, time_spent_seconds)
         VALUES (?, ?, ?, ?, 0)`,
        [attemptId, ans.questionId, ans.selectedOptionId, ans.isCorrect ? 1 : 0]
      );
    }

    // Record score history
    run(
      `INSERT INTO scores (user_id, quiz_id, score, percentage)
       VALUES (?, ?, ?, ?)`,
      [userId, quiz.id, totalPointsEarned, percentage]
    );

    // Format topic scores array for Explainable AI Engine
    const topicScores = Object.keys(topicScoreMap).map((tId) => ({
      topicId: Number(tId),
      ...topicScoreMap[Number(tId)],
    }));

    // Trigger Adaptive Learning and Explainable AI Engine
    const aiResult = await explainableAIEngine.processQuizAttempt(
      userId,
      quiz.id,
      attemptId,
      topicScores
    );

    // Return detailed feedback and generated recommendations
    res.json({
      success: true,
      result: {
        attemptId,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: totalPointsEarned,
        maxScore: maxPossiblePoints,
        percentage,
        passed: Boolean(passed),
        passingScore: quiz.passing_score,
        timeTakenSeconds,
        answersReview,
        topicPerformanceUpdates: aiResult.topicPerformanceUpdates,
        recommendationsGenerated: aiResult.recommendationsGenerated,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Review past attempt
router.get('/attempts/:attemptId', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { attemptId } = req.params;
  const userId = req.user!.id;

  const attempt = queryOne<any>(
    `SELECT qa.*, q.title as quiz_title, q.passing_score, s.name as subject_name, t.name as topic_name
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     JOIN subjects s ON q.subject_id = s.id
     JOIN topics t ON q.topic_id = t.id
     WHERE qa.id = ? AND (qa.user_id = ? OR ? = 'admin' OR ? = 'teacher')`,
    [attemptId, userId, req.user!.role, req.user!.role]
  );

  if (!attempt) {
    res.status(404).json({ success: false, message: 'Quiz attempt not found.' });
    return;
  }

  const answers = queryAll<any>(
    `SELECT 
       qans.selected_option_id,
       qans.is_correct,
       q.id as question_id,
       q.question_text,
       q.explanation,
       q.points
     FROM quiz_answers qans
     JOIN questions q ON qans.question_id = q.id
     WHERE qans.attempt_id = ?
     ORDER BY q.id ASC`,
    [attempt.id]
  );

  const enrichedAnswers = answers.map((a) => {
    const options = queryAll<any>(
      `SELECT id, option_text, is_correct, explanation FROM question_options WHERE question_id = ?`,
      [a.question_id]
    );
    return {
      ...a,
      options,
    };
  });

  res.json({
    success: true,
    attempt: {
      ...attempt,
      answers: enrichedAnswers,
    },
  });
});

export default router;
