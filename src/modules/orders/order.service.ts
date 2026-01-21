import mongoose from 'mongoose';
import { Order } from './models/order.model.js';
import { Product } from '../inventory/models/product.model.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { acquireLock, releaseLock } from '../../common/utils/redisLock.js';
import { AppError } from '../../common/utils/AppError.js';
import type { CreateOrderDTO } from './order.schema.js';

export class OrderService {
  
  static async createOrder(userId: string, data: CreateOrderDTO) {
    const { warehouseId, items, customerName } = data;
    
    // Generate lock keys per product per warehouse
    const lockKeys = items.map(item => `lock:order:${warehouseId}:${item.productId}`);
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Acquire Redis Locks
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

  static async getOrders() {
    return await Order.find()
      .populate('items.product', 'name sku')
      .populate('warehouse', 'name code')
      .sort({ createdAt: -1 });
  }
}