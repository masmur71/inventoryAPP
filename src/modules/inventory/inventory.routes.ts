import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createWarehouseSchema,
  createProductSchema,
  adjustStockSchema,
  updateWarehouseSchema,
  updateProductSchema,
} from './inventory.schema.js';
import { PERMISSIONS, type Permission } from '../../common/types/permissions.js';

const router = Router();

// Middleware Global: Semua route inventory butuh Login
router.use(authenticate);

const viewOrManageInventory = [
  PERMISSIONS.INVENTORY.VIEW,
  PERMISSIONS.INVENTORY.MANAGE,
] as Permission[];

/**
 * @openapi
 * tags:
 *   name: Inventory
 *   description: Manajemen Gudang, Produk, dan Stok
 */

// ==========================================
// READ OPERATIONS (GET)
// ==========================================

/**
 * @openapi
 * /api/inventory/warehouses:
 *   get:
 *     tags: [Inventory]
 *     summary: Daftar Semua Gudang
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List gudang berhasil diambil
 */
router.get(
  '/warehouses',
  requirePermission(viewOrManageInventory),
  (req, res, next) => InventoryController.getWarehouses(req, res, next)
);

/**
 * @openapi
 * /api/inventory/warehouses/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Detail Gudang
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail gudang ditemukan
 *       404:
 *         description: Gudang tidak ditemukan
 */
router.get(
  '/warehouses/:id',
  requirePermission(viewOrManageInventory),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.getWarehouseById(req, res, next)
);

/**
 * @openapi
 * /api/inventory/products:
 *   get:
 *     tags: [Inventory]
 *     summary: Daftar Semua Produk
 *     responses:
 *       200:
 *         description: List produk berhasil diambil
 */
router.get(
  '/products',
  requirePermission(viewOrManageInventory),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.getProducts(req, res, next)
);

/**
 * @openapi
 * /api/inventory/products/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Detail Produk
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail produk ditemukan
 */
router.get(
  '/products/:id',
  requirePermission(viewOrManageInventory),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.getProductById(req, res, next)
);

/**
 * @openapi
 * /api/inventory/stock/{warehouseId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Cek Stok per Gudang
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data stok lengkap dengan detail produk
 */
router.get(
  '/stock/:warehouseId',
  requirePermission(viewOrManageInventory),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.getStockByWarehouse(req, res, next)
);

// ==========================================
// WRITE OPERATIONS - WAREHOUSE (POST, PATCH, DELETE)
// ==========================================

/**
 * @openapi
 * /api/inventory/warehouses:
 *   post:
 *     tags: [Inventory]
 *     summary: Membuat Gudang Baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, address]
 *             properties:
 *               code: { type: string, example: WH-JKT-01 }
 *               name: { type: string, example: Gudang Pusat }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Gudang berhasil dibuat
 */
router.post(
  '/warehouses',
  requirePermission(PERMISSIONS.INVENTORY.MANAGE),
  validate(createWarehouseSchema),
  (req, res, next) => InventoryController.createWarehouse(req, res, next)
);

/**
 * @openapi
 * /api/inventory/warehouses/{id}:
 *   patch:
 *     tags: [Inventory]
 *     summary: Update Gudang
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Gudang berhasil diupdate
 */
router.patch(
  '/warehouses/:id',
  requirePermission(PERMISSIONS.INVENTORY.MANAGE),
  validate(updateWarehouseSchema),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.updateWarehouse(req, res, next)
);

/**
 * @openapi
 * /api/inventory/warehouses/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: Hapus Gudang
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Gudang berhasil dihapus
 */
router.delete(
  '/warehouses/:id',
  requirePermission(PERMISSIONS.INVENTORY.MANAGE),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.deleteWarehouse(req, res, next)
);

// ==========================================
// WRITE OPERATIONS - PRODUCTS (POST, PATCH, DELETE)
// ==========================================

/**
 * @openapi
 * /api/inventory/products:
 *   post:
 *     tags: [Inventory]
 *     summary: Menambah Produk Master
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku, name, price]
 *             properties:
 *               sku: { type: string, example: LAPTOP-001 }
 *               name: { type: string, example: MacBook M3 }
 *               price: { type: number, example: 25000000 }
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 */
router.post(
  '/products',
  requirePermission(PERMISSIONS.INVENTORY.MANAGE),
  validate(createProductSchema),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.createProduct(req, res, next)
);

/**
 * @openapi
 * /api/inventory/products/{id}:
 *   patch:
 *     tags: [Inventory]
 *     summary: Update Produk
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Produk berhasil diupdate
 */
router.patch(
  '/products/:id',
  requirePermission(PERMISSIONS.INVENTORY.MANAGE),
  validate(updateProductSchema),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.updateProduct(req, res, next)
);

/**
 * @openapi
 * /api/inventory/products/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: Hapus Produk
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Produk berhasil dihapus
 */
router.delete(
  '/products/:id',
  requirePermission(PERMISSIONS.INVENTORY.MANAGE),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.deleteProduct(req, res, next)
);

// ==========================================
// STOCK ADJUSTMENT
// ==========================================

/**
 * @openapi
 * /api/inventory/adjust:
 *   post:
 *     tags: [Inventory]
 *     summary: Stock Adjustment (IN/OUT)
 *     description: Mengubah stok secara manual (Barang Masuk / Barang Rusak).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, productId, type, quantity, reason]
 *             properties:
 *               warehouseId: { type: string }
 *               productId: { type: string }
 *               type: { type: string, enum: [IN, OUT] }
 *               quantity: { type: number }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Stok berhasil diupdate
 */
router.post(
  '/adjust',
  requirePermission(PERMISSIONS.STOCK.ADJUST),
  validate(adjustStockSchema),
  (req: Request, res: Response, next: NextFunction) =>
    InventoryController.adjustStock(req, res, next)
);

export default router;
