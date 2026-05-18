import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware';
import helmet from 'helmet';
import 'express-async-errors';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import authRoutes from './modules/auth/auth.routes';
import classesRoutes from './modules/classes/classes.routes';
import questionsRoutes from './modules/questions/questions.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import parentRoutes from './modules/parent/parent.routes';

app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/parents', parentRoutes);

// Add error handler as the last middleware
app.use(errorHandler);

export default app;
