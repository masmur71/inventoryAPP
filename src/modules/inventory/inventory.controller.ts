import type { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';

export class InventoryController {
  
  static async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.createWarehouse(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  static async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getWarehouses();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.createProduct(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getProducts(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil userId dari token (via authMiddleware)
      const userId = req.user.userId;
      
      const result = await InventoryService.adjustStock({
        ...req.body,
        userId
      });
      
      res.status(200).json({ status: 'success', data: result, message: 'Stock adjusted successfully' });
    } catch (error) { next(error); }
  }

  static async getStock(req: Request, res: Response, next: NextFunction) {
    try {
       const { warehouseId } = req.params;
       const data = await InventoryService.getStockByWarehouse(warehouseId as string);
       res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }
}