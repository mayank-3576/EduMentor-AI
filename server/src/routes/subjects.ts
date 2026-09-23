import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne } from '../db/index.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// Helper to extract user ID if Authorization header is present
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

// Get all subjects (filterable by branchId & semesterId)
router.get('/', (req: Request, res: Response): void => {
  const { category, branchId, semesterId, degreeId } = req.query;
  const userId = getOptionalUserId(req);

  let sql = `
    SELECT 
      s.*,
      (SELECT COUNT(*) FROM units u WHERE u.subject_id = s.id) as unit_count,
      (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id) as topic_count,
      (SELECT COUNT(*) FROM assessments a WHERE a.subject_id = s.id) as assessment_count,
      (SELECT COUNT(*) FROM pyq_records p WHERE p.subject_id = s.id) as pyq_count
  `;

  if (userId) {
    sql += `,
      COALESCE((SELECT sp.average_score FROM subject_performance sp WHERE sp.subject_id = s.id AND sp.user_id = ${userId}), 0) as user_average_score,
      COALESCE((SELECT sp.progress_percentage FROM subject_performance sp WHERE sp.subject_id = s.id AND sp.user_id = ${userId}), 0) as user_progress,
      COALESCE((SELECT sp.diagnostic_completed FROM subject_performance sp WHERE sp.subject_id = s.id AND sp.user_id = ${userId}), 0) as diagnostic_completed
    `;
  }

  sql += ` FROM subjects s`;
  const params: any[] = [];
  const whereClauses: string[] = ['s.is_active = 1'];

  if (branchId && semesterId) {
    sql += ` JOIN curriculum_mappings cm ON s.id = cm.subject_id`;
    whereClauses.push('cm.branch_id = ? AND cm.semester_id = ?');
    params.push(branchId, semesterId);

    if (degreeId) {
      whereClauses.push('cm.degree_id = ?');
      params.push(degreeId);
    }
  }

  if (category && typeof category === 'string' && category !== 'All') {
    whereClauses.push('s.category = ?');
    params.push(category);
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ` + whereClauses.join(' AND ');
  }

  sql += ` ORDER BY s.order_index ASC, s.name ASC`;

  const subjects = queryAll<any>(sql, params);
  res.json({ success: true, count: subjects.length, subjects });
});

// Get distinct categories
router.get('/categories', (req: Request, res: Response): void => {
  const categories = queryAll<{ category: string }>(
    `SELECT DISTINCT category FROM subjects WHERE is_active = 1 ORDER BY category ASC`
  );
  res.json({ success: true, categories: categories.map(c => c.category) });
});

// Get single subject with its Units I-V, Topics, Assessments, and User Progress
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = getOptionalUserId(req);

  const subject = queryOne<any>(
    `SELECT * FROM subjects WHERE id = ? OR slug = ?`,
    [id, id]
  );

  if (!subject) {
    res.status(404).json({ success: false, message: 'Subject not found.' });
    return;
  }

  // Fetch Units (Units I through V)
  const units = queryAll<any>(
    `SELECT u.*,
            (SELECT COUNT(*) FROM topics t WHERE t.unit_id = u.id) as topic_count,
            (SELECT COUNT(*) FROM assessments a WHERE a.unit_id = u.id) as assessment_count,
            (SELECT COUNT(*) FROM pyq_records p WHERE p.unit_id = u.id) as pyq_count
     FROM units u
     WHERE u.subject_id = ?
     ORDER BY u.unit_number ASC`,
    [subject.id]
  );

  // Fetch all topics for this subject
  let topicSql = `
    SELECT t.*,
           (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id) as question_count,
           (SELECT COUNT(*) FROM pyq_records p WHERE p.topic_id = t.id) as pyq_count,
           (SELECT COUNT(*) FROM dsa_problems dp WHERE dp.topic_id = t.id) as dsa_problem_count
  `;

  if (userId) {
    topicSql += `,
      COALESCE((SELECT tp.status FROM topic_progress tp WHERE tp.topic_id = t.id AND tp.user_id = ${userId}), 'not_started') as user_status,
      COALESCE((SELECT tperf.average_score FROM topic_performance tperf WHERE tperf.topic_id = t.id AND tperf.user_id = ${userId}), 0) as user_score,
      COALESCE((SELECT tperf.mastery_level FROM topic_performance tperf WHERE tperf.topic_id = t.id AND tperf.user_id = ${userId}), 'needs_improvement') as user_mastery
    `;
  }

  topicSql += ` FROM topics t WHERE t.subject_id = ? ORDER BY t.unit_id ASC, t.order_index ASC`;
  const allTopics = queryAll<any>(topicSql, [subject.id]);

  // Attach topics to their corresponding units
  const unitsWithTopics = units.map((unit) => {
    const unitTopics = allTopics.filter((t) => t.unit_id === unit.id);
    let unitPerf = null;
    if (userId) {
      unitPerf = queryOne<any>(
        `SELECT * FROM unit_performance WHERE unit_id = ? AND user_id = ?`,
        [unit.id, userId]
      );
    }
    return {
      ...unit,
      topics: unitTopics,
      performance: unitPerf || {
        average_score: 0,
        tests_attempted: 0,
        mastery_level: 'needs_improvement',
      },
    };
  });

  // Fetch Assessments for this subject (Diagnostic, Unit, Subject, Mock)
  const assessments = queryAll<any>(
    `SELECT a.*,
            u.title as unit_title,
            u.unit_number,
            (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id) as question_count
     FROM assessments a
     LEFT JOIN units u ON a.unit_id = u.id
     WHERE a.subject_id = ?
     ORDER BY 
       CASE a.test_type
         WHEN 'diagnostic_test' THEN 1
         WHEN 'unit_test' THEN 2
         WHEN 'subject_test' THEN 3
         WHEN 'mock_test' THEN 4
         ELSE 5
       END, a.id ASC`,
    [subject.id]
  );

  // User Subject Performance
  let subjectPerformance = null;
  if (userId) {
    subjectPerformance = queryOne<any>(
      `SELECT * FROM subject_performance WHERE subject_id = ? AND user_id = ?`,
      [subject.id, userId]
    );
  }

  // Previous Year Questions count by unit
  const pyqSummary = queryAll<any>(
    `SELECT u.unit_number, COUNT(p.id) as pyq_count
     FROM units u
     LEFT JOIN pyq_records p ON u.id = p.unit_id
     WHERE u.subject_id = ?
     GROUP BY u.unit_number
     ORDER BY u.unit_number ASC`,
    [subject.id]
  );

  res.json({
    success: true,
    subject: {
      ...subject,
      units: unitsWithTopics,
      topics: allTopics,
      assessments,
      performance: subjectPerformance || {
        average_score: 0,
        progress_percentage: 0,
        diagnostic_completed: 0,
      },
      pyqSummary,
    },
  });
});

export default router;
