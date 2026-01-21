import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app: Application = express();

// Middleware Global
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS
app.use(helmet()); // Security Headers
app.use(morgan('dev')); // HTTP Request Logger

// Basic Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Enterprise Inventory System API is running',
    timestamp: new Date().toISOString()
  });
});


// app.use('/api/auth', authRoutes);
// app.use('/api/inventory', inventoryRoutes);

export default app;