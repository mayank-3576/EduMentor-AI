import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// Guard all admin routes
router.use(authenticateToken, requireRole('admin'));

// Platform-wide Analytics
router.get('/analytics', (req: AuthenticatedRequest, res: Response): void => {
  const totalUsers = queryOne<any>(`SELECT COUNT(*) as count FROM users`)?.count || 0;
  const totalStudents = queryOne<any>(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`)?.count || 0;
  const totalTeachers = queryOne<any>(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`)?.count || 0;
  const totalSubjects = queryOne<any>(`SELECT COUNT(*) as count FROM subjects`)?.count || 0;
  const totalUnits = queryOne<any>(`SELECT COUNT(*) as count FROM units`)?.count || 0;
  const totalTopics = queryOne<any>(`SELECT COUNT(*) as count FROM topics`)?.count || 0;
  const totalAssessments = queryOne<any>(`SELECT COUNT(*) as count FROM assessments`)?.count || 0;
  const totalQuestions = queryOne<any>(`SELECT COUNT(*) as count FROM questions`)?.count || 0;
  const totalPYQs = queryOne<any>(`SELECT COUNT(*) as count FROM pyq_records`)?.count || 0;
  const totalAttempts = queryOne<any>(`SELECT COUNT(*) as count FROM assessment_attempts`)?.count || 0;

  // Categories distribution
  const categories = queryAll<any>(
    `SELECT category, COUNT(id) as subject_count FROM subjects GROUP BY category`
  );

  // Recent attempts
  const recentAttempts = queryAll<any>(
    `SELECT aa.id, aa.percentage, aa.passed, aa.attempted_at, u.name as user_name, a.title as assessment_title, a.test_type
     FROM assessment_attempts aa
     JOIN users u ON aa.user_id = u.id
     JOIN assessments a ON aa.assessment_id = a.id
     ORDER BY aa.attempted_at DESC LIMIT 8`
  );

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalUnits,
      totalTopics,
      totalAssessments,
      totalQuestions,
      totalPYQs,
      totalAttempts,
    },
    categories,
    recentAttempts,
  });
});

// User Management
router.get('/users', (req: AuthenticatedRequest, res: Response): void => {
  const users = queryAll<any>(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            sp.current_streak, sp.total_study_minutes,
            b.code as branch_code, sem.name as semester_name
     FROM users u
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN branches b ON sp.branch_id = b.id
     LEFT JOIN semesters sem ON sp.semester_id = sem.id
     ORDER BY u.id ASC`
  );
  res.json({ success: true, count: users.length, users });
});

router.put('/users/:id/role', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role.' });
    return;
  }

  run(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
  res.json({ success: true, message: 'User role updated successfully.' });
});

router.delete('/users/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  if (Number(id) === req.user!.id) {
    res.status(400).json({ success: false, message: 'Cannot delete current admin user.' });
    return;
  }
  run(`DELETE FROM users WHERE id = ?`, [id]);
  res.json({ success: true, message: 'User deleted.' });
});

// Curriculum Management: Degrees, Branches, Semesters & Mappings
router.get('/curriculum-tree', (req: AuthenticatedRequest, res: Response): void => {
  const universities = queryAll<any>('SELECT * FROM universities ORDER BY name ASC');
  const degrees = queryAll<any>('SELECT * FROM degrees ORDER BY name ASC');
  const branches = queryAll<any>('SELECT b.*, d.name as degree_name FROM branches b JOIN degrees d ON b.degree_id = d.id ORDER BY b.name ASC');
  const years = queryAll<any>('SELECT * FROM academic_years ORDER BY year_number ASC');
  const semesters = queryAll<any>('SELECT s.*, ay.name as academic_year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id ORDER BY s.semester_number ASC');
  const mappings = queryAll<any>(
    `SELECT cm.id, cm.degree_id, cm.branch_id, cm.semester_id, cm.subject_id,
            d.name as degree_name, b.name as branch_name, sem.name as semester_name,
            s.name as subject_name, s.code as subject_code
     FROM curriculum_mappings cm
     JOIN degrees d ON cm.degree_id = d.id
     JOIN branches b ON cm.branch_id = b.id
     JOIN semesters sem ON cm.semester_id = sem.id
     JOIN subjects s ON cm.subject_id = s.id
     ORDER BY sem.semester_number ASC, s.name ASC`
  );

  res.json({
    success: true,
    curriculum: {
      universities,
      degrees,
      branches,
      years,
      semesters,
      mappings,
    },
  });
});

router.post('/curriculum-mappings', (req: AuthenticatedRequest, res: Response): void => {
  const { universityId, degreeId, branchId, semesterId, subjectId } = req.body;

  if (!degreeId || !branchId || !semesterId || !subjectId) {
    res.status(400).json({ success: false, message: 'degreeId, branchId, semesterId, and subjectId are required.' });
    return;
  }

  try {
    const result = run(
      `INSERT INTO curriculum_mappings (university_id, degree_id, branch_id, semester_id, subject_id)
       VALUES (?, ?, ?, ?, ?)`,
      [universityId || null, degreeId, branchId, semesterId, subjectId]
    );
    res.status(201).json({ success: true, message: 'Subject mapped to curriculum successfully.', mappingId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/curriculum-mappings/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  run(`DELETE FROM curriculum_mappings WHERE id = ?`, [id]);
  res.json({ success: true, message: 'Curriculum mapping removed.' });
});

// Subject CRUD
router.post('/subjects', (req: AuthenticatedRequest, res: Response): void => {
  const { category, name, code, slug, description, icon = 'BookOpen', color_accent = 'indigo', branchId, semesterId, degreeId } = req.body;

  if (!category || !name || !code || !slug || !description) {
    res.status(400).json({ success: false, message: 'Missing required subject parameters.' });
    return;
  }

  try {
    const result = run(
      `INSERT INTO subjects (category, name, code, slug, description, icon, color_accent, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [category, name.trim(), code.trim(), slug.trim().toLowerCase(), description.trim(), icon, color_accent]
    );
    const subjectId = result.lastInsertRowid;

    // Automatically create 5 standard Units for the subject!
    for (let u = 1; u <= 5; u++) {
      run(
        `INSERT INTO units (subject_id, unit_number, title, description, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [
          subjectId,
          u,
          `UNIT ${u === 1 ? 'I' : u === 2 ? 'II' : u === 3 ? 'III' : u === 4 ? 'IV' : 'V'}: Module & Foundations`,
          `Syllabus units for ${name.trim()} - Unit ${u}`,
          u,
        ]
      );
    }

    // If branchId and semesterId were provided, map immediately
    if (branchId && semesterId) {
      const defDegree = degreeId || queryOne<any>('SELECT id FROM degrees LIMIT 1')?.id || 1;
      run(
        `INSERT OR IGNORE INTO curriculum_mappings (degree_id, branch_id, semester_id, subject_id)
         VALUES (?, ?, ?, ?)`,
        [defDegree, branchId, semesterId, subjectId]
      );
    }

    res.status(201).json({ success: true, message: 'Subject created with 5 Units.', subjectId });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/subjects/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { category, name, code, slug, description, icon, color_accent, is_active } = req.body;

  run(
    `UPDATE subjects
     SET category = COALESCE(?, category),
         name = COALESCE(?, name),
         code = COALESCE(?, code),
         slug = COALESCE(?, slug),
         description = COALESCE(?, description),
         icon = COALESCE(?, icon),
         color_accent = COALESCE(?, color_accent),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [category, name, code, slug, description, icon, color_accent, is_active, id]
  );
  res.json({ success: true, message: 'Subject updated.' });
});

router.delete('/subjects/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  run(`DELETE FROM subjects WHERE id = ?`, [id]);
  res.json({ success: true, message: 'Subject and associated units deleted.' });
});

// Unit CRUD
router.post('/units', (req: AuthenticatedRequest, res: Response): void => {
  const { subjectId, unitNumber, title, description } = req.body;

  if (!subjectId || !unitNumber || !title) {
    res.status(400).json({ success: false, message: 'subjectId, unitNumber, and title are required.' });
    return;
  }

  try {
    const result = run(
      `INSERT INTO units (subject_id, unit_number, title, description, order_index)
       VALUES (?, ?, ?, ?, ?)`,
      [subjectId, unitNumber, title.trim(), description || '', unitNumber]
    );
    res.status(201).json({ success: true, message: 'Unit created.', unitId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/units/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { title, description } = req.body;

  run(
    `UPDATE units
     SET title = COALESCE(?, title),
         description = COALESCE(?, description)
     WHERE id = ?`,
    [title, description, id]
  );
  res.json({ success: true, message: 'Unit updated.' });
});

router.delete('/units/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  run(`DELETE FROM units WHERE id = ?`, [id]);
  res.json({ success: true, message: 'Unit and nested topics deleted.' });
});

// Topic CRUD
router.post('/topics', (req: AuthenticatedRequest, res: Response): void => {
  const { subjectId, unitId, name, slug, description, difficultyLevel = 'Beginner', orderIndex = 0 } = req.body;

  if (!subjectId || !name || !slug || !description) {
    res.status(400).json({ success: false, message: 'Missing required topic parameters.' });
    return;
  }

  try {
    const result = run(
      `INSERT INTO topics (subject_id, unit_id, name, slug, description, difficulty_level, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, unitId || null, name.trim(), slug.trim().toLowerCase(), description.trim(), difficultyLevel, orderIndex]
    );
    res.status(201).json({ success: true, message: 'Topic created.', topicId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/topics/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { name, slug, description, difficultyLevel, orderIndex, unitId } = req.body;

  run(
    `UPDATE topics
     SET name = COALESCE(?, name),
         slug = COALESCE(?, slug),
         description = COALESCE(?, description),
         difficulty_level = COALESCE(?, difficulty_level),
         order_index = COALESCE(?, order_index),
         unit_id = COALESCE(?, unit_id)
     WHERE id = ?`,
    [name, slug, description, difficultyLevel, orderIndex, unitId, id]
  );
  res.json({ success: true, message: 'Topic updated.' });
});

router.delete('/topics/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  run(`DELETE FROM topics WHERE id = ?`, [id]);
  res.json({ success: true, message: 'Topic deleted.' });
});

// PYQ Management
router.post('/pyqs', (req: AuthenticatedRequest, res: Response): void => {
  const { subjectId, unitId, topicId, university, year, examSeason = 'May/June', questionText, marks = 5, solutionNotes, difficulty = 'Medium' } = req.body;

  if (!subjectId || !university || !year || !questionText || !solutionNotes) {
    res.status(400).json({ success: false, message: 'Missing required PYQ fields.' });
    return;
  }

  try {
    const result = run(
      `INSERT INTO pyq_records (
        subject_id, unit_id, topic_id, university, year, exam_season,
        question_text, marks, solution_notes, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, unitId || null, topicId || null, university.trim(), year, examSeason, questionText.trim(), marks, solutionNotes.trim(), difficulty]
    );
    res.status(201).json({ success: true, message: 'PYQ created.', pyqId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/pyqs/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  run(`DELETE FROM pyq_records WHERE id = ?`, [id]);
  res.json({ success: true, message: 'PYQ deleted.' });
});

export default router;
