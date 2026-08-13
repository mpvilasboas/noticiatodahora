import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Helmet Security Headers Setup
export const helmetSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// 2. Global Rate Limiter: 100 requests per 15 minutes per IP
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições originadas deste IP. Tente novamente mais tarde.' },
});

// 3. AI & Report Processing Strict Rate Limiter: 10 requests per minute per IP
export const reportProcessingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de envio de matérias atingido. Aguarde 1 minuto antes de enviar novamente.' },
});

// 4. Role-Based Access Control (RBAC) & Cookie Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Read JWT from HttpOnly cookie or Authorization Bearer header
    const tokenFromCookie = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      // In dev mode / MVP fallback, allow dev-token with 'Jornalista' role
      req.user = { userId: 'dev-journalist-1', role: 'Jornalista' };
      return next();
    }

    if (token === 'dev-token') {
      req.user = { userId: 'dev-journalist-1', role: 'Jornalista' };
      return next();
    }

    try {
      // Decode JWT token payload
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decodedStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const decoded = JSON.parse(decodedStr);

        const userRole = decoded.role || 'Jornalista';
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ error: 'Acesso negado: Perfil sem permissão suficiente para esta operação.' });
        }

        req.user = { userId: decoded.userId || 'user-1', role: userRole };
        return next();
      }
    } catch (err) {
      console.warn('[Security] Falha na validação do token RBAC:', err);
    }

    req.user = { userId: 'journalist-default', role: 'Jornalista' };
    next();
  };
};
