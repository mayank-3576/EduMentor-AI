import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// 1. Get all universities and their regulations
router.get('/universities', (req, res): void => {
  try {
    const universities = queryAll<any>('SELECT * FROM universities ORDER BY name ASC');
    const regulations = queryAll<any>('SELECT * FROM regulations ORDER BY year_introduced DESC');

    const result = universities.map((u) => ({
      ...u,
      regulations: regulations.filter((r) => r.university_id === u.id),
    }));

    res.json({ success: true, universities: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get degrees
router.get('/degrees', (req, res): void => {
  try {
    const degrees = queryAll<any>('SELECT * FROM degrees ORDER BY name ASC');
    res.json({ success: true, degrees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get branches (optionally by degree_id)
router.get('/branches', (req, res): void => {
  try {
    const { degreeId } = req.query;
    let sql = 'SELECT b.*, d.name as degree_name FROM branches b JOIN degrees d ON b.degree_id = d.id';
    const params: any[] = [];

    if (degreeId) {
      sql += ' WHERE b.degree_id = ?';
      params.push(degreeId);
    }
    sql += ' ORDER BY b.name ASC';

    const branches = queryAll<any>(sql, params);
    res.json({ success: true, branches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get academic years
router.get('/years', (req, res): void => {
  try {
    const years = queryAll<any>('SELECT * FROM academic_years ORDER BY year_number ASC');
    res.json({ success: true, years });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Get semesters (optionally by academic_year_id)
router.get('/semesters', (req, res): void => {
  try {
    const { academicYearId } = req.query;
    let sql = 'SELECT s.*, ay.name as academic_year_name, ay.year_number FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id';
    const params: any[] = [];

    if (academicYearId) {
      sql += ' WHERE s.academic_year_id = ?';
      params.push(academicYearId);
    }
    sql += ' ORDER BY s.semester_number ASC';

    const semesters = queryAll<any>(sql, params);
    res.json({ success: true, semesters });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Complete academic taxonomy for registration/selectors
router.get('/structure', (req, res): void => {
  try {
    const universities = queryAll<any>('SELECT * FROM universities ORDER BY name ASC');
    const degrees = queryAll<any>('SELECT * FROM degrees ORDER BY name ASC');
    const branches = queryAll<any>('SELECT * FROM branches ORDER BY name ASC');
    const years = queryAll<any>('SELECT * FROM academic_years ORDER BY year_number ASC');
    const semesters = queryAll<any>('SELECT * FROM semesters ORDER BY semester_number ASC');

    res.json({
      success: true,
      structure: {
        universities,
        degrees,
        branches,
        years,
        semesters,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Get student's mapped curriculum subjects (Strict filter: Only current semester subjects!)
router.get('/student', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const profile = queryOne<any>(
      `SELECT sp.*,
              d.name as degree_name, d.code as degree_code,
              b.name as branch_name, b.code as branch_code,
              ay.name as academic_year_name, ay.year_number,
              sem.name as semester_name, sem.semester_number,
              u.name as university_name, u.code as university_code
       FROM student_profiles sp
       LEFT JOIN degrees d ON sp.degree_id = d.id
       LEFT JOIN branches b ON sp.branch_id = b.id
       LEFT JOIN academic_years ay ON sp.academic_year_id = ay.id
       LEFT JOIN semesters sem ON sp.semester_id = sem.id
       LEFT JOIN universities u ON sp.university_id = u.id
       WHERE sp.user_id = ?`,
      [userId]
    );

    if (!profile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Query subjects strictly mapped to this student's branch and semester
    let subjects: any[] = [];
    if (profile.branch_id && profile.semester_id) {
      subjects = queryAll<any>(
        `SELECT DISTINCT s.*,
                (SELECT COUNT(*) FROM units u WHERE u.subject_id = s.id) as unit_count,
                (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id) as topic_count,
                (SELECT COUNT(*) FROM assessments a WHERE a.subject_id = s.id) as test_count,
                COALESCE(sp_perf.average_score, 0) as average_score,
                COALESCE(sp_perf.progress_percentage, 0) as progress_percentage,
                COALESCE(sp_perf.diagnostic_completed, 0) as diagnostic_completed
         FROM subjects s
         JOIN curriculum_mappings cm ON s.id = cm.subject_id
         LEFT JOIN subject_performance sp_perf ON (sp_perf.subject_id = s.id AND sp_perf.user_id = ?)
         WHERE cm.branch_id = ? AND cm.semester_id = ? AND s.is_active = 1
         ORDER BY s.order_index ASC`,
        [userId, profile.branch_id, profile.semester_id]
      );
    }

    res.json({
      success: true,
      profile,
      subjects,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
