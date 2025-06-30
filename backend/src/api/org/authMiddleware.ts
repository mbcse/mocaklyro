import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../../common/utils/logger';

interface AuthenticatedRequest extends Request {
  partnerId?: string;
}

export const authenticatePartner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, JWT_SECRET) as { partnerId: string };
    
    req.partnerId = decoded.partnerId;
    next();
  } catch (error: any) {
    Logger.error('AuthMiddleware', 'Token verification failed', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Extend Request type for TypeScript
declare global {
  namespace Express {
    interface Request {
      partnerId?: string;
    }
  }
} 