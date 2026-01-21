import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createProductSchema, createWarehouseSchema, adjustStockSchema } from './inventory.schema.js';

const router = Router();

//all routes here are protected
router.use(authenticate);
/**
 * @openapi
 * tags:
 *   - name: Inventory
 *     description: Manajemen Gudang, Produk, dan Stok
 */

// Warehouses
/**
 * @openapi
 * /api/inventory/warehouses:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Membuat Gudang Baru
 *     security:
 *       - bearerAuth: []
 *     description: Hanya user dengan permission 'inventory.manage' (Admin) yang bisa akses.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - address
 *             properties:
 *               code:
 *                 type: string
 *                 example: WH-JKT-01
 *               name:
 *                 type: string
 *                 example: Gudang Pusat Jakarta
 *               address:
 *                 type: string
 *                 example: Jl. Sudirman No. 1
 *     responses:
 *       201:
 *         description: Gudang berhasil dibuat
 *       403:
 *         description: Forbidden (Bukan Admin)
 */
router.post('/warehouses', requirePermission('inventory.manage'), validate(createWarehouseSchema), InventoryController.createWarehouse);
router.get('/warehouses', InventoryController.getWarehouses);

// Products
/**
 * @openapi
 * /api/inventory/products:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Menambah Produk Master Baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - price
 *             properties:
 *               sku:
 *                 type: string
 *                 example: LAPTOP-001
 *               name:
 *                 type: string
 *                 example: MacBook Pro M3
 *               price:
 *                 type: number
 *                 example: 25000000
 *               description:
 *                 type: string
 *                 example: Laptop high-end untuk developer
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 */

router.post('/products', requirePermission('inventory.manage'), validate(createProductSchema), InventoryController.createProduct);
router.get('/products', InventoryController.getProducts);

// Stocks (The Core)
/**
 * @openapi
 * /api/inventory/adjust:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Stock Adjustment (Masuk/Keluar Barang)
 *     security:
 *       - bearerAuth: []
 *     description: Endpoint utama untuk mengubah stok.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouseId
 *               - productId
 *               - type
 *               - quantity
 *               - reason
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 example: 65a123...
 *               productId:
 *                 type: string
 *                 example: 65b456...
 *               type:
 *                 type: string
 *                 enum: [IN, OUT]
 *               quantity:
 *                 type: number
 *                 example: 50
 *               reason:
 *                 type: string
 *                 example: PURCHASE
 *               notes:
 *                 type: string
 *                 example: Restock bulanan
 *     responses:
 *       200:
 *         description: Stok berhasil diupdate
 *       400:
 *         description: Stok tidak cukup
 */

router.post('/adjust', requirePermission('stock.adjust'), validate(adjustStockSchema), InventoryController.adjustStock);
router.get('/stock/:warehouseId', InventoryController.getStock);

export default router;