import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne } from '../db/index.js';
import { JWT_SECRET } from '../middleware/auth.js';

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

// Get unit by ID with topics, unit tests, PYQs, and student performance
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = getOptionalUserId(req);

    const unit = queryOne<any>(
      `SELECT u.*, s.name as subject_name, s.code as subject_code, s.slug as subject_slug
       FROM units u
       JOIN subjects s ON u.subject_id = s.id
       WHERE u.id = ?`,
      [id]
    );

    if (!unit) {
      res.status(404).json({ success: false, message: 'Unit not found.' });
      return;
    }

    // Topics in this unit
    let topicSql = `
      SELECT t.*,
             (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count,
             (SELECT COUNT(*) FROM pyq_records p WHERE p.topic_id = t.id) as pyq_count
    `;
    if (userId) {
      topicSql += `,
        COALESCE((SELECT tp.status FROM topic_progress tp WHERE tp.topic_id = t.id AND tp.user_id = ${userId}), 'not_started') as user_status,
        COALESCE((SELECT tperf.average_score FROM topic_performance tperf WHERE tperf.topic_id = t.id AND tperf.user_id = ${userId}), 0) as user_score,
        COALESCE((SELECT tperf.mastery_level FROM topic_performance tperf WHERE tperf.topic_id = t.id AND tperf.user_id = ${userId}), 'needs_improvement') as user_mastery
      `;
    }
    topicSql += ` FROM topics t WHERE t.unit_id = ? ORDER BY t.order_index ASC`;
    const topics = queryAll<any>(topicSql, [unit.id]);

    // Unit Assessments (e.g. Unit Test)
    const assessments = queryAll<any>(
      `SELECT a.*,
              (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id) as question_count
       FROM assessments a
       WHERE a.unit_id = ?
       ORDER BY a.id ASC`,
      [unit.id]
    );

    // PYQs for this unit
    const pyqs = queryAll<any>(
      `SELECT p.*, t.name as topic_name
       FROM pyq_records p
       LEFT JOIN topics t ON p.topic_id = t.id
       WHERE p.unit_id = ?
       ORDER BY p.year DESC`,
      [unit.id]
    );

    // Unit Performance
    let performance = null;
    if (userId) {
      performance = queryOne<any>(
        `SELECT * FROM unit_performance WHERE unit_id = ? AND user_id = ?`,
        [unit.id, userId]
      );
    }

    res.json({
      success: true,
      unit: {
        ...unit,
        topics,
        assessments,
        pyqs,
        performance: performance || {
          average_score: 0,
          tests_attempted: 0,
          mastery_level: 'needs_improvement',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get topics for a unit
router.get('/:id/topics', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const topics = queryAll<any>(
      `SELECT * FROM topics WHERE unit_id = ? ORDER BY order_index ASC`,
      [id]
    );
    res.json({ success: true, topics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
