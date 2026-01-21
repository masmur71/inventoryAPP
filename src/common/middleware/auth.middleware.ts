import type { Request, Response, NextFunction } from 'express';
import  { verifyAccessToken } from '../utils/jwt.js';
import  type { TokenPayload } from '../utils/jwt.js'; // Pastikan export TokenPayload ada di jwt.ts
import redis from '../../config/redis.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../../modules/users/models/user.model.js';

// Extend Express Request Type agar TypeScript mengenali 'req.user'
declare global {
  namespace Express {
    interface Request {
      user: TokenPayload; // Sekarang req.user punya type yang jelas
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Ambil Token dari Header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // 2. Cek Redis Blacklist (Logout check)
    // Ingat: redis.get return string | null
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
      throw new AppError('Unauthorized: Token revoked (Logged out)', 401);
    }

    // 3. Verify Signature JWT
    const decoded = verifyAccessToken(token as string); 
    // decoded bisa null jika expired/invalid signature
    if (!decoded) {
      throw new AppError('Unauthorized: Invalid or expired token', 401);
    }

    // 4. Attach ke Request Object
    req.user = decoded; 
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware RBAC (Permission Check)
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.user dijamin ada karena middleware ini dipasang SETELAH authenticate
      if (!req.user) throw new AppError('Unauthorized', 401);

      // Kita ambil Role lengkap dari DB untuk cek permission terbaru
      // (Ini lebih aman daripada simpan permission di token, takutnya permission diubah admin saat user sedang login)
      const user = await User.findById(req.user.userId).populate('role');
      
      if (!user || !user.role) {
        throw new AppError('User role not found', 403);
      }

      const userRole = user.role as any; // Casting ke Role Model

      if (!userRole.permissions.includes(requiredPermission) && !userRole.permissions.includes('all')) {
        throw new AppError(`Forbidden: You need permission '${requiredPermission}'`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};