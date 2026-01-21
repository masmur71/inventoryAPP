import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
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