import type { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { AppError } from '../../common/utils/AppError.js';
import { Warehouse } from './models/warehouse.model.js';
import { Product } from './models/product.model.js';


export class InventoryController {
  

  //WAREHOUSES //
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

  static async getWarehouseById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid warehouse id',
      });
    }

    const warehouse = await InventoryService.getWarehouseById(id);

    res.status(200).json({
      status: 'success',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
}

static async updateWarehouse(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid warehouse id',
      });
    }

    const warehouse = await InventoryService.updateWarehouse(id, req.body);

    res.status(200).json({
      status: 'success',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
}

static async deleteWarehouse(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid warehouse id',
      });
    }

    await InventoryService.deleteWarehouse(id);

    res.status(200).json({
      status: 'success',
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

    // PRODUCTS & STOCK //
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

  static async getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product id',
      });
    }

    const product = await InventoryService.getProductById(id);

    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

static async updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product id',
      });
    }

    const product = await InventoryService.updateProduct(id, req.body);

    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

static async deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product id',
      });
    }

    await InventoryService.deleteProduct(id);

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      // useId from token(via authMiddleware)
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

  static async getStockByWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId } = req.params;
      const stocks = await InventoryService.getStockByWarehouse(warehouseId as string);
      
      res.status(200).json({ 
        status: 'success', 
        data: stocks 
      });
    } catch (error) {
      next(error);
    }
  }
}