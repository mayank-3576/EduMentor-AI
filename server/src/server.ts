import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSchema } from './db/index.js';

import authRoutes from './routes/auth.js';
import curriculumRoutes from './routes/curriculum.js';
import subjectsRoutes from './routes/subjects.js';
import unitsRoutes from './routes/units.js';
import topicsRoutes from './routes/topics.js';
import lessonsRoutes from './routes/lessons.js';
import quizzesRoutes from './routes/quizzes.js';
import testsRoutes from './routes/tests.js';
import pyqRoutes from './routes/pyq.js';
import studentRoutes from './routes/student.js';
import recommendationsRoutes from './routes/recommendations.js';
import dsaRoutes from './routes/dsa.js';
import resourcesRoutes from './routes/resources.js';
import learningPathsRoutes from './routes/learningPaths.js';
import searchRoutes from './routes/search.js';
import teacherRoutes from './routes/teacher.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Schema
initSchema();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/pyq', pyqRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/learning-paths', learningPathsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EDUMENTOR AI',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduMentor AI Backend Server running at http://localhost:${PORT}`);
});

export default app;
