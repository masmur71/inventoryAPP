import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import type { Request, Response, NextFunction } from 'express';
import { 
  loginSchema, 
  registerSchema, 
  refreshTokenSchema 
} from './auth.schema.js';

const router = Router();

/**
 * @openapi
 * tags:
 *      name: Auth
 *      description: Manajemen Registrasi dan Login User
 */

// Public Routes
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Mendaftarkan user baru
 *     description: User baru akan otomatis mendapatkan role 'staff'.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Budi Santoso
 *               email:
 *                 type: string
 *                 format: email
 *                 example: budi@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: rahasia123
 *     responses:
 *       201:
 *         description: Register berhasil
 *       400:
 *         description: Email sudah terdaftar atau input tidak valid
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     description: Mengembalikan Access Token dan Refresh Token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: budi@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: rahasia123
 *     responses:
 *       200:
 *         description: Login sukses
 *       401:
 *         description: Email atau password salah
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Cek Profil Saya
 *     description: Mengambil data user yang sedang login berdasarkan Token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil user ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: admin
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Token tidak valid / Belum login
 */
router.get(
  '/me',
  authenticate, // Wajib login
  (req: Request, res: Response, next: NextFunction) => AuthController.getMe(req, res, next)
);


/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh Access Token
 *     description: Menghasilkan access token baru menggunakan refresh token yang valid.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Access token berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Refresh token tidak valid
 *       401:
 *         description: Refresh token expired atau tidak sah
 */

router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);

// Protected Routes
/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     description: Memasukkan token ke blacklist Redis.
 *     responses:
 *       200:
 *         description: Logout berhasil
 *       401:
 *         description: Token tidak valid atau tidak ada
 */
router.post('/logout', authenticate, AuthController.logout);


export default router;