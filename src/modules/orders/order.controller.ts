import type { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';

export class OrderController {
  
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      // from authMiddleware
      const userId = req.user.userId;
      
      const order = await OrderService.createOrder(userId, req.body);
      
      res.status(201).json({ 
        status: 'success', 
        message: 'Order created successfully',
        data: order 
      });
    } catch (error) { next(error); }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await OrderService.getOrders();
      res.status(200).json({ status: 'success', data: orders });
    } catch (error) { next(error); }
  }
}