import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import resultsRoutes from './routes/results.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/results', resultsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: process.env.AI_PROVIDER || 'demo' });
});

// Error handler
app.use(errorHandler);

export default app;
