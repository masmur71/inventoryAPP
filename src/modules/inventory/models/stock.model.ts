import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  quantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema: Schema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, default: 0, min: 0 }, //  Current stock level
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// COMPOUND INDEX 
// no duplicate stock entries for same product in same warehouse
StockSchema.index({ product: 1, warehouse: 1 }, { unique: true });

export const Stock = mongoose.model<IStock>('Stock', StockSchema);