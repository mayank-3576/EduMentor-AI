import { Router, Request, Response } from 'express';
import { queryAll } from '../db/index.js';
import { Resource } from '../types/index.js';

const router = Router();

// List resources with filters
router.get('/', (req: Request, res: Response): void => {
  const { subjectId, topicId, type, difficulty } = req.query;

  let sql = `
    SELECT 
      r.*,
      s.name as subject_name,
      s.slug as subject_slug,
      t.name as topic_name,
      t.slug as topic_slug
    FROM resources r
    JOIN subjects s ON r.subject_id = s.id
    JOIN topics t ON r.topic_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (subjectId) {
    sql += ` AND r.subject_id = ?`;
    params.push(subjectId);
  }
  if (topicId) {
    sql += ` AND r.topic_id = ?`;
    params.push(topicId);
  }
  if (type) {
    sql += ` AND r.type = ?`;
    params.push(type);
  }
  if (difficulty) {
    sql += ` AND r.difficulty = ?`;
    params.push(difficulty);
  }

  sql += ` ORDER BY r.id ASC`;

  const resources = queryAll<Resource>(sql, params);
  res.json({ success: true, count: resources.length, resources });
});

export default router;
