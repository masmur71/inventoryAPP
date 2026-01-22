import type { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';

export class OrderController {
  
  // 1. Create Order
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const order = await OrderService.createOrder(userId, req.body);
      res.status(201).json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  // 2. Get List Orders
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user;
      const orders = await OrderService.getAllOrders(userId, role);
      res.status(200).json({ status: 'success', data: orders });
    } catch (error) {
      next(error);
    }
  }

  // 3. Get Detail Order
  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user;
      
      
      const id = req.params.id as string; 

      const order = await OrderService.getOrderById(id, userId, role);
      
      res.status(200).json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  // 4. Cancel Order
  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user;
      
    
      const id = req.params.id as string;
      
      const { reason } = req.body;

      const order = await OrderService.cancelOrder(id, userId, role, reason);
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Order cancelled successfully and stock restored',
        data: order 
      });
    } catch (error) {
      next(error);
    }
  }

  // 5. Update Status (Staff Only)
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // PERBAIKAN DI SINI:
      const id = req.params.id as string;
      
      const { status } = req.body;

      const order = await OrderService.updateStatus(id, status);
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Order status updated',
        data: order 
      });
    } catch (error) {
      next(error);
    }
  }
}