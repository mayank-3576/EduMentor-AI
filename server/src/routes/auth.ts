import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

function getEnrichedStudentProfile(userId: number) {
  return queryOne<any>(
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
}

// Register new user
router.post('/register', async (req, res): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      department,
      targetGoal,
      universityId,
      degreeId,
      branchId,
      academicYearId,
      semesterId,
      targetScore = 75.0,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole: UserRole = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';

    const insertUser = run(
      `INSERT INTO users (name, email, password_hash, role, avatar_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        userRole,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      ]
    );

    const userId = insertUser.lastInsertRowid;

    // Create profile according to role
    if (userRole === 'student') {
      // Default to B.Tech CSE AIML 3rd Year Sem 5 if not provided
      const defDegree = degreeId || queryOne<any>('SELECT id FROM degrees LIMIT 1')?.id || null;
      const defBranch = branchId || queryOne<any>('SELECT id FROM branches LIMIT 1')?.id || null;
      const defYear = academicYearId || queryOne<any>('SELECT id FROM academic_years WHERE year_number = 3')?.id || null;
      const defSem = semesterId || queryOne<any>('SELECT id FROM semesters WHERE semester_number = 5')?.id || null;
      const defUniv = universityId || queryOne<any>('SELECT id FROM universities LIMIT 1')?.id || null;

      run(
        `INSERT INTO student_profiles (
          user_id, university_id, degree_id, branch_id, academic_year_id, semester_id,
          target_score, target_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          defUniv,
          defDegree,
          defBranch,
          defYear,
          defSem,
          targetScore,
          targetGoal || 'B.Tech Core Mastery & High-Paying Placement',
        ]
      );
    } else if (userRole === 'teacher') {
      run(
        `INSERT INTO teacher_profiles (user_id, department, designation)
         VALUES (?, ?, 'Assistant Professor')`,
        [userId, department || 'Computer Science & Engineering']
      );
    }

    const token = jwt.sign(
      { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const profile = userRole === 'student'
      ? getEnrichedStudentProfile(userId)
      : queryOne('SELECT * FROM teacher_profiles WHERE user_id = ?', [userId]);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: userRole },
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = queryOne<any>(
      `SELECT * FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fetch enriched profile
    let profile = null;
    if (user.role === 'student') {
      profile = getEnrichedStudentProfile(user.id);
    } else if (user.role === 'teacher') {
      profile = queryOne('SELECT * FROM teacher_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const user = queryOne<any>('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?', [userId]);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  let profile = null;
  if (user.role === 'student') {
    profile = getEnrichedStudentProfile(userId);
  } else if (user.role === 'teacher') {
    profile = queryOne('SELECT * FROM teacher_profiles WHERE user_id = ?', [userId]);
  }

  res.json({ success: true, user, profile });
});

// Update profile
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const {
    targetScore,
    targetGoal,
    bio,
    department,
    designation,
    universityId,
    degreeId,
    branchId,
    academicYearId,
    semesterId,
  } = req.body;

  if (role === 'student') {
    run(
      `UPDATE student_profiles 
       SET target_score = COALESCE(?, target_score),
           target_goal = COALESCE(?, target_goal),
           bio = COALESCE(?, bio),
           university_id = COALESCE(?, university_id),
           degree_id = COALESCE(?, degree_id),
           branch_id = COALESCE(?, branch_id),
           academic_year_id = COALESCE(?, academic_year_id),
           semester_id = COALESCE(?, semester_id)
       WHERE user_id = ?`,
      [targetScore, targetGoal, bio, universityId, degreeId, branchId, academicYearId, semesterId, userId]
    );

    const updatedProfile = getEnrichedStudentProfile(userId);
    res.json({ success: true, message: 'Profile updated successfully.', profile: updatedProfile });
    return;
  } else if (role === 'teacher') {
    run(
      `UPDATE teacher_profiles
       SET department = COALESCE(?, department),
           designation = COALESCE(?, designation),
           bio = COALESCE(?, bio)
       WHERE user_id = ?`,
      [department, designation, bio, userId]
    );
  }

  res.json({ success: true, message: 'Profile updated successfully.' });
});

export default router;
