import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { globalLimiter } from './middlewares/rateLimiter';
import { authenticate, optionalAuthenticate } from './middlewares/auth.middleware';
import { maintenanceCheck } from './middlewares/maintenance.middleware';
import { notFound, errorHandler } from './middlewares/errorHandler';
import router from './routes/index';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      mediaSrc: ["'self'", 'blob:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS — strict origin equality to prevent prefix-bypass attacks
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // normalize: trim + strip trailing slash

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);
    // Strict equality check after normalizing the incoming origin
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
app.use(globalLimiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  etag: true,
}));

// Optional auth for maintenance check
app.use(optionalAuthenticate);
app.use(maintenanceCheck);

// Health check (for Render)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', router);

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild, { maxAge: '1d' }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
