import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import express, { type Express } from 'express';

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import budgetRoutes from './routes/budgetRoutes';
import recurringRoutes from './routes/recurringRoutes';
import statsRoutes from './routes/statsRoutes';
import { generalLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/errorMiddleware';

const app: Express = express();

// Behind one proxy (Render, Railway, etc.) so rate limiting sees real IPs.
app.set('trust proxy', 1);

// Security & parsing
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('tiny'));
} else {
  app.use(morgan('dev'));
}

// Gentle global rate limit, stricter one on auth routes (see authRoutes).
app.use('/api', generalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/stats', statsRoutes);

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

export default app;
