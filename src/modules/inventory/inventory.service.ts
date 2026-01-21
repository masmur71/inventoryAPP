import { Product } from './models/product.model.js';
import { Warehouse } from './models/warehouse.model.js';
import { Stock } from './models/stock.model.js';
import { StockMutation } from './models/mutation.model.js';
import { AppError } from '../../common/utils/AppError.js';
import mongoose from 'mongoose';

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
    // Implementasi pagination sederhana bisa ditambahkan disini
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
  }) {
    // Menggunakan Session untuk Transaksi Database (ACID)
    // Agar Update Stock & Create Mutation sukses bersamaan atau gagal bersamaan
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Cari atau Buat Record Stock (Pivot)
      let stock = await Stock.findOne({ 
        product: data.productId, 
        warehouse: data.warehouseId 
      }).session(session);

      if (!stock) {
        // Jika belum ada record stok, buat baru dengan qty 0
        const newStock = await Stock.create([{
          product: data.productId,
          warehouse: data.warehouseId,
          quantity: 0
        }], { session }) as any; // array return karena pakai session
        stock = newStock[0];
      }

      //kalau stock kosong
      if (!stock) throw new AppError('Failed to initialize stock', 500);

      // 2. Hitung Stok Baru
      let newQuantity = stock.quantity;
      if (data.type === 'IN') {
        newQuantity += data.quantity;
      } else {
        if (stock.quantity < data.quantity) {
          throw new AppError(`Insufficient stock. Current: ${stock.quantity}`, 400);
        }
        newQuantity -= data.quantity;
      }

      // 3. Update Stok di DB
      stock.quantity = newQuantity;
      await stock.save({ session });

      // 4. Catat Mutasi (Audit Log)
      await StockMutation.create([{
        stock: stock._id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        performedBy: data.userId,
        ...(data.notes && { notes: data.notes })
      }], { session });

      // Commit Transaksi
      await session.commitTransaction();
      return stock;

    } catch (error) {
      // Rollback jika ada error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getStockByWarehouse(warehouseId: string) {
    return await Stock.find({ warehouse: warehouseId })
      .populate('product', 'name sku price') // Join ke tabel product
      .populate('warehouse', 'name code');
  }
}