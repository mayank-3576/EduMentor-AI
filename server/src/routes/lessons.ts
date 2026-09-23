import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// Get single lesson details with content
router.get('/:id', (req, res): void => {
  const { id } = req.params;

  const lesson = queryOne<any>(
    `SELECT l.*, t.name as topic_name, t.slug as topic_slug, s.name as subject_name, s.slug as subject_slug
     FROM lessons l
     JOIN topics t ON l.topic_id = t.id
     JOIN subjects s ON t.subject_id = s.id
     WHERE l.id = ? OR l.slug = ?`,
    [id, id]
  );

  if (!lesson) {
    res.status(404).json({ success: false, message: 'Lesson not found.' });
    return;
  }

  // Check user progress if token present
  let isCompleted = false;
  let progressPercentage = 0;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        const prog = queryOne<any>(
          `SELECT status, progress_percentage FROM learning_progress WHERE user_id = ? AND lesson_id = ?`,
          [decoded.id, lesson.id]
        );
        if (prog) {
          isCompleted = prog.status === 'completed';
          progressPercentage = prog.progress_percentage;
        }
      }
    } catch {
      // Ignore token decode errors for public route
    }
  }

  // Find next and previous lesson in this topic
  const nextLesson = queryOne<any>(
    `SELECT id, title, slug FROM lessons WHERE topic_id = ? AND order_index > ? ORDER BY order_index ASC LIMIT 1`,
    [lesson.topic_id, lesson.order_index]
  );
  const prevLesson = queryOne<any>(
    `SELECT id, title, slug FROM lessons WHERE topic_id = ? AND order_index < ? ORDER BY order_index DESC LIMIT 1`,
    [lesson.topic_id, lesson.order_index]
  );

  res.json({
    success: true,
    lesson: {
      ...lesson,
      isCompleted,
      progressPercentage,
      nextLesson,
      prevLesson,
    },
  });
});

// Update progress or mark lesson completed
router.post('/:id/complete', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.id;

  const lesson = queryOne<any>('SELECT * FROM lessons WHERE id = ?', [id]);
  if (!lesson) {
    res.status(404).json({ success: false, message: 'Lesson not found.' });
    return;
  }

  const existing = queryOne<any>(
    `SELECT id FROM learning_progress WHERE user_id = ? AND lesson_id = ?`,
    [userId, lesson.id]
  );

  if (existing) {
    run(
      `UPDATE learning_progress 
       SET status = 'completed', progress_percentage = 100.0, last_accessed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [existing.id]
    );
  } else {
    run(
      `INSERT INTO learning_progress (user_id, lesson_id, topic_id, status, progress_percentage)
       VALUES (?, ?, ?, 'completed', 100.0)`,
      [userId, lesson.id, lesson.topic_id]
    );
  }

  // Increment student's study time by estimated minutes
  run(
    `UPDATE student_profiles 
     SET total_study_minutes = total_study_minutes + ? 
     WHERE user_id = ?`,
    [lesson.estimated_minutes || 15, userId]
  );

  res.json({ success: true, message: 'Lesson marked as completed.' });
});

export default router;
