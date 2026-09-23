-- ==========================================================
-- EDUMENTOR AI: Relational Database Schema (SQLite 3.x)
-- Fully normalized, academic curriculum-based architecture
-- ==========================================================

PRAGMA foreign_keys = ON;

-- 1. Academic Hierarchy (University -> Degree -> Branch -> Year -> Semester)
CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    year_introduced INTEGER,
    UNIQUE(university_id, code)
);

CREATE TABLE IF NOT EXISTS degrees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    duration_years INTEGER DEFAULT 4,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree_id INTEGER NOT NULL REFERENCES degrees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    UNIQUE(degree_id, code)
);

CREATE TABLE IF NOT EXISTS academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
);

-- 2. Users & Profiles
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
    degree_id INTEGER REFERENCES degrees(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE SET NULL,
    target_score REAL DEFAULT 75.0,
    current_streak INTEGER DEFAULT 1,
    total_study_minutes INTEGER DEFAULT 0,
    target_goal TEXT DEFAULT 'B.Tech Placement & Core Mastery',
    bio TEXT
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department TEXT DEFAULT 'Computer Science & Engineering',
    designation TEXT DEFAULT 'Assistant Professor',
    specialization TEXT DEFAULT 'Data Structures & Algorithms',
    bio TEXT
);

-- 3. Subjects, Units, Topics, Subtopics & Curriculum Mappings
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    color_accent TEXT NOT NULL DEFAULT 'indigo',
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    degree_id INTEGER NOT NULL REFERENCES degrees(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(degree_id, branch_id, semester_id, subject_id)
);

CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    UNIQUE(subject_id, unit_number)
);

CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty_level TEXT NOT NULL DEFAULT 'Beginner' CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, slug)
);

CREATE TABLE IF NOT EXISTS subtopics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0
);

-- 4. Academic Learning Materials & Rich Notes
CREATE TABLE IF NOT EXISTS learning_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL UNIQUE REFERENCES topics(id) ON DELETE CASCADE,
    learning_objectives TEXT NOT NULL,
    concept_explanation TEXT NOT NULL,
    important_definitions TEXT,
    examples_json TEXT, -- JSON array of { title, code_or_text, explanation }
    diagrams_markdown TEXT,
    exam_points TEXT,
    common_mistakes TEXT,
    summary TEXT,
    video_url TEXT,
    pdf_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Courses, Modules, Lessons & Learning Content (Backwards-compatibility)
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Beginner',
    duration_hours REAL DEFAULT 10.0,
    thumbnail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'markdown' CHECK (content_type IN ('text', 'markdown', 'video_guide', 'interactive')),
    content_markdown TEXT NOT NULL,
    estimated_minutes INTEGER DEFAULT 15,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    section_title TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    code_snippet TEXT,
    complexity_notes TEXT
);

-- 6. Question Bank & Centralized Assessments
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_context TEXT,
    difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'pyq', 'short_answer')),
    university TEXT,
    exam_year INTEGER,
    marks INTEGER DEFAULT 1,
    explanation TEXT NOT NULL,
    points INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0, -- 1 for true, 0 for false
    explanation TEXT
);

-- Legacy quiz support
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    time_limit_minutes INTEGER DEFAULT 15,
    passing_score REAL DEFAULT 60.0,
    difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    UNIQUE(quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    percentage REAL NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Unified Multi-Tier Assessments (Diagnostic, Topic Quiz, Unit Test, Subject Test, Mock Test, Re-test)
CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL CHECK (test_type IN ('topic_quiz', 'unit_test', 'subject_test', 'mock_test', 'diagnostic_test', 'retest')),
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 20,
    passing_score REAL DEFAULT 60.0,
    total_questions INTEGER DEFAULT 10,
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    UNIQUE(assessment_id, question_id)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    is_retest INTEGER DEFAULT 0,
    parent_attempt_id INTEGER REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id INTEGER REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0
);

-- 8. Multi-Level Performance Tracking (Topic, Unit, Subject)
CREATE TABLE IF NOT EXISTS topic_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    quizzes_attempted INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    average_score REAL DEFAULT 0.0,
    mastery_level TEXT NOT NULL DEFAULT 'needs_improvement' CHECK (mastery_level IN ('very_weak', 'needs_improvement', 'good', 'strong')),
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS unit_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tests_attempted INTEGER DEFAULT 0,
    average_score REAL DEFAULT 0.0,
    completed_topics_count INTEGER DEFAULT 0,
    total_topics_count INTEGER DEFAULT 0,
    mastery_level TEXT NOT NULL DEFAULT 'needs_improvement' CHECK (mastery_level IN ('very_weak', 'needs_improvement', 'good', 'strong')),
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, unit_id)
);

CREATE TABLE IF NOT EXISTS subject_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tests_attempted INTEGER DEFAULT 0,
    average_score REAL DEFAULT 0.0,
    diagnostic_completed INTEGER DEFAULT 0,
    diagnostic_score REAL DEFAULT 0.0,
    progress_percentage REAL DEFAULT 0.0,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject_id)
);

CREATE TABLE IF NOT EXISTS topic_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at DATETIME,
    UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS learning_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage REAL DEFAULT 0.0,
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- 9. Previous Year Questions (PYQs)
CREATE TABLE IF NOT EXISTS pyq_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    university TEXT NOT NULL,
    year INTEGER NOT NULL,
    exam_season TEXT DEFAULT 'May/June',
    question_text TEXT NOT NULL,
    marks INTEGER DEFAULT 5,
    solution_notes TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Curated Resources
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Article', 'Video', 'Notes', 'PDF', 'Practice', 'Documentation')),
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    is_external INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Explainable AI Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    resource_id INTEGER REFERENCES resources(id) ON DELETE SET NULL,
    reason_title TEXT NOT NULL,
    explanation_markdown TEXT NOT NULL,
    triggering_quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
    triggering_test_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    current_score REAL NOT NULL,
    target_score REAL NOT NULL DEFAULT 70.0,
    score_delta REAL DEFAULT 0.0,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Learning Paths & Roadmaps
CREATE TABLE IF NOT EXISTS learning_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    target_role TEXT NOT NULL,
    estimated_weeks INTEGER DEFAULT 8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_path_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    step_title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_optional INTEGER DEFAULT 0,
    UNIQUE(path_id, order_index)
);

CREATE TABLE IF NOT EXISTS user_path_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    completed_steps_json TEXT DEFAULT '[]',
    percentage REAL DEFAULT 0.0,
    current_step_id INTEGER REFERENCES learning_path_steps(id) ON DELETE SET NULL,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, path_id)
);

-- 13. DSA & Coding Arena
CREATE TABLE IF NOT EXISTS dsa_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    problem_statement TEXT NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    constraints TEXT NOT NULL,
    sample_cases_json TEXT NOT NULL,
    hidden_cases_json TEXT,
    starter_code_json TEXT NOT NULL,
    solution_explanation TEXT NOT NULL,
    time_complexity TEXT NOT NULL,
    space_complexity TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coding_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES dsa_problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('c', 'cpp', 'java', 'python', 'javascript')),
    code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error')),
    test_cases_passed INTEGER DEFAULT 0,
    total_test_cases INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    memory_kb INTEGER DEFAULT 0,
    error_message TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Bookmarks, Search & Notifications
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('lesson', 'question', 'resource', 'dsa_problem', 'topic', 'assessment')),
    item_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recommendation', 'quiz_result', 'test_result', 'streak', 'system')),
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_curr_map ON curriculum_mappings(degree_id, branch_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_unit ON topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_unit ON assessments(unit_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(test_type);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_unit ON pyq_records(subject_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_perf_user ON unit_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_perf_user ON subject_performance(user_id);
