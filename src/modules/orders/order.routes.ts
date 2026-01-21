import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createOrderSchema } from './order.schema.js';

const router = Router();


router.use(authenticate);
/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Transaksi Pembelian Barang
 */


// Create Order 
/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Membuat Order Baru (Transaksi)
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Membuat order akan otomatis:
 *       1. Mengunci stok (Redis Lock).
 *       2. Mengurangi stok fisik di Gudang.
 *       3. Mencatat mutasi 'ORDER'.
 *       4. Menggunakan ACID Transaction (Rollback jika gagal).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouseId
 *               - items
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 description: ID Gudang tempat barang diambil
 *                 example: 65a123...
 *               customerName:
 *                 type: string
 *                 example: Sultan Andara
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 65b456...
 *                     quantity:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderNumber:
 *                       type: string
 *                       example: ORD-1705881234
 *                     totalAmount:
 *                       type: number
 *                       example: 50000000
 *       400:
 *         description: Stok tidak mencukupi
 *       409:
 *         description: Konflik Resource (sedang dikunci user lain)
 */
router.post('/', 
  requirePermission('order.create'), 
  validate(createOrderSchema), 
  OrderController.createOrder
);


router.get('/', 
  // requirePermission('order.view'), 
  OrderController.getOrders
);

export default router;