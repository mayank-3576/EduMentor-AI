export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface University {
  id: number;
  name: string;
  code: string;
  state?: string;
  created_at?: string;
}

export interface Degree {
  id: number;
  name: string;
  code: string;
  duration_years: number;
}

export interface Branch {
  id: number;
  degree_id: number;
  name: string;
  code: string;
  degree_name?: string;
}

export interface AcademicYear {
  id: number;
  year_number: number;
  name: string;
}

export interface Semester {
  id: number;
  academic_year_id: number;
  semester_number: number;
  name: string;
  year_number?: number;
}

export interface CurriculumMapping {
  id: number;
  university_id?: number;
  degree_id: number;
  branch_id: number;
  semester_id: number;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  branch_name?: string;
  semester_name?: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  university_id?: number;
  degree_id?: number;
  branch_id?: number;
  academic_year_id?: number;
  semester_id?: number;
  target_score: number;
  current_streak: number;
  total_study_minutes: number;
  target_goal: string;
  bio?: string;
  degree_name?: string;
  branch_name?: string;
  academic_year_name?: string;
  semester_name?: string;
  university_name?: string;
}

export interface TeacherProfile {
  id: number;
  user_id: number;
  department: string;
  designation: string;
  specialization?: string;
  bio?: string;
}

export interface Unit {
  id: number;
  subject_id: number;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  topics_count?: number;
  completed_topics_count?: number;
  average_score?: number;
  mastery_level?: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
  topics?: Topic[];
}

export interface Subject {
  id: number;
  category: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  icon: string;
  color_accent: string;
  order_index: number;
  is_active: number;
  topic_count?: number;
  quiz_count?: number;
  unit_count?: number;
  units?: Unit[];
  user_progress?: number;
  user_average_score?: number;
  diagnostic_completed?: boolean;
}

export interface Topic {
  id: number;
  subject_id: number;
  unit_id?: number;
  name: string;
  slug: string;
  description: string;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  order_index: number;
  subject_name?: string;
  unit_title?: string;
  unit_number?: number;
  lesson_count?: number;
  quiz_count?: number;
  is_completed?: boolean;
  user_score?: number;
  mastery_level?: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
}

export interface Subtopic {
  id: number;
  topic_id: number;
  name: string;
  slug: string;
  description: string;
  order_index: number;
}

export interface LearningMaterial {
  id: number;
  topic_id: number;
  learning_objectives: string;
  concept_explanation: string;
  important_definitions?: string;
  examples_json?: string;
  diagrams_markdown?: string;
  exam_points?: string;
  common_mistakes?: string;
  summary?: string;
  video_url?: string;
  pdf_url?: string;
  created_at?: string;
}

export interface Lesson {
  id: number;
  topic_id: number;
  module_id?: number;
  title: string;
  slug: string;
  content_type: 'text' | 'markdown' | 'video_guide' | 'interactive';
  content_markdown: string;
  estimated_minutes: number;
  order_index: number;
  is_completed?: boolean;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: number; // 0 or 1
  explanation?: string;
}

export interface Question {
  id: number;
  subject_id: number;
  unit_id?: number;
  topic_id: number;
  question_text: string;
  code_context?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question_type?: 'mcq' | 'pyq' | 'short_answer';
  university?: string;
  exam_year?: number;
  marks?: number;
  explanation: string;
  points: number;
  options?: QuestionOption[];
}

export type AssessmentType = 'topic_quiz' | 'unit_test' | 'subject_test' | 'mock_test' | 'diagnostic_test' | 'retest';

export interface Assessment {
  id: number;
  subject_id: number;
  unit_id?: number;
  topic_id?: number;
  test_type: AssessmentType;
  title: string;
  description?: string;
  time_limit_minutes: number;
  passing_score: number;
  total_questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_by?: number;
  subject_name?: string;
  unit_title?: string;
  topic_name?: string;
  questions?: Question[];
}

export interface AssessmentAttempt {
  id: number;
  user_id: number;
  assessment_id: number;
  test_type: AssessmentType;
  score: number;
  max_score: number;
  percentage: number;
  passed: number;
  time_taken_seconds: number;
  is_retest?: number;
  parent_attempt_id?: number;
  attempted_at: string;
  assessment_title?: string;
  subject_name?: string;
  unit_title?: string;
  answers?: AssessmentAnswer[];
}

export interface AssessmentAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option_id?: number;
  is_correct: number;
  time_spent_seconds?: number;
  question?: Question;
}

export interface UnitPerformance {
  id: number;
  user_id: number;
  unit_id: number;
  subject_id: number;
  tests_attempted: number;
  average_score: number;
  completed_topics_count: number;
  total_topics_count: number;
  mastery_level: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
  last_updated_at: string;
  unit_title?: string;
  unit_number?: number;
}

export interface SubjectPerformance {
  id: number;
  user_id: number;
  subject_id: number;
  tests_attempted: number;
  average_score: number;
  diagnostic_completed: number;
  diagnostic_score: number;
  progress_percentage: number;
  last_updated_at: string;
  subject_name?: string;
  subject_code?: string;
}

export interface PYQRecord {
  id: number;
  subject_id: number;
  unit_id?: number;
  topic_id?: number;
  university: string;
  year: number;
  exam_season: string;
  question_text: string;
  marks: number;
  solution_notes: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject_name?: string;
  unit_title?: string;
  topic_name?: string;
}

export interface Quiz {
  id: number;
  subject_id: number;
  topic_id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_by: number;
  subject_name?: string;
  topic_name?: string;
  total_questions?: number;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: number;
  time_taken_seconds: number;
  attempted_at: string;
  quiz_title?: string;
  topic_name?: string;
  subject_name?: string;
}

export interface TopicPerformance {
  id: number;
  user_id: number;
  topic_id: number;
  quizzes_attempted: number;
  total_questions: number;
  correct_answers: number;
  average_score: number;
  mastery_level: 'very_weak' | 'needs_improvement' | 'good' | 'strong';
  last_updated_at: string;
  topic_name?: string;
  subject_name?: string;
  category?: string;
}

export interface Recommendation {
  id: number;
  user_id: number;
  topic_id: number;
  unit_id?: number;
  resource_id?: number;
  reason_title: string;
  explanation_markdown: string;
  triggering_quiz_id?: number;
  triggering_test_id?: number;
  current_score: number;
  target_score: number;
  score_delta: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'dismissed';
  created_at: string;
  topic_name?: string;
  subject_name?: string;
  unit_title?: string;
  resource_title?: string;
  resource_url?: string;
  resource_type?: string;
}

export interface Resource {
  id: number;
  subject_id: number;
  topic_id: number;
  title: string;
  type: 'Article' | 'Video' | 'Notes' | 'PDF' | 'Practice' | 'Documentation';
  url: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  is_external: number;
  subject_name?: string;
  topic_name?: string;
}

export interface DSATopic {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  total_problems: number;
  solved_count?: number;
}

export interface DSAProblem {
  id: number;
  topic_id: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  sample_cases_json: string;
  hidden_cases_json?: string;
  starter_code_json: string;
  solution_explanation: string;
  time_complexity: string;
  space_complexity: string;
  topic_name?: string;
  is_solved?: boolean;
}

export interface LearningPath {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  target_role: string;
  estimated_weeks: number;
  steps?: LearningPathStep[];
  progress_percentage?: number;
}

export interface LearningPathStep {
  id: number;
  path_id: number;
  subject_id: number;
  topic_id: number;
  step_title: string;
  order_index: number;
  is_optional: number;
  subject_name?: string;
  topic_name?: string;
  is_completed?: boolean;
}
