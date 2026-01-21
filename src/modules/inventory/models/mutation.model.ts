import mongoose, { Schema, Document } from 'mongoose';

export type MutationType = 'IN' | 'OUT';
export type MutationReason = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

export interface IStockMutation extends Document {
  stock: mongoose.Types.ObjectId; // reference toStock ID
  type: MutationType;
  quantity: number;
  reason: MutationReason;
  referenceId?: string; // ID Order or ID Transfer
  performedBy: mongoose.Types.ObjectId; 
  notes?: string;
  createdAt: Date;
}

const StockMutationSchema: Schema = new Schema(
  {
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'RETURN'], required: true },
    referenceId: { type: String }, // Optional
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const StockMutation = mongoose.model<IStockMutation>('StockMutation', StockMutationSchema);