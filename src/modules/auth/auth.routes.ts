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

// Public Routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);

// Protected Routes
router.post('/logout', authenticate, AuthController.logout);

export default router;