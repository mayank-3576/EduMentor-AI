import { Router, Request, Response } from 'express';
import { queryAll } from '../db/index.js';

const router = Router();

// Global Multi-Entity Search
router.get('/', (req: Request, res: Response): void => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : '';
  const contentType = typeof req.query.contentType === 'string' ? req.query.contentType.trim() : '';

  if (!q && !category && !difficulty && !contentType) {
    res.json({
      success: true,
      query: '',
      results: {
        subjects: [],
        topics: [],
        lessons: [],
        quizzes: [],
        dsaProblems: [],
        resources: [],
      },
      totalMatches: 0,
    });
    return;
  }

  const searchPattern = `%${q}%`;

  // 1. Subjects
  const subjects = (!contentType || contentType === 'subject') ? queryAll(
    `SELECT id, name, slug, category, description, icon, color_accent
     FROM subjects
     WHERE (name LIKE ? OR description LIKE ? OR category LIKE ?)
       ${category ? 'AND category = ?' : ''}
     LIMIT 8`,
    category ? [searchPattern, searchPattern, searchPattern, category] : [searchPattern, searchPattern, searchPattern]
  ) : [];

  // 2. Topics
  const topics = (!contentType || contentType === 'topic') ? queryAll(
    `SELECT t.id, t.name, t.slug, t.description, t.difficulty_level, s.name as subject_name, s.slug as subject_slug
     FROM topics t
     JOIN subjects s ON t.subject_id = s.id
     WHERE (t.name LIKE ? OR t.description LIKE ?)
       ${difficulty ? 'AND t.difficulty_level = ?' : ''}
       ${category ? 'AND s.category = ?' : ''}
     LIMIT 8`,
    [
      searchPattern, searchPattern,
      ...(difficulty ? [difficulty] : []),
      ...(category ? [category] : []),
    ]
  ) : [];

  // 3. Lessons
  const lessons = (!contentType || contentType === 'lesson') ? queryAll(
    `SELECT l.id, l.title, l.slug, l.estimated_minutes, t.name as topic_name, t.slug as topic_slug, s.name as subject_name
     FROM lessons l
     JOIN topics t ON l.topic_id = t.id
     JOIN subjects s ON t.subject_id = s.id
     WHERE (l.title LIKE ? OR l.content_markdown LIKE ?)
       ${category ? 'AND s.category = ?' : ''}
     LIMIT 8`,
    category ? [searchPattern, searchPattern, category] : [searchPattern, searchPattern]
  ) : [];

  // 4. Quizzes
  const quizzes = (!contentType || contentType === 'quiz') ? queryAll(
    `SELECT q.id, q.title, q.description, q.difficulty, q.time_limit_minutes, t.name as topic_name, s.name as subject_name
     FROM quizzes q
     JOIN topics t ON q.topic_id = t.id
     JOIN subjects s ON q.subject_id = s.id
     WHERE (q.title LIKE ? OR q.description LIKE ?)
       ${difficulty ? 'AND q.difficulty = ?' : ''}
       ${category ? 'AND s.category = ?' : ''}
     LIMIT 8`,
    [
      searchPattern, searchPattern,
      ...(difficulty ? [difficulty] : []),
      ...(category ? [category] : []),
    ]
  ) : [];

  // 5. DSA Problems
  const dsaProblems = (!contentType || contentType === 'dsa') ? queryAll(
    `SELECT dp.id, dp.title, dp.slug, dp.difficulty, dp.time_complexity, t.name as topic_name
     FROM dsa_problems dp
     JOIN topics t ON dp.topic_id = t.id
     WHERE (dp.title LIKE ? OR dp.problem_statement LIKE ?)
       ${difficulty ? 'AND dp.difficulty = ?' : ''}
     LIMIT 8`,
    difficulty ? [searchPattern, searchPattern, difficulty] : [searchPattern, searchPattern]
  ) : [];

  // 6. Resources
  const resources = (!contentType || contentType === 'resource') ? queryAll(
    `SELECT r.id, r.title, r.type, r.url, r.difficulty, t.name as topic_name, s.name as subject_name
     FROM resources r
     JOIN topics t ON r.topic_id = t.id
     JOIN subjects s ON r.subject_id = s.id
     WHERE (r.title LIKE ? OR r.description LIKE ?)
       ${difficulty ? 'AND r.difficulty = ?' : ''}
     LIMIT 8`,
    difficulty ? [searchPattern, searchPattern, difficulty] : [searchPattern, searchPattern]
  ) : [];

  const totalMatches =
    subjects.length +
    topics.length +
    lessons.length +
    quizzes.length +
    dsaProblems.length +
    resources.length;

  res.json({
    success: true,
    query: q,
    filters: { category, difficulty, contentType },
    totalMatches,
    results: {
      subjects,
      topics,
      lessons,
      quizzes,
      dsaProblems,
      resources,
    },
  });
});

export default router;
