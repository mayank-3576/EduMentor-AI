import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { codeRunnerService } from '../services/codeRunnerService.js';
import { DSAProblem } from '../types/index.js';

const router = Router();

// Get list of DSA topics with problem counts
router.get('/topics', (req, res): void => {
  const topics = queryAll<any>(
    `SELECT t.id, t.name, t.slug, t.description, COUNT(dp.id) as total_problems
     FROM topics t
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN dsa_problems dp ON t.id = dp.topic_id
     WHERE s.slug = 'data-structures-algorithms' OR s.category = 'Data Structures & Algorithms'
     GROUP BY t.id
     HAVING total_problems > 0
     ORDER BY t.order_index ASC`
  );

  res.json({ success: true, count: topics.length, topics });
});

// List DSA problems with filters and solved status
router.get('/problems', (req, res): void => {
  const { topicId, difficulty, search } = req.query;

  let sql = `
    SELECT 
      dp.id, dp.topic_id, dp.title, dp.slug, dp.difficulty, dp.time_complexity, dp.space_complexity,
      t.name as topic_name, t.slug as topic_slug
    FROM dsa_problems dp
    JOIN topics t ON dp.topic_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (topicId) {
    sql += ` AND dp.topic_id = ?`;
    params.push(topicId);
  }
  if (difficulty) {
    sql += ` AND dp.difficulty = ?`;
    params.push(difficulty);
  }
  if (search) {
    sql += ` AND (dp.title LIKE ? OR dp.problem_statement LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY dp.id ASC`;

  const problems = queryAll<any>(sql, params);

  // Check solved status if user token exists
  let solvedProblemIds = new Set<number>();
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        const solved = queryAll<any>(
          `SELECT DISTINCT problem_id FROM coding_submissions WHERE user_id = ? AND status = 'Accepted'`,
          [decoded.id]
        );
        solvedProblemIds = new Set(solved.map((s) => s.problem_id));
      }
    } catch {
      // Ignore token decode error
    }
  }

  const enriched = problems.map((p) => ({
    ...p,
    isSolved: solvedProblemIds.has(p.id),
  }));

  res.json({ success: true, count: enriched.length, problems: enriched });
});

// Get single problem by ID or slug
router.get('/problems/:id', (req, res): void => {
  const { id } = req.params;

  const problem = queryOne<any>(
    `SELECT dp.*, t.name as topic_name, t.slug as topic_slug, s.name as subject_name
     FROM dsa_problems dp
     JOIN topics t ON dp.topic_id = t.id
     JOIN subjects s ON t.subject_id = s.id
     WHERE dp.id = ? OR dp.slug = ?`,
    [id, id]
  );

  if (!problem) {
    res.status(404).json({ success: false, message: 'Problem not found.' });
    return;
  }

  // Parse JSON fields safely
  let sampleCases = [];
  let starterCode = {};
  try {
    sampleCases = JSON.parse(problem.sample_cases_json || '[]');
    starterCode = JSON.parse(problem.starter_code_json || '{}');
  } catch (e) {
    console.error('JSON parse error in problem:', e);
  }

  // User solved status
  let isSolved = false;
  let lastSubmission = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        const sub = queryOne<any>(
          `SELECT * FROM coding_submissions WHERE user_id = ? AND problem_id = ? ORDER BY submitted_at DESC LIMIT 1`,
          [decoded.id, problem.id]
        );
        if (sub) {
          isSolved = sub.status === 'Accepted';
          lastSubmission = sub;
        }
      }
    } catch {
      // Ignore
    }
  }

  res.json({
    success: true,
    problem: {
      ...problem,
      sampleCases,
      starterCode,
      isSolved,
      lastSubmission,
    },
  });
});

// Run Code against sample test cases
router.post('/run-code', async (req, res): Promise<void> => {
  try {
    const { problemId, language, code, customInput } = req.body;

    if (!problemId || !code) {
      res.status(400).json({ success: false, message: 'problemId and code are required.' });
      return;
    }

    const problem = queryOne<any>('SELECT * FROM dsa_problems WHERE id = ?', [problemId]);
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found.' });
      return;
    }

    const sampleCases = JSON.parse(problem.sample_cases_json || '[]');
    const testCasesToRun = customInput
      ? [{ input: customInput, output: sampleCases[0]?.output || '' }]
      : sampleCases.map((sc: any) => ({ input: sc.input, output: sc.output }));

    const runResult = await codeRunnerService.runCode({
      problemId: problem.id,
      language: language || 'javascript',
      code,
      testCases: testCasesToRun,
    });

    res.json({ success: true, result: runResult });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit Code
router.post('/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { problemId, language, code } = req.body;

    if (!problemId || !code) {
      res.status(400).json({ success: false, message: 'problemId and code are required.' });
      return;
    }

    const problem = queryOne<any>('SELECT * FROM dsa_problems WHERE id = ?', [problemId]);
    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found.' });
      return;
    }

    const sampleCases = JSON.parse(problem.sample_cases_json || '[]');
    const runResult = await codeRunnerService.runCode({
      problemId: problem.id,
      language: language || 'javascript',
      code,
      testCases: sampleCases.map((sc: any) => ({ input: sc.input, output: sc.output })),
    });

    // Record submission
    const subResult = run(
      `INSERT INTO coding_submissions (user_id, problem_id, language, code, status, test_cases_passed, total_test_cases, execution_time_ms, memory_kb)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        problem.id,
        language || 'javascript',
        code,
        runResult.status,
        runResult.testCasesPassed,
        runResult.totalTestCases,
        runResult.runtimeMs,
        runResult.memoryKb,
      ]
    );

    // If solved and it's student's first solve, award study streak / minutes
    if (runResult.status === 'Accepted') {
      run(
        `UPDATE student_profiles 
         SET total_study_minutes = total_study_minutes + 20 
         WHERE user_id = ?`,
        [userId]
      );
    }

    res.json({
      success: true,
      submissionId: subResult.lastInsertRowid,
      status: runResult.status,
      result: runResult,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
