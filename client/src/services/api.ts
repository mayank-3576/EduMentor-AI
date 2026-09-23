const BASE_URL = '/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('edumentor_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: any) =>
      fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => fetchWithAuth('/auth/me'),
    updateProfile: (profileData: any) =>
      fetchWithAuth('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  },

  // Academic Curriculum Structure
  curriculum: {
    getUniversities: () => fetchWithAuth('/curriculum/universities'),
    getDegrees: () => fetchWithAuth('/curriculum/degrees'),
    getBranches: (degreeId?: number) =>
      fetchWithAuth(`/curriculum/branches${degreeId ? `?degreeId=${degreeId}` : ''}`),
    getYears: () => fetchWithAuth('/curriculum/years'),
    getSemesters: (academicYearId?: number) =>
      fetchWithAuth(`/curriculum/semesters${academicYearId ? `?academicYearId=${academicYearId}` : ''}`),
    getStructure: () => fetchWithAuth('/curriculum/structure'),
    getStudentCurriculum: () => fetchWithAuth('/curriculum/student'),
  },

  // Subjects (Supports filtering strictly by branchId & semesterId)
  subjects: {
    getAll: (params?: { category?: string; branchId?: number; semesterId?: number; degreeId?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchWithAuth(`/subjects${query ? `?${query}` : ''}`);
    },
    getCategories: () => fetchWithAuth('/subjects/categories'),
    getById: (id: number | string) => fetchWithAuth(`/subjects/${id}`),
  },

  // Units
  units: {
    getById: (id: number | string) => fetchWithAuth(`/units/${id}`),
    getTopics: (id: number | string) => fetchWithAuth(`/units/${id}/topics`),
  },

  // Topics & Rich Academic Learning Materials
  topics: {
    getById: (id: number | string) => fetchWithAuth(`/topics/${id}`),
    getContent: (id: number | string) => fetchWithAuth(`/topics/${id}/content`),
    markCompleted: (id: number | string) =>
      fetchWithAuth(`/topics/${id}/complete`, { method: 'POST' }),
  },

  // Lessons
  lessons: {
    getById: (id: number | string) => fetchWithAuth(`/lessons/${id}`),
    markCompleted: (id: number | string) =>
      fetchWithAuth(`/lessons/${id}/complete`, { method: 'POST' }),
  },

  // Unified Multi-Tier Assessments (Diagnostic, Topic Quiz, Unit Test, Subject Test, Mock Test, Re-test)
  tests: {
    getAll: (params?: { testType?: string; subjectId?: number; unitId?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchWithAuth(`/tests${query ? `?${query}` : ''}`);
    },
    getById: (id: number | string) => fetchWithAuth(`/tests/${id}`),
    submit: (
      id: number | string,
      payload: {
        answers: Record<number, number>;
        timeTakenSeconds?: number;
        isRetest?: boolean;
        parentAttemptId?: number | null;
      }
    ) =>
      fetchWithAuth(`/tests/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getAttempt: (attemptId: number | string) => fetchWithAuth(`/tests/attempts/${attemptId}`),
  },

  // Previous Year Questions (PYQs)
  pyq: {
    getAll: (params?: {
      university?: string;
      year?: number | string;
      subjectId?: number;
      unitId?: number;
      topicId?: number;
      difficulty?: string;
    }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchWithAuth(`/pyq${query ? `?${query}` : ''}`);
    },
    getFilters: () => fetchWithAuth('/pyq/filters'),
    getById: (id: number | string) => fetchWithAuth(`/pyq/${id}`),
  },

  // Legacy Quizzes support
  quizzes: {
    getAll: (params?: { subjectId?: number; topicId?: number; difficulty?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchWithAuth(`/quizzes${query ? `?${query}` : ''}`);
    },
    getById: (id: number | string) => fetchWithAuth(`/quizzes/${id}`),
    submit: (id: number | string, answers: any[], timeTakenSeconds: number) =>
      fetchWithAuth(`/quizzes/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, timeTakenSeconds }),
      }),
    getAttempt: (attemptId: number | string) => fetchWithAuth(`/quizzes/attempts/${attemptId}`),
  },

  // Student Dashboard & Analytics
  student: {
    getDashboard: () => fetchWithAuth('/student/dashboard'),
    getSubjectPerformance: (subjectId: number | string) =>
      fetchWithAuth(`/student/performance/subject/${subjectId}`),
    getAnalytics: () => fetchWithAuth('/student/analytics'),
  },

  // Explainable AI Recommendations
  recommendations: {
    getAll: () => fetchWithAuth('/recommendations'),
    dismiss: (id: number) => fetchWithAuth(`/recommendations/${id}/dismiss`, { method: 'POST' }),
    complete: (id: number) => fetchWithAuth(`/recommendations/${id}/complete`, { method: 'POST' }),
    generate: (topicId: number, manualReason?: string) =>
      fetchWithAuth('/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ topicId, manualReason }),
      }),
  },

  // DSA & Coding Arena
  dsa: {
    getTopics: () => fetchWithAuth('/dsa/topics'),
    getProblems: (params?: { topicId?: number; difficulty?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchWithAuth(`/dsa/problems${query ? `?${query}` : ''}`);
    },
    getProblemById: (id: number | string) => fetchWithAuth(`/dsa/problems/${id}`),
    runCode: (data: { problemId: number; language: string; code: string; customInput?: string }) =>
      fetchWithAuth('/dsa/run-code', { method: 'POST', body: JSON.stringify(data) }),
    submitCode: (data: { problemId: number; language: string; code: string }) =>
      fetchWithAuth('/dsa/submit', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Curated Resources
  resources: {
    getAll: (params?: { subjectId?: number; topicId?: number; type?: string; difficulty?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchWithAuth(`/resources${query ? `?${query}` : ''}`);
    },
  },

  // Learning Paths
  learningPaths: {
    getAll: () => fetchWithAuth('/learning-paths'),
    getById: (id: number | string) => fetchWithAuth(`/learning-paths/${id}`),
    toggleStep: (pathId: number | string, stepId: number | string) =>
      fetchWithAuth(`/learning-paths/${pathId}/steps/${stepId}/toggle`, { method: 'POST' }),
  },

  // Global Search
  search: (query: string, filters?: { category?: string; difficulty?: string; contentType?: string }) => {
    const params = new URLSearchParams({ q: query, ...(filters || {}) }).toString();
    return fetchWithAuth(`/search?${params}`);
  },

  // Teacher Endpoints
  teacher: {
    getDashboard: () => fetchWithAuth('/teacher/dashboard'),
    createQuestion: (data: any) => fetchWithAuth('/teacher/questions', { method: 'POST', body: JSON.stringify(data) }),
    createQuiz: (data: any) => fetchWithAuth('/teacher/quizzes', { method: 'POST', body: JSON.stringify(data) }),
    createResource: (data: any) => fetchWithAuth('/teacher/resources', { method: 'POST', body: JSON.stringify(data) }),
    getStudentPerformance: () => fetchWithAuth('/teacher/student-performance'),
  },

  // Admin CMS Endpoints (Full Dynamic CRUD)
  admin: {
    getAnalytics: () => fetchWithAuth('/admin/analytics'),
    getUsers: () => fetchWithAuth('/admin/users'),
    updateUserRole: (id: number, role: string) =>
      fetchWithAuth(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    deleteUser: (id: number) => fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' }),

    getCurriculumTree: () => fetchWithAuth('/admin/curriculum-tree'),
    createCurriculumMapping: (data: any) =>
      fetchWithAuth('/admin/curriculum-mappings', { method: 'POST', body: JSON.stringify(data) }),
    deleteCurriculumMapping: (id: number) =>
      fetchWithAuth(`/admin/curriculum-mappings/${id}`, { method: 'DELETE' }),

    createSubject: (data: any) => fetchWithAuth('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),
    updateSubject: (id: number, data: any) => fetchWithAuth(`/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSubject: (id: number) => fetchWithAuth(`/admin/subjects/${id}`, { method: 'DELETE' }),

    createUnit: (data: any) => fetchWithAuth('/admin/units', { method: 'POST', body: JSON.stringify(data) }),
    updateUnit: (id: number, data: any) => fetchWithAuth(`/admin/units/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUnit: (id: number) => fetchWithAuth(`/admin/units/${id}`, { method: 'DELETE' }),

    createTopic: (data: any) => fetchWithAuth('/admin/topics', { method: 'POST', body: JSON.stringify(data) }),
    updateTopic: (id: number, data: any) => fetchWithAuth(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTopic: (id: number) => fetchWithAuth(`/admin/topics/${id}`, { method: 'DELETE' }),

    createPYQ: (data: any) => fetchWithAuth('/admin/pyqs', { method: 'POST', body: JSON.stringify(data) }),
    deletePYQ: (id: number) => fetchWithAuth(`/admin/pyqs/${id}`, { method: 'DELETE' }),

    createLesson: (data: any) => fetchWithAuth('/admin/lessons', { method: 'POST', body: JSON.stringify(data) }),
    updateLesson: (id: number, data: any) => fetchWithAuth(`/admin/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLesson: (id: number) => fetchWithAuth(`/admin/lessons/${id}`, { method: 'DELETE' }),
  },

  // AI Service Endpoints
  ai: {
    explainDoubt: (data: { topicName: string; subjectName?: string; studentDoubt: string; currentMasteryScore?: number }) =>
      fetchWithAuth('/ai/explain', { method: 'POST', body: JSON.stringify(data) }),
    getStatus: () => fetchWithAuth('/ai/status'),
  },
};
