import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createProductSchema, createWarehouseSchema, adjustStockSchema } from './inventory.schema.js';

const router = Router();

// Semua route di bawah butuh login
router.use(authenticate);

// Warehouses
router.post('/warehouses', requirePermission('inventory.manage'), validate(createWarehouseSchema), InventoryController.createWarehouse);
router.get('/warehouses', InventoryController.getWarehouses);

// Products
router.post('/products', requirePermission('inventory.manage'), validate(createProductSchema), InventoryController.createProduct);
router.get('/products', InventoryController.getProducts);

// Stocks (The Core)
router.post('/adjust', requirePermission('stock.adjust'), validate(adjustStockSchema), InventoryController.adjustStock);
router.get('/stock/:warehouseId', InventoryController.getStock);

export default router;