import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

let supabase: any = null;

if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado. Token JWT ausente.' });
    }

    const token = authHeader.split(' ')[1];
    
    // If Supabase URL & Key are configured, verify token with Supabase Auth
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }

      req.user = user;
    } else {
      // MVP Dev Fallback mode when keys are not yet set in .env
      req.user = { id: 'dev-user-id', email: 'jornalista@noticiatodahora.com' };
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Falha na verificação de autenticação.' });
  }
}
