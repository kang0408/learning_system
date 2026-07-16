import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware';
import helmet from 'helmet';
import 'express-async-errors';
import authRoutes from './modules/auth/auth.routes';
import classesRoutes from './modules/classes/classes.routes';
import questionsRoutes from './modules/questions/questions.routes';
import topicsRoutes from './modules/topics/topics.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import parentRoutes from './modules/parent/parent.routes';
import usersRoutes from './modules/users/users.routes';
import sm2Routes from './modules/sm2/sm2.routes';
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false, // allow serving images cross-origin if needed
}));
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public')); // Serve static files

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/sm2', sm2Routes);

import * as Sentry from '@sentry/node';

// Add Sentry error handler
Sentry.setupExpressErrorHandler(app);

// Add custom error handler as the last middleware
app.use(errorHandler);

export default app;
