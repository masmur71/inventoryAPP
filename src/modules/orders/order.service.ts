import mongoose from 'mongoose';
import { Order } from './models/order.model.js';
import { Product } from '../inventory/models/product.model.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { acquireLock, releaseLock } from '../../common/utils/redisLock.js';
import { AppError } from '../../common/utils/AppError.js';
import { generateOrderNumber } from '../../common/utils/orderHelper.js';
import type { CreateOrderDTO } from './order.schema.js';

export class OrderService {
  
  static async createOrder(userId: string, data: CreateOrderDTO) {
    const { warehouseId, items, customerName } = data;
    
    // 1. Key for redis lock per item
   
    const lockKeys = items.map(item => `lock:order:${warehouseId}:${item.productId}`);
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 2. ACQUIRE LOCKS (Distributed Locking)
      // loop and acquire locks (throw error).
      for (const key of lockKeys) {
        await acquireLock(key); 
      }

      let totalAmount = 0;
      const orderItems = [];

      // 3. PROCESS ITEMS
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);

        // A. cut stock via InventoryService

        await InventoryService.adjustStock({
          productId: item.productId,
          warehouseId: warehouseId,
          quantity: item.quantity,
          type: 'OUT',
          reason: 'SALE',
          userId: userId,
          notes: `Order processing for ${customerName}`
        }, session)?:mongoose.ClientSession;

        // B. snapshot price & calculate total
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          product: product._id,
          sku: product.sku,
          name: product.name,
          price: product.price, // price is locked at order time(snapshot)
          quantity: item.quantity
        });
      }

      // 4. SAVE ORDER
      const [newOrder] = await Order.create([{
        orderNumber: generateOrderNumber(),
        customerName,
        warehouse: warehouseId,
        items: orderItems,
        totalAmount,
        createdBy: userId,
        status: 'PENDING'
      }], { session });

      // 5. COMMIT TRANSACTION 
      await session.commitTransaction();
      
      return newOrder;

    } catch (error) {
      // 6. ROLLBACK TRANSACTION 
      await session.abortTransaction();
      throw error;
    } finally {
      // 7. CLEANUP 
      session.endSession();
      // clean up: release all locks(so other process can access)
      for (const key of lockKeys) {
        await releaseLock(key); 
      }
    }
  }

  static async getOrders() {
    // Populate product details & warehouse info
    return await Order.find()
      .populate('items.product', 'name sku')
      .populate('warehouse', 'name code')
      .sort({ createdAt: -1 });
  }
}