import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createOrderSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
} from './order.schema.js';
import { PERMISSIONS, type Permission } from '../../common/types/permissions.js';

const router = Router();

// Middleware Global: Semua route order butuh Login
router.use(authenticate);

// --- PERMISSION HELPERS (Type Safe) ---

// User biasa (VIEW) atau Staff (MANAGE) boleh melihat list/detail
const canView = [
  PERMISSIONS.ORDER.VIEW,
  PERMISSIONS.ORDER.MANAGE,
] as Permission[];

// User (CREATE) atau Staff (MANAGE) boleh cancel order
// (User cancel punya sendiri, Staff cancel punya orang lain)
const canCreateOrManage = [
  PERMISSIONS.ORDER.CREATE,
  PERMISSIONS.ORDER.MANAGE,
] as Permission[];

// Hanya Staff yang boleh update status pengiriman
const onlyStaff = PERMISSIONS.ORDER.MANAGE;

// ==========================================
// ROUTE DEFINITIONS
// ==========================================

/**
 * @openapi
 * tags:
 *   name: Orders
 *   description: Manajemen Transaksi Order
 */

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List Orders
 *     description: Mengambil daftar order. Admin/Staff melihat semua, User hanya melihat miliknya sendiri.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List order berhasil diambil
 */
router.get(
  '/',
  requirePermission(canView),
  (req: Request, res: Response, next: NextFunction) =>
    OrderController.getOrders(req, res, next)
);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create New Order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, customerName, items]
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 example: 65f2a...
 *               customerName:
 *                 type: string
 *                 example: Budi Santoso
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 65f2b...
 *                     quantity:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.ORDER.CREATE),
  validate(createOrderSchema),
  (req: Request, res: Response, next: NextFunction) =>
    OrderController.createOrder(req, res, next)
);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Detail Order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail order ditemukan
 *       403:
 *         description: Forbidden (Bukan milik anda)
 *       404:
 *         description: Order tidak ditemukan
 */
router.get(
  '/:id',
  requirePermission(canView),
  (req: Request, res: Response, next: NextFunction) =>
    OrderController.getOrderById(req, res, next)
);

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel Order
 *     description: Membatalkan order & mengembalikan stok. Hanya bisa jika status PENDING/PROCESSED.
 *     security:
 *       - bearerAuth: []
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
 *               reason:
 *                 type: string
 *                 example: Salah pesan barang
 *     responses:
 *       200:
 *         description: Order cancelled & stock restored
 *       400:
 *         description: Cannot cancel (Status already shipped/cancelled)
 */
router.patch(
  '/:id/cancel',
  requirePermission(canCreateOrManage),
  validate(cancelOrderSchema),
  (req: Request, res: Response, next: NextFunction) =>
    OrderController.cancelOrder(req, res, next)
);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update Status Order (Staff Only)
 *     description: Mengubah status logistik (misal PENDING -> SHIPPED).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSED, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden (Not Staff)
 */
router.patch(
  '/:id/status',
  requirePermission(onlyStaff),
  validate(updateOrderStatusSchema),
  (req: Request, res: Response, next: NextFunction) =>
    OrderController.updateStatus(req, res, next)
);

export default router;
