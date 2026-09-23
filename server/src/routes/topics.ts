import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

function getOptionalUserId(req: Request): number | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.id || null;
  } catch {
    return null;
  }
}

// Get single topic details with full academic notes, quizzes, assessments, and PYQs
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = getOptionalUserId(req);

  const topic = queryOne<any>(
    `SELECT t.*, 
            s.name as subject_name, s.slug as subject_slug, s.code as subject_code, s.category as subject_category,
            u.id as unit_id, u.unit_number, u.title as unit_title
     FROM topics t
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN units u ON t.unit_id = u.id
     WHERE t.id = ? OR t.slug = ?`,
    [id, id]
  );

  if (!topic) {
    res.status(404).json({ success: false, message: 'Topic not found.' });
    return;
  }

  // Fetch rich academic learning materials
  const learningMaterial = queryOne<any>(
    `SELECT * FROM learning_materials WHERE topic_id = ?`,
    [topic.id]
  );

  // Parse examples_json if present
  let parsedMaterial = learningMaterial;
  if (learningMaterial && learningMaterial.examples_json) {
    try {
      parsedMaterial = {
        ...learningMaterial,
        examples: JSON.parse(learningMaterial.examples_json),
      };
    } catch {
      parsedMaterial = { ...learningMaterial, examples: [] };
    }
  }

  // Fetch assessments for this topic (Topic Quiz, etc.)
  const assessments = queryAll<any>(
    `SELECT a.*,
            (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id) as question_count
     FROM assessments a
     WHERE a.topic_id = ? OR (a.unit_id = ? AND a.test_type = 'unit_test')
     ORDER BY a.id ASC`,
    [topic.id, topic.unit_id || 0]
  );

  // Fetch university Previous Year Questions (PYQs)
  const pyqs = queryAll<any>(
    `SELECT * FROM pyq_records WHERE topic_id = ? ORDER BY year DESC`,
    [topic.id]
  );

  // Legacy lessons & quizzes support
  const lessons = queryAll<any>(
    `SELECT id, topic_id, title, slug, content_type, estimated_minutes, order_index
     FROM lessons
     WHERE topic_id = ?
     ORDER BY order_index ASC, id ASC`,
    [topic.id]
  );

  const quizzes = queryAll<any>(
    `SELECT q.*, COUNT(qq.question_id) as total_questions
     FROM quizzes q
     LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
     WHERE q.topic_id = ?
     GROUP BY q.id
     ORDER BY q.id ASC`,
    [topic.id]
  );

  const resources = queryAll<any>(
    `SELECT * FROM resources WHERE topic_id = ? ORDER BY id ASC`,
    [topic.id]
  );

  const dsaProblems = queryAll<any>(
    `SELECT id, topic_id, title, slug, difficulty, time_complexity, space_complexity
     FROM dsa_problems
     WHERE topic_id = ?
     ORDER BY id ASC`,
    [topic.id]
  );

  // User performance & completion state
  let userPerformance = null;
  let topicProgress = null;

  if (userId) {
    userPerformance = queryOne<any>(
      `SELECT * FROM topic_performance WHERE user_id = ? AND topic_id = ?`,
      [userId, topic.id]
    );

    topicProgress = queryOne<any>(
      `SELECT * FROM topic_progress WHERE user_id = ? AND topic_id = ?`,
      [userId, topic.id]
    );
  }

  res.json({
    success: true,
    topic: {
      ...topic,
      learningMaterial: parsedMaterial,
      assessments,
      pyqs,
      lessons,
      quizzes,
      resources,
      dsaProblems,
      userPerformance,
      isCompleted: topicProgress?.status === 'completed',
    },
  });
});

// Get content notes specifically
router.get('/:id/content', (req: Request, res: Response): void => {
  const { id } = req.params;

  const topic = queryOne<any>(
    `SELECT t.id, t.name, t.slug, t.subject_id, t.unit_id,
            s.name as subject_name, u.title as unit_title, u.unit_number
     FROM topics t
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN units u ON t.unit_id = u.id
     WHERE t.id = ? OR t.slug = ?`,
    [id, id]
  );

  if (!topic) {
    res.status(404).json({ success: false, message: 'Topic not found.' });
    return;
  }

  const material = queryOne<any>(
    `SELECT * FROM learning_materials WHERE topic_id = ?`,
    [topic.id]
  );

  let parsedExamples = [];
  if (material?.examples_json) {
    try {
      parsedExamples = JSON.parse(material.examples_json);
    } catch {
      parsedExamples = [];
    }
  }

  res.json({
    success: true,
    topic,
    content: material ? { ...material, examples: parsedExamples } : null,
  });
});

// Mark topic as completed
router.post('/:id/complete', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const { id } = req.params;

  const topic = queryOne<any>(
    `SELECT id, unit_id, subject_id FROM topics WHERE id = ? OR slug = ?`,
    [id, id]
  );

  if (!topic) {
    res.status(404).json({ success: false, message: 'Topic not found.' });
    return;
  }

  // Update or insert topic_progress
  run(
    `INSERT INTO topic_progress (user_id, topic_id, status, completed_at)
     VALUES (?, ?, 'completed', CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, topic_id) DO UPDATE SET
       status = 'completed',
       completed_at = CURRENT_TIMESTAMP`,
    [userId, topic.id]
  );

  // Recalculate unit progress
  if (topic.unit_id) {
    const totalTopicsInUnit = queryOne<any>(
      `SELECT COUNT(*) as count FROM topics WHERE unit_id = ?`,
      [topic.unit_id]
    )?.count || 1;

    const completedTopicsInUnit = queryOne<any>(
      `SELECT COUNT(*) as count FROM topic_progress tp
       JOIN topics t ON tp.topic_id = t.id
       WHERE t.unit_id = ? AND tp.user_id = ? AND tp.status = 'completed'`,
      [topic.unit_id, userId]
    )?.count || 0;

    run(
      `INSERT INTO unit_performance (
        user_id, unit_id, subject_id, completed_topics_count, total_topics_count, last_updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, unit_id) DO UPDATE SET
        completed_topics_count = ?,
        total_topics_count = ?,
        last_updated_at = CURRENT_TIMESTAMP`,
      [
        userId, topic.unit_id, topic.subject_id, completedTopicsInUnit, totalTopicsInUnit,
        completedTopicsInUnit, totalTopicsInUnit
      ]
    );
  }

  // Recalculate subject progress percentage
  const totalTopicsInSubject = queryOne<any>(
    `SELECT COUNT(*) as count FROM topics WHERE subject_id = ?`,
    [topic.subject_id]
  )?.count || 1;

  const completedTopicsInSubject = queryOne<any>(
    `SELECT COUNT(*) as count FROM topic_progress tp
     JOIN topics t ON tp.topic_id = t.id
     WHERE t.subject_id = ? AND tp.user_id = ? AND tp.status = 'completed'`,
    [topic.subject_id, userId]
  )?.count || 0;

  const progressPercentage = Math.round((completedTopicsInSubject / totalTopicsInSubject) * 100);

  run(
    `INSERT INTO subject_performance (
      user_id, subject_id, progress_percentage, last_updated_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, subject_id) DO UPDATE SET
      progress_percentage = ?,
      last_updated_at = CURRENT_TIMESTAMP`,
    [userId, topic.subject_id, progressPercentage, progressPercentage]
  );

  res.json({
    success: true,
    message: 'Topic marked as completed.',
    progress: {
      topicId: topic.id,
      completed: true,
      subjectProgressPercentage: progressPercentage,
    },
  });
});

export default router;
