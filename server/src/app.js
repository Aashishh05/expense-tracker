const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

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
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/stats', statsRoutes);

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
