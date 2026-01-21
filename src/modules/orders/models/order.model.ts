import mongoose, { Schema, Document } from 'mongoose';

// Sub-document schema 
const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true }, // Snapshot SKU
  name: { type: String, required: true }, // Snapshot Name (incase product name changes later)
  price: { type: Number, required: true }, // Snapshot Hprice when order is placed
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

export interface IOrder extends Document {
  orderNumber: string;
  status: 'PENDING' | 'PROCESSED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customerName: string;
  warehouse: mongoose.Types.ObjectId; // Order from which warehouse
  items: any[]; // Array of OrderItem
  totalAmount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['PENDING', 'PROCESSED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], 
      default: 'PENDING' 
    },
    customerName: { type: String, required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);