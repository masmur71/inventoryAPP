import mongoose from 'mongoose';
import { Product } from './models/product.model.js';
import { Warehouse } from './models/warehouse.model.js';
import { Stock } from './models/stock.model.js'; 
import type{ IStock } from './models/stock.model.js';// Pastikan import IStock
import { StockMutation } from './models/mutation.model.js';
import { AppError } from '../../common/utils/AppError.js';

export class InventoryService {
  
  // --- Master Data ---

  static async createWarehouse(data: any) {
    const exists = await Warehouse.findOne({ code: data.code });
    if (exists) throw new AppError('Warehouse code already exists', 400);
    return await Warehouse.create(data);
  }

  static async getWarehouses() {
    return await Warehouse.find();
  }

  static async createProduct(data: any) {
    const exists = await Product.findOne({ sku: data.sku });
    if (exists) throw new AppError('Product SKU already exists', 400);
    return await Product.create(data);
  }

  static async getProducts(query: any) {
    return await Product.find({ isDeleted: false });
  }

  // --- CORE LOGIC: STOCK MUTATION ---
  
  static async adjustStock(data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    type: 'IN' | 'OUT';
    reason: string;
    notes?: string;
    userId: string;
  }, externalSession?: mongoose.ClientSession) { 
    
    const session = externalSession || await mongoose.startSession();
    if (!externalSession) session.startTransaction();

    try {
      // FIX 1: Definisikan tipe variabel secara eksplisit agar support 'undefined' dan 'null'
      let stock: IStock | null | undefined = await Stock.findOne({ 
        product: data.productId, 
        warehouse: data.warehouseId 
      }).session(session);

      if (!stock) {
        // create mengembalikan array (hydrated documents)
        const newStocks = await Stock.create([{
          product: data.productId,
          warehouse: data.warehouseId,
          quantity: 0
        }], { session });
        
        // TypeScript strict menganggap akses array [0] bisa undefined
        stock = newStocks[0];
      }

      // Type Guard
      if (!stock) throw new AppError('Failed to initialize stock', 500);

      let newQuantity = stock.quantity;
      if (data.type === 'IN') {
        newQuantity += data.quantity;
      } else {
        if (stock.quantity < data.quantity) {
          throw new AppError(`Insufficient stock. Current: ${stock.quantity}`, 400);
        }
        newQuantity -= data.quantity;
      }

      stock.quantity = newQuantity;
      await stock.save({ session });

      // FIX 2: Handle field 'notes' agar tidak undefined
      // Mongoose strict type menolak 'undefined' eksplisit. Kita ganti string kosong jika tidak ada.
      await StockMutation.create([{
        stock: stock._id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        performedBy: data.userId,
        notes: data.notes || '', // <--- Mencegah error "Type undefined is not assignable"
      }], { session });

      if (!externalSession) {
        await session.commitTransaction();
      }
      
      return stock;

    } catch (error) {
      if (!externalSession) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (!externalSession) {
        session.endSession();
      }
    }
  }

  static async getStockByWarehouse(warehouseId: string) {
    return await Stock.find({ warehouse: warehouseId })
      .populate('product', 'name sku price')
      .populate('warehouse', 'name code');
  }
}