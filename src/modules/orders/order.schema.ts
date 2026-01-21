import { z } from 'zod';

// bought item schema
const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    customerName: z.string().min(3, 'Customer Name is required'),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PROCESSED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>['body'];