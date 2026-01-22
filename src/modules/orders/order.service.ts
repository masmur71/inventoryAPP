import mongoose from 'mongoose';
import { Order } from './models/order.model.js';
import { Product } from '../inventory/models/product.model.js';
import { Stock } from '../inventory/models/stock.model.js'; // Import Stock untuk restore
import { InventoryService } from '../inventory/inventory.service.js';
import { acquireLock, releaseLock } from '../../common/utils/redisLock.js';
import { AppError } from '../../common/utils/AppError.js';
import type { CreateOrderDTO } from './order.schema.js';

export class OrderService {
  
  // ==========================================
  // CREATE ORDER (Transaction + Redis Lock)
  // ==========================================
  static async createOrder(userId: string, data: CreateOrderDTO) {
    const { warehouseId, items, customerName } = data;
    
    // Generate lock keys per product per warehouse
    const lockKeys = items.map(item => `lock:order:${warehouseId}:${item.productId}`);
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Acquire Redis Locks (Prevent Race Condition)
      for (const key of lockKeys) {
        await acquireLock(key); 
      }

      let totalAmount = 0;
      const orderItems = [];

      // 2. Process Items (Validate & Adjust Stock)
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);

        // Adjust Stock (Pass session to ensure atomicity)
        // Logika ini akan mengurangi stok (OUT)
        await InventoryService.adjustStock({
          productId: item.productId,
          warehouseId: warehouseId,
          quantity: item.quantity,
          type: 'OUT',
          reason: 'SALE',
          userId: userId,
          notes: `Order processing for ${customerName}`
        }, session);

        totalAmount += product.price * item.quantity;

        orderItems.push({
          product: product._id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });
      }

      // 3. Create Order
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const [newOrder] = await Order.create([{
        orderNumber,
        customerName,
        warehouse: warehouseId,
        items: orderItems,
        totalAmount,
        createdBy: userId,
        status: 'PENDING'
      }], { session });

      await session.commitTransaction();
      return newOrder;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
      // Release all locks
      for (const key of lockKeys) {
        await releaseLock(key); 
      }
    }
  }

  // ==========================================
  // READ OPERATIONS (With Role Check)
  // ==========================================
  static async getAllOrders(userId: string, role: string) {
    // Logic: Admin/Manager/Staff bisa lihat SEMUA. User biasa hanya lihat MILIK SENDIRI.
    const canViewAll = ['admin', 'manager', 'staff'].includes(role);

    const query = canViewAll ? {} : { createdBy: userId };

    return await Order.find(query)
      .sort({ createdAt: -1 }) // Urutkan dari yang terbaru
      .populate('items.product', 'name sku price')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'fullName email') // Info siapa yang buat order
      .select('-__v');
  }

  static async getOrderById(orderId: string, userId: string, role: string) {
    const order = await Order.findById(orderId)
      .populate('items.product', 'name sku price')
      .populate('warehouse', 'name code address')
      .populate('createdBy', 'fullName email')
      .select('-__v');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Security Check: User biasa tidak boleh intip order orang lain
    const canViewAll = ['admin', 'manager', 'staff'].includes(role);
    if (!canViewAll && order.createdBy._id.toString() !== userId) {
      throw new AppError('Forbidden: You do not own this order', 403);
    }

    return order;
  }

  // ==========================================
  // UPDATE OPERATIONS (Cancel & Status)
  // ==========================================

  static async cancelOrder(orderId: string, userId: string, role: string, reason?: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new AppError('Order not found', 404);

      // 1. Security Check: Pastikan yang cancel adalah pemilik atau Admin/Staff
      const canManage = ['admin', 'manager', 'staff'].includes(role);
      if (!canManage && order.createdBy.toString() !== userId) {
        throw new AppError('Forbidden: You cannot cancel this order', 403);
      }

      // 2. Validasi Status: Hanya boleh cancel jika belum dikirim
      if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
        throw new AppError(`Cannot cancel order with status ${order.status}`, 400);
      }

      // 3. Update Status Order
      order.status = 'CANCELLED';
      // Kita bisa simpan alasan di field 'notes' jika schema mendukung, 
      // atau biarkan saja di log aplikasi.
      if (reason) {
          // Asumsi Anda mungkin menambahkan field cancellationReason di schema Order nanti
          // (order as any).cancellationReason = reason; 
      }
      await order.save({ session });

      // 4. RESTORE STOCK (Kembalikan barang ke gudang)
      // Kita loop setiap item dan kembalikan quantity-nya ke Stock model
      for (const item of order.items) {
        await Stock.findOneAndUpdate(
          { warehouse: order.warehouse, product: item.product },
          { $inc: { quantity: item.quantity } }, // Increment (Tambah Balik)
          { session }
        );
      }

      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateStatus(orderId: string, newStatus: string) {
    // Method ini dipanggil oleh Controller yang sudah diproteksi 'requirePermission(ORDER.MANAGE)'
    // Jadi kita asumsikan yang akses pasti Staff/Admin.

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { status: newStatus },
      { new: true, runValidators: true }
    );

    if (!order) throw new AppError('Order not found', 404);
    return order;
  }
}