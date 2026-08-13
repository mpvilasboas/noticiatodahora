import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Notícia Toda Hora - Backend API',
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
