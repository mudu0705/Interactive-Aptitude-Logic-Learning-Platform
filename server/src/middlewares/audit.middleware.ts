import { Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { AuthRequest } from './auth.middleware';

export const auditLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Capture details on request completion
  res.on('finish', async () => {
    try {
      // Restrict logging to API queries to prevent database bloat from client bundles
      if (req.originalUrl.startsWith('/api')) {
        await prisma.auditLog.create({
          data: {
            userId: req.user?.id || null,
            ipAddress: req.ip || req.socket.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
          },
        });
      }
    } catch (error) {
      console.error('[Audit Logging Error] Failed to write access log:', error);
    }
  });

  next();
};
