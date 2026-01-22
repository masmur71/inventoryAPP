import mongoose from 'mongoose';
import { Product } from './models/product.model.js';
import { Warehouse } from './models/warehouse.model.js';
import { Stock } from './models/stock.model.js'; 
import type{ IStock } from './models/stock.model.js';// Pastikan import IStock
import { StockMutation } from './models/mutation.model.js';
import { AppError } from '../../common/utils/AppError.js';

export class InventoryService {
  
  // --- Master Data ---

  //WAREHOUSES //

  static async createWarehouse(data: any) {
    const exists = await Warehouse.findOne({ code: data.code });
    if (exists) throw new AppError('Warehouse code already exists', 400);
    return await Warehouse.create(data);
  }

  static async getAllWarehouses() {
    return await Warehouse.find().select('-__v');
  }

  static async getWarehouseById(id: string) {
    const warehouse = await Warehouse.findById(id).select('-__v');
    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }
    return warehouse;
  }

  static async getWarehouses() {
    return await Warehouse.find();
  }

  static async updateWarehouse(id: string, data: any) {
    const warehouse = await Warehouse.findByIdAndUpdate(id, data, {
      new: true, // Return data yang sudah diupdate
      runValidators: true // Jalankan validasi Mongoose schema
    });

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }
    return warehouse;
  }

  static async deleteWarehouse(id: string) {
    // Opsional: Cek apakah ada stok tersisa sebelum hapus
    const stockCount = await Stock.countDocuments({ warehouse: id, quantity: { $gt: 0 } });
    if (stockCount > 0) {
      throw new AppError('Cannot delete warehouse with active stock', 400);
    }

    const warehouse = await Warehouse.findByIdAndDelete(id);
    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }
    return warehouse;
  }


  // PRODUCTS & STOCK //

  static async createProduct(data: any) {
    const exists = await Product.findOne({ sku: data.sku });
    if (exists) throw new AppError('Product SKU already exists', 400);
    return await Product.create(data);
  }

  static async getProducts(query: any) {
    return await Product.find({ isDeleted: false });
  }

  static async getAllProducts() {
    return await Product.find().select('-__v');
  }

  static async getProductById(id: string) {
    const product = await Product.findById(id).select('-__v');
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  static async updateProduct(id: string, data: any) {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  static async deleteProduct(id: string) {
    // Opsional: Cek apakah produk pernah ditransaksikan
    // const hasTransactions = ... (logic cek order history)

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
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