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

app.use('/api/auth', authRoutes);

// Add error handler as the last middleware
app.use(errorHandler);

export default app;
