import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { LearningPath } from '../types/index.js';

const router = Router();

// List all learning paths with user's progress
router.get('/', (req, res): void => {
  let userId: number | null = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded) userId = decoded.id;
    } catch {
      // Ignore
    }
  }

  const paths = queryAll<any>(
    `SELECT lp.*, COUNT(lps.id) as total_steps
     FROM learning_paths lp
     LEFT JOIN learning_path_steps lps ON lp.id = lps.path_id
     GROUP BY lp.id
     ORDER BY lp.id ASC`
  );

  const pathsWithProgress = paths.map((path) => {
    let progressPercentage = 0;
    if (userId) {
      const userProg = queryOne<any>(
        `SELECT percentage FROM user_path_progress WHERE user_id = ? AND path_id = ?`,
        [userId, path.id]
      );
      if (userProg) progressPercentage = userProg.percentage;
    }
    return {
      ...path,
      progressPercentage,
    };
  });

  res.json({ success: true, count: pathsWithProgress.length, paths: pathsWithProgress });
});

// Get single learning path with steps
router.get('/:id', (req, res): void => {
  const { id } = req.params;

  const path = queryOne<any>(
    `SELECT * FROM learning_paths WHERE id = ? OR slug = ?`,
    [id, id]
  );

  if (!path) {
    res.status(404).json({ success: false, message: 'Learning path not found.' });
    return;
  }

  const steps = queryAll<any>(
    `SELECT 
       lps.*, 
       s.name as subject_name, s.slug as subject_slug, s.color_accent,
       t.name as topic_name, t.slug as topic_slug, t.description as topic_description
     FROM learning_path_steps lps
     JOIN subjects s ON lps.subject_id = s.id
     JOIN topics t ON lps.topic_id = t.id
     WHERE lps.path_id = ?
     ORDER BY lps.order_index ASC`,
    [path.id]
  );

  // Check user completed steps
  let completedStepIds: number[] = [];
  let userProgress = 0;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        const prog = queryOne<any>(
          `SELECT completed_steps_json, percentage FROM user_path_progress WHERE user_id = ? AND path_id = ?`,
          [decoded.id, path.id]
        );
        if (prog) {
          completedStepIds = JSON.parse(prog.completed_steps_json || '[]');
          userProgress = prog.percentage;
        }
      }
    } catch {
      // Ignore
    }
  }

  const stepsWithStatus = steps.map((s) => ({
    ...s,
    isCompleted: completedStepIds.includes(s.id),
  }));

  res.json({
    success: true,
    path: {
      ...path,
      steps: stepsWithStatus,
      progressPercentage: userProgress,
    },
  });
});

// Toggle step completion for current user
router.post('/:id/steps/:stepId/toggle', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { id, stepId } = req.params;
  const userId = req.user!.id;

  const path = queryOne<any>('SELECT id FROM learning_paths WHERE id = ? OR slug = ?', [id, id]);
  if (!path) {
    res.status(404).json({ success: false, message: 'Learning path not found.' });
    return;
  }

  const step = queryOne<any>('SELECT id FROM learning_path_steps WHERE id = ? AND path_id = ?', [stepId, path.id]);
  if (!step) {
    res.status(404).json({ success: false, message: 'Step not found.' });
    return;
  }

  const totalSteps = queryOne<any>(
    `SELECT COUNT(*) as count FROM learning_path_steps WHERE path_id = ?`,
    [path.id]
  )?.count || 1;

  let existing = queryOne<any>(
    `SELECT * FROM user_path_progress WHERE user_id = ? AND path_id = ?`,
    [userId, path.id]
  );

  let completedSteps: number[] = [];
  if (existing) {
    completedSteps = JSON.parse(existing.completed_steps_json || '[]');
  }

  if (completedSteps.includes(step.id)) {
    completedSteps = completedSteps.filter((s) => s !== step.id);
  } else {
    completedSteps.push(step.id);
  }

  const percentage = Math.round((completedSteps.length / totalSteps) * 100);

  if (existing) {
    run(
      `UPDATE user_path_progress 
       SET completed_steps_json = ?, percentage = ?, last_updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [JSON.stringify(completedSteps), percentage, existing.id]
    );
  } else {
    run(
      `INSERT INTO user_path_progress (user_id, path_id, completed_steps_json, percentage)
       VALUES (?, ?, ?, ?)`,
      [userId, path.id, JSON.stringify(completedSteps), percentage]
    );
  }

  res.json({
    success: true,
    message: 'Progress updated.',
    completedSteps,
    percentage,
  });
});

export default router;
