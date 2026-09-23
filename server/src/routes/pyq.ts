import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../db/index.js';

const router = Router();

// 1. Get filtered list of Previous Year Questions
router.get('/', (req: Request, res: Response): void => {
  try {
    const { university, year, subjectId, unitId, topicId, difficulty } = req.query;

    let sql = `
      SELECT p.*,
             s.name as subject_name, s.code as subject_code,
             u.title as unit_title, u.unit_number,
             t.name as topic_name
      FROM pyq_records p
      JOIN subjects s ON p.subject_id = s.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN topics t ON p.topic_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (university && typeof university === 'string' && university !== 'All') {
      sql += ' AND p.university = ?';
      params.push(university);
    }
    if (year && typeof year === 'string' && year !== 'All') {
      sql += ' AND p.year = ?';
      params.push(Number(year));
    }
    if (subjectId) {
      sql += ' AND p.subject_id = ?';
      params.push(subjectId);
    }
    if (unitId) {
      sql += ' AND p.unit_id = ?';
      params.push(unitId);
    }
    if (topicId) {
      sql += ' AND p.topic_id = ?';
      params.push(topicId);
    }
    if (difficulty && typeof difficulty === 'string' && difficulty !== 'All') {
      sql += ' AND p.difficulty = ?';
      params.push(difficulty);
    }

    sql += ' ORDER BY p.year DESC, p.id ASC';

    const pyqs = queryAll<any>(sql, params);
    res.json({ success: true, count: pyqs.length, pyqs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get distinct filter options for PYQ Explorer
router.get('/filters', (req: Request, res: Response): void => {
  try {
    const universities = queryAll<{ university: string }>(
      `SELECT DISTINCT university FROM pyq_records ORDER BY university ASC`
    );
    const years = queryAll<{ year: number }>(
      `SELECT DISTINCT year FROM pyq_records ORDER BY year DESC`
    );
    const subjects = queryAll<any>(
      `SELECT DISTINCT s.id, s.name, s.code FROM pyq_records p JOIN subjects s ON p.subject_id = s.id ORDER BY s.name ASC`
    );

    res.json({
      success: true,
      filters: {
        universities: universities.map((u) => u.university),
        years: years.map((y) => y.year),
        subjects,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get single PYQ by ID
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const pyq = queryOne<any>(
      `SELECT p.*,
              s.name as subject_name, s.code as subject_code,
              u.title as unit_title, u.unit_number,
              t.name as topic_name
       FROM pyq_records p
       JOIN subjects s ON p.subject_id = s.id
       LEFT JOIN units u ON p.unit_id = u.id
       LEFT JOIN topics t ON p.topic_id = t.id
       WHERE p.id = ?`,
      [id]
    );

    if (!pyq) {
      res.status(404).json({ success: false, message: 'PYQ not found.' });
      return;
    }

    res.json({ success: true, pyq });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
