import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { explainableAIEngine } from '../services/explainableAI.js';

const router = Router();

// Student Dashboard Consolidated Endpoint
router.get('/dashboard', authenticateToken, requireRole('student', 'admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Enriched Student Profile
    const profile = queryOne<any>(
      `SELECT sp.*,
              d.name as degree_name, d.code as degree_code,
              b.name as branch_name, b.code as branch_code,
              ay.name as academic_year_name, ay.year_number as academic_year_number,
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

    // 2. Strict Current Semester Subjects ("My Subjects")
    let currentSemesterSubjects: any[] = [];
    if (profile?.branch_id && profile?.semester_id) {
      const rawSubjects = queryAll<any>(
        `SELECT DISTINCT s.*,
                (SELECT COUNT(*) FROM units u WHERE u.subject_id = s.id) as unit_count,
                (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id) as topic_count,
                COALESCE(sp.average_score, 0) as average_score,
                COALESCE(sp.progress_percentage, 0) as progress_percentage,
                COALESCE(sp.diagnostic_completed, 0) as diagnostic_completed,
                (SELECT a.id FROM assessments a WHERE a.subject_id = s.id AND a.test_type = 'diagnostic_test' LIMIT 1) as diagnostic_test_id
         FROM subjects s
         JOIN curriculum_mappings cm ON s.id = cm.subject_id
         LEFT JOIN subject_performance sp ON (sp.subject_id = s.id AND sp.user_id = ?)
         WHERE cm.branch_id = ? AND cm.semester_id = ? AND s.is_active = 1
         ORDER BY s.order_index ASC`,
        [userId, profile.branch_id, profile.semester_id]
      );

      currentSemesterSubjects = rawSubjects.map((sub) => {
        // Find weak topics in this subject
        const weakTopics = queryAll<any>(
          `SELECT t.id, t.name, tp.average_score, tp.mastery_level
           FROM topic_performance tp
           JOIN topics t ON tp.topic_id = t.id
           WHERE t.subject_id = ? AND tp.user_id = ? AND (tp.mastery_level = 'very_weak' OR tp.mastery_level = 'needs_improvement')`,
          [sub.id, userId]
        );

        // Completed topics count
        const completedTopics = queryOne<any>(
          `SELECT COUNT(*) as count FROM topic_progress tp
           JOIN topics t ON tp.topic_id = t.id
           WHERE t.subject_id = ? AND tp.user_id = ? AND tp.status = 'completed'`,
          [sub.id, userId]
        )?.count || 0;

        return {
          ...sub,
          completed_topics_count: completedTopics,
          weakTopics,
        };
      });
    }

    // 3. Multi-tier Assessment Statistics
    const attempts = queryAll<any>(
      `SELECT aa.*, a.title as assessment_title, a.test_type, s.name as subject_name
       FROM assessment_attempts aa
       JOIN assessments a ON aa.assessment_id = a.id
       JOIN subjects s ON a.subject_id = s.id
       WHERE aa.user_id = ?
       ORDER BY aa.attempted_at DESC`,
      [userId]
    );

    const totalTestsAttempted = attempts.length;
    const averageScore = totalTestsAttempted > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalTestsAttempted)
      : 0;
    const recentAttempt = attempts[0] || null;

    // 4. Topic Performance: Weak vs Strong topics
    const topicPerformances = queryAll<any>(
      `SELECT tp.*, t.name as topic_name, t.slug as topic_slug, s.name as subject_name, s.slug as subject_slug, s.category,
              u.title as unit_title, u.unit_number
       FROM topic_performance tp
       JOIN topics t ON tp.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN units u ON t.unit_id = u.id
       WHERE tp.user_id = ?
       ORDER BY tp.average_score ASC`,
      [userId]
    );

    const weakTopics = topicPerformances.filter(
      (tp) => tp.mastery_level === 'very_weak' || tp.mastery_level === 'needs_improvement'
    );
    const strongTopics = topicPerformances.filter(
      (tp) => tp.mastery_level === 'strong' || tp.mastery_level === 'good'
    );

    // 5. Active Explainable AI recommendations
    const activeRecommendations = queryAll<any>(
      `SELECT r.*,
              t.name as topic_name, t.slug as topic_slug,
              s.name as subject_name, s.code as subject_code, s.slug as subject_slug,
              u.title as unit_title, u.unit_number,
              a.title as triggering_assessment_title
       FROM recommendations r
       JOIN topics t ON r.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN units u ON r.unit_id = u.id
       LEFT JOIN assessments a ON r.triggering_test_id = a.id
       WHERE r.user_id = ? AND r.status = 'active'
       ORDER BY r.priority DESC, r.created_at DESC`,
      [userId]
    );

    // 6. Quick Access Tests (Diagnostic, Unit, Mock Tests)
    const quickAccessTests = queryAll<any>(
      `SELECT a.*, s.name as subject_name, s.code as subject_code,
              u.title as unit_title, u.unit_number,
              (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id) as question_count
       FROM assessments a
       JOIN subjects s ON a.subject_id = s.id
       JOIN curriculum_mappings cm ON s.id = cm.subject_id
       LEFT JOIN units u ON a.unit_id = u.id
       WHERE cm.branch_id = ? AND cm.semester_id = ?
       ORDER BY 
         CASE a.test_type
           WHEN 'diagnostic_test' THEN 1
           WHEN 'unit_test' THEN 2
           WHEN 'mock_test' THEN 3
           ELSE 4
         END, a.id ASC
       LIMIT 6`,
      [profile?.branch_id || 0, profile?.semester_id || 0]
    );

    // 7. Recent PYQs for Semester 5 subjects
    const recentPYQs = queryAll<any>(
      `SELECT p.*, s.name as subject_name, u.unit_number
       FROM pyq_records p
       JOIN subjects s ON p.subject_id = s.id
       JOIN curriculum_mappings cm ON s.id = cm.subject_id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE cm.branch_id = ? AND cm.semester_id = ?
       ORDER BY p.year DESC, p.id ASC
       LIMIT 4`,
      [profile?.branch_id || 0, profile?.semester_id || 0]
    );

    res.json({
      success: true,
      dashboard: {
        user: req.user,
        profile: profile || {
          target_score: 75.0,
          current_streak: 1,
          total_study_minutes: 0,
          target_goal: 'B.Tech Core Mastery',
          degree_name: 'Bachelor of Technology',
          branch_name: 'Computer Science & Engineering',
          academic_year_name: '3rd Year',
          semester_name: 'Semester 5',
        },
        currentSemesterSubjects,
        performance: {
          totalTestsAttempted,
          averageScore,
          targetScore: profile?.target_score || 75.0,
          recentAttempt,
        },
        weakTopics,
        strongTopics,
        recommendations: activeRecommendations,
        quickAccessTests,
        recentPYQs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Subject-specific unit performance drilldown
router.get('/performance/subject/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const subject = queryOne<any>(`SELECT * FROM subjects WHERE id = ? OR slug = ?`, [id, id]);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found.' });
      return;
    }

    const unitPerformances = queryAll<any>(
      `SELECT u.*,
              COALESCE(up.average_score, 0) as average_score,
              COALESCE(up.tests_attempted, 0) as tests_attempted,
              COALESCE(up.completed_topics_count, 0) as completed_topics_count,
              (SELECT COUNT(*) FROM topics t WHERE t.unit_id = u.id) as total_topics_count,
              COALESCE(up.mastery_level, 'needs_improvement') as mastery_level
       FROM units u
       LEFT JOIN unit_performance up ON (u.id = up.unit_id AND up.user_id = ?)
       WHERE u.subject_id = ?
       ORDER BY u.unit_number ASC`,
      [userId, subject.id]
    );

    const subjectPerformance = queryOne<any>(
      `SELECT * FROM subject_performance WHERE subject_id = ? AND user_id = ?`,
      [subject.id, userId]
    );

    res.json({
      success: true,
      subject,
      units: unitPerformances,
      performance: subjectPerformance || {
        average_score: 0,
        progress_percentage: 0,
        diagnostic_completed: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student Deep Analytics
router.get('/analytics', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;

  const scoreHistory = queryAll<any>(
    `SELECT aa.id, aa.score, aa.max_score, aa.percentage, aa.passed, aa.attempted_at,
            a.title as assessment_title, a.test_type, s.name as subject_name
     FROM assessment_attempts aa
     JOIN assessments a ON aa.assessment_id = a.id
     JOIN subjects s ON a.subject_id = s.id
     WHERE aa.user_id = ?
     ORDER BY aa.attempted_at ASC`,
    [userId]
  );

  const unitBreakdown = queryAll<any>(
    `SELECT up.*, u.title as unit_title, u.unit_number, s.name as subject_name
     FROM unit_performance up
     JOIN units u ON up.unit_id = u.id
     JOIN subjects s ON u.subject_id = s.id
     WHERE up.user_id = ?
     ORDER BY up.average_score ASC`,
    [userId]
  );

  const topicBreakdown = queryAll<any>(
    `SELECT tp.*, t.name as topic_name, s.name as subject_name, s.category
     FROM topic_performance tp
     JOIN topics t ON tp.topic_id = t.id
     JOIN subjects s ON t.subject_id = s.id
     WHERE tp.user_id = ?
     ORDER BY tp.average_score ASC`,
    [userId]
  );

  res.json({
    success: true,
    analytics: {
      scoreHistory,
      unitBreakdown,
      topicBreakdown,
    },
  });
});

export default router;
