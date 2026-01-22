import type { Request, Response, NextFunction } from 'express';
import  { verifyAccessToken } from '../utils/jwt.js';
import  type { TokenPayload } from '../utils/jwt.js'; 
import redis from '../../config/redis.js';
import { AppError } from '../utils/AppError.js';
import type { Permission } from '../types/permissions.js';
import { User } from '../../modules/users/models/user.model.js';

// Extend Express Request Type 
declare global {
  namespace Express {
    interface Request {
      user: TokenPayload; 
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
export const requirePermission = (requiredPermissions: Permission | Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      // 1. Normalisasi input jadi Array agar seragam
      const required = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // 2. Ambil permission dari Token (req.user) - CEPAT ⚡
      let userPermissions = req.user.permissions || [];

      // 3. FALLBACK: Jika Token lama (belum ada permission), ambil dari DB - LAMBAT 🐢
      // Ini menjaga agar user yang tokennya belum expired tidak error tiba-tiba
      if (userPermissions.length === 0) {
         const { User } = await import('../../modules/users/models/user.model.js');
         const user = await User.findById(req.user.userId).populate('role');
         if (user && user.role) {
            userPermissions = (user.role as any).permissions;
         }
      }

      // 4. Logic Pengecekan
      // Super Admin selalu boleh ('all')
      if (userPermissions.includes('all')) {
        return next();
      }

      // Cek apakah punya SALAH SATU permission yang diminta (OR Logic)
      const hasPermission = required.some(p => userPermissions.includes(p as any));

      if (!hasPermission) {
        throw new AppError(`Forbidden: You need one of these permissions: [${required.join(', ')}]`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};