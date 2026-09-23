import { Router, Response } from 'express';
import { run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { explainableAIEngine } from '../services/explainableAI.js';

const router = Router();

// Get active recommendations for current user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const recommendations = await explainableAIEngine.getRecommendationsForUser(userId);
    res.json({ success: true, count: recommendations.length, recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dismiss recommendation
router.post('/:id/dismiss', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.id;

  run(
    `UPDATE recommendations SET status = 'dismissed' WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true, message: 'Recommendation dismissed.' });
});

// Mark recommendation completed
router.post('/:id/complete', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const userId = req.user!.id;

  run(
    `UPDATE recommendations SET status = 'completed' WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  res.json({ success: true, message: 'Recommendation completed.' });
});

// Generate direct recommendation for a specific topic
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { topicId, manualReason } = req.body;

    if (!topicId) {
      res.status(400).json({ success: false, message: 'topicId is required.' });
      return;
    }

    const rec = await explainableAIEngine.generateDirectRecommendation(userId, Number(topicId), manualReason);
    res.json({ success: true, message: 'Recommendation synthesized.', recommendation: rec });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
