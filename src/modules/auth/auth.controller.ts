import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { User } from '../users/models/user.model.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user diset oleh middleware 'authenticate'
      const userId = (req as any).user.userId;

      // Cari user, tapi JANGAN kirim password.
      // Kita juga populate 'role' agar frontend tahu user ini access level-nya apa
      const user = await User.findById(userId)
        .select('-password -__v') // Exclude password & version key
        .populate('role', 'name permissions');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
        // token from header & body
        const accessToken = req.headers.authorization?.split(' ')[1] || '';
        const { refreshToken } = req.body;
        
        await AuthService.logout(accessToken, refreshToken);
        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
  }
}