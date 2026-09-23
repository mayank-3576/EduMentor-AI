import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { GlobalSearchModal } from './components/GlobalSearchModal.js';

// Auth Pages
import { Login } from './pages/auth/Login.js';
import { Register } from './pages/auth/Register.js';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard.js';
import { BrowseSubjects } from './pages/student/BrowseSubjects.js';
import { SubjectDetail } from './pages/student/SubjectDetail.js';
import { TopicDetail } from './pages/student/TopicDetail.js';
import { LessonView } from './pages/student/LessonView.js';
import { QuizTake } from './pages/student/QuizTake.js';
import { QuizResult } from './pages/student/QuizResult.js';
import { PYQExplorer } from './pages/student/PYQExplorer.js';
import { RecommendationsPage } from './pages/student/RecommendationsPage.js';
import { DSAPage } from './pages/student/DSAPage.js';
import { CodingProblemPage } from './pages/student/CodingProblemPage.js';
import { LearningPathsPage } from './pages/student/LearningPathsPage.js';
import { StudentAnalyticsPage } from './pages/student/StudentAnalyticsPage.js';
import { ProfilePage } from './pages/student/ProfilePage.js';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.js';
import { TeacherQuestionBank } from './pages/teacher/TeacherQuestionBank.js';
import { TeacherQuizBuilder } from './pages/teacher/TeacherQuizBuilder.js';
import { TeacherResources } from './pages/teacher/TeacherResources.js';
import { StudentPerformanceView } from './pages/teacher/StudentPerformanceView.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminUsers } from './pages/admin/AdminUsers.js';
import { AdminCurriculum } from './pages/admin/AdminCurriculum.js';
import { AdminQuizzes } from './pages/admin/AdminQuizzes.js';
import { AdminAnalytics } from './pages/admin/AdminAnalytics.js';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {user && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Root router */}
            <Route
              path="/"
              element={
                user?.role === 'teacher' ? (
                  <Navigate to="/teacher/dashboard" replace />
                ) : user?.role === 'admin' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <BrowseSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <SubjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/topics/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <TopicDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <LessonView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <QuizTake />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes/result/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <QuizResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pyq"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <PYQExplorer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <RecommendationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dsa"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <DSAPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coding"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <DSAPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coding/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <CodingProblemPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-paths"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <LearningPathsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-paths/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <LearningPathsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Teacher Protected Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/questions"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherQuestionBank />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quizzes"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherQuizBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/resources"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherResources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <StudentPerformanceView />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/curriculum"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCurriculum />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quizzes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminQuizzes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TeacherResources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/problems"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DSAPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
