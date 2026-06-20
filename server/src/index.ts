import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import apiRouter from './routes';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { auditLogger } from './middlewares/audit.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off CSP for single-server SPA simplicity or customize as needed
  })
);

// CORS config
const corsOptions = {
  origin: NODE_ENV === 'production' ? false : '*', // CORS disabled in production as we serve static client files directly
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate Limiting (Prevent DDoS/Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request Parsing & Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(auditLogger);

// Health Check API
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  });
});

// Mounting API routes
app.use('/api', apiRouter);

// Serve Client built assets in production
if (NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  // Catch-all route to serve Index HTML for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Aptitude & Logic Platform Backend Running in Development Mode.');
  });
}

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} in ${NODE_ENV} mode.`);
});
