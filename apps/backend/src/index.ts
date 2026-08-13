import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import reportRoutes from './routes/report.routes.js';
import { helmetSecurityHeaders, globalRateLimiter } from './middleware/security.middleware.js';

const app = express();

// 1. Helmet Security Headers (HSTS, CSP, XSS Protection, No-Sniff)
app.use(helmetSecurityHeaders);

// 2. Global Rate Limiter (100 reqs / 15 min)
app.use(globalRateLimiter);

// 3. Strict CORS Configuration
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://noticiatodahora.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients or matching trusted origin pattern
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Origem bloqueada pela política estrita de CORS.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Cookie Parser & Body Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Notícia Toda Hora - Backend API (DevSecOps Protected)',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      healthcheck: 'GET /health',
      submitReport: 'POST /api/reports/process'
    }
  });
});

// Healthcheck endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'noticiatodahora-backend',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/reports', reportRoutes);

if (!process.env.VERCEL) {
  const PORT = parseInt(ENV.PORT, 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [NoticiaTodaHora Backend] Rodando em http://localhost:${PORT}`);
  });
}

export default app;
