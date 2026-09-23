import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// Require teacher or admin role for all teacher endpoints
router.use(authenticateToken, requireRole('teacher', 'admin'));

// Teacher Dashboard Overview
router.get('/dashboard', (req: AuthenticatedRequest, res: Response): void => {
  const teacherId = req.user!.id;

  const totalStudents = queryOne<any>(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`)?.count || 0;
  const totalQuizzes = queryOne<any>(`SELECT COUNT(*) as count FROM quizzes`)?.count || 0;
  const totalQuestions = queryOne<any>(`SELECT COUNT(*) as count FROM questions`)?.count || 0;
  const totalAttempts = queryOne<any>(`SELECT COUNT(*) as count FROM quiz_attempts`)?.count || 0;
  const averageClassScore = queryOne<any>(`SELECT AVG(percentage) as avg_score FROM quiz_attempts`)?.avg_score || 0;

  // Hardest topics (lowest average scores among students)
  const hardestTopics = queryAll<any>(
    `SELECT t.id, t.name, s.name as subject_name, AVG(tp.average_score) as class_average, COUNT(tp.user_id) as student_count
     FROM topic_performance tp
     JOIN topics t ON tp.topic_id = t.id
     JOIN subjects s ON t.subject_id = s.id
     GROUP BY t.id
     ORDER BY class_average ASC
     LIMIT 5`
  );

  // Recent quiz attempts across students
  const recentAttempts = queryAll<any>(
    `SELECT qa.id, qa.score, qa.max_score, qa.percentage, qa.passed, qa.attempted_at,
            u.name as student_name, u.email as student_email,
            q.title as quiz_title, t.name as topic_name
     FROM quiz_attempts qa
     JOIN users u ON qa.user_id = u.id
     JOIN quizzes q ON qa.quiz_id = q.id
     JOIN topics t ON q.topic_id = t.id
     ORDER BY qa.attempted_at DESC
     LIMIT 10`
  );

  res.json({
    success: true,
    stats: {
      totalStudents,
      totalQuizzes,
      totalQuestions,
      totalAttempts,
      averageClassScore: Math.round(averageClassScore),
    },
    hardestTopics,
    recentAttempts,
  });
});

// Create new question with options
router.post('/questions', (req: AuthenticatedRequest, res: Response): void => {
  const { subjectId, topicId, questionText, codeContext, difficulty = 'Medium', explanation, points = 10, options } = req.body;

  if (!subjectId || !topicId || !questionText || !options || !Array.isArray(options) || options.length < 2) {
    res.status(400).json({ success: false, message: 'Valid subject, topic, question text, and at least 2 options are required.' });
    return;
  }

  const qResult = run(
    `INSERT INTO questions (subject_id, topic_id, question_text, code_context, difficulty, explanation, points)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [subjectId, topicId, questionText.trim(), codeContext || null, difficulty, explanation || '', points]
  );
  const questionId = qResult.lastInsertRowid;

  for (const opt of options) {
    run(
      `INSERT INTO question_options (question_id, option_text, is_correct, explanation)
       VALUES (?, ?, ?, ?)`,
      [questionId, opt.text.trim(), opt.isCorrect ? 1 : 0, opt.explanation || '']
    );
  }

  res.status(201).json({ success: true, message: 'Question created successfully in bank.', questionId });
});

// Create new quiz
router.post('/quizzes', (req: AuthenticatedRequest, res: Response): void => {
  const teacherId = req.user!.id;
  const { subjectId, topicId, title, description, timeLimitMinutes = 15, passingScore = 60, difficulty = 'Medium', questionIds } = req.body;

  if (!subjectId || !topicId || !title) {
    res.status(400).json({ success: false, message: 'Subject, topic, and title are required.' });
    return;
  }

  const qzResult = run(
    `INSERT INTO quizzes (subject_id, topic_id, title, description, time_limit_minutes, passing_score, difficulty, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [subjectId, topicId, title.trim(), description || '', timeLimitMinutes, passingScore, difficulty, teacherId]
  );
  const quizId = qzResult.lastInsertRowid;

  if (Array.isArray(questionIds)) {
    for (let i = 0; i < questionIds.length; i++) {
      run(
        `INSERT INTO quiz_questions (quiz_id, question_id, order_index)
         VALUES (?, ?, ?)`,
        [quizId, questionIds[i], i + 1]
      );
    }
  }

  res.status(201).json({ success: true, message: 'Quiz created successfully.', quizId });
});

// Create new resource
router.post('/resources', (req: AuthenticatedRequest, res: Response): void => {
  const { subjectId, topicId, title, type = 'Article', url, description, difficulty = 'Beginner' } = req.body;

  if (!subjectId || !topicId || !title || !url) {
    res.status(400).json({ success: false, message: 'Subject, topic, title, and URL are required.' });
    return;
  }

  const resResult = run(
    `INSERT INTO resources (subject_id, topic_id, title, type, url, description, difficulty, is_external)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [subjectId, topicId, title.trim(), type, url.trim(), description || '', difficulty]
  );

  res.status(201).json({ success: true, message: 'Resource published successfully.', resourceId: resResult.lastInsertRowid });
});

// Student Performance List
router.get('/student-performance', (req: AuthenticatedRequest, res: Response): void => {
  const students = queryAll<any>(
    `SELECT u.id, u.name, u.email, sp.target_score, sp.current_streak, sp.total_study_minutes, sp.target_goal,
            COUNT(qa.id) as total_quizzes_taken,
            AVG(qa.percentage) as average_score
     FROM users u
     JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
     WHERE u.role = 'student'
     GROUP BY u.id
     ORDER BY average_score DESC`
  );

  res.json({
    success: true,
    students: students.map((s) => ({
      ...s,
      average_score: s.average_score ? Math.round(s.average_score) : 0,
    })),
  });
});

export default router;
