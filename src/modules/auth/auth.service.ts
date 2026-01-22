import bcrypt from 'bcryptjs';
import { User } from '../users/models/user.model.js';
import { Role } from '../users/models/role.model.js';
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyRefreshToken 
} from '../../common/utils/jwt.js';
import type { TokenPayload } from '../../common/utils/jwt.js'; // Import Type Payload
import redis from '../../config/redis.js';
import { AppError } from '../../common/utils/AppError.js';
import type { LoginDTO, RegisterDTO } from './auth.schema.js';

export class AuthService {
  
  // Helper private untuk membuang passwordHash dari response
  private static sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;
    delete userObj.__v;
    return userObj;
  }

  // --- NEW: Centralized Token Generation Helper ---
  private static generateTokens(user: any) {
    // Pastikan user.role sudah dipopulate sebelum masuk sini
    const roleName = (user.role as any).name;
    const permissions = (user.role as any).permissions || [];

    const payload: TokenPayload = {
      userId: user._id.toString(),
      role: roleName,
      permissions: permissions // <--- INJECT PERMISSION KE SINI
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  static async register(data: RegisterDTO) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) throw new AppError('Email already exists', 400);

    const role = await Role.findOne({ name: 'staff' }); 
    if (!role) throw new AppError('Default role (staff) not found. Please run seeder.', 500);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await User.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: role._id,
    });

    // Kita return user saja (Login terpisah), atau bisa generate token disini jika mau auto-login
    return this.sanitizeUser(newUser);
  }

  static async login(data: LoginDTO) {
    // Wajib populate role & permissions agar bisa masuk ke token
    const user = await User.findOne({ email: data.email }).populate('role');
    
    // Cek User & Password
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    // Generate Tokens menggunakan Helper baru
    const { accessToken, refreshToken } = this.generateTokens(user);

    return { 
      accessToken, 
      refreshToken, 
      user: this.sanitizeUser(user) 
    };
  }

  static async refreshToken(token: string) {
    // 1. Check Blacklist
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) throw new AppError('Refresh token revoked', 401);

    // 2. Verify Signature
    const decoded = verifyRefreshToken(token);
    if (!decoded) throw new AppError('Invalid refresh token', 401);

    // 3. Cek User Valid & Ambil Role Terbaru (Penting jika permission berubah di tengah jalan)
    const user = await User.findById(decoded.userId).populate('role');
    if (!user) throw new AppError('User not found', 401);

    // 4. Generate NEW Access Token (Dengan Permission terbaru)
    // Kita gunakan logic manual sedikit karena refreshToken biasanya tidak diganti (rotation optional)
    const payload: TokenPayload = {
        userId: user._id.toString(),
        role: (user.role as any).name,
        permissions: (user.role as any).permissions || []
    };
    
    const newAccessToken = signAccessToken(payload);
  
    return { accessToken: newAccessToken };
  }

  static async logout(accessToken: string, refreshToken: string) {
    // Blacklist tokens
    // Access token (15m), Refresh token (7d)
    if (accessToken) await redis.set(`bl_${accessToken}`, 'true', 'EX', 15 * 60); 
    if (refreshToken) await redis.set(`bl_${refreshToken}`, 'true', 'EX', 7 * 24 * 60 * 60);
  }
}