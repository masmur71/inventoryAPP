import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './modules/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import { errorHandler } from './common/middleware/errorHandler.js';

const app: Application = express();

// Middleware Global
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS
app.use(helmet()); // Security Headers
app.use(morgan('dev')); // HTTP Request Logger

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health Check
 *     summary: Cek status server
 *     description: Endpoint sederhana untuk memastikan API berjalan dengan normal.
 *     responses:
 *       200:
 *         description: Server is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Enterprise Inventory System API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Enterprise Inventory System API is running',
    timestamp: new Date().toISOString()
  });
});
// Routes


app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);


//Global Error Handler
app.use(errorHandler);


export default app;