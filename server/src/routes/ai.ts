import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { externalAIAdapter } from '../services/externalAIAdapter.js';

const router = Router();

// Concept tutoring doubt resolver
router.post('/explain', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { topicName, subjectName, studentDoubt, currentMasteryScore } = req.body;

    if (!topicName || !studentDoubt) {
      res.status(400).json({ success: false, message: 'topicName and studentDoubt are required.' });
      return;
    }

    const explanation = await externalAIAdapter.explainConcept({
      topicName,
      subjectName: subjectName || 'Computer Science',
      studentDoubt,
      currentMasteryScore,
    });

    res.json({
      success: true,
      ...explanation,
      isExternalConfigured: externalAIAdapter.isExternalAPIConfigured(),
      provider: externalAIAdapter.getProviderName(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Adapter status endpoint
router.get('/status', (req, res): void => {
  res.json({
    success: true,
    isConfigured: externalAIAdapter.isExternalAPIConfigured(),
    provider: externalAIAdapter.getProviderName(),
    features: [
      'Adaptive Explainable AI Diagnostic Rule Engine (Active & Verified)',
      'Deterministic Pedagogical Doubts Explainer (Active & Verified)',
      'Pluggable LLM Adapter (OpenAI / Gemini Compatible - Configurable via .env)',
      'Pluggable Sandbox Code Runner (Judge0 / Piston Compatible - Configurable via .env)',
    ],
  });
});

export default router;
