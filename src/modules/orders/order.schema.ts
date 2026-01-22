import { z } from 'zod';

// bought item schema
const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  body: z.object({
    warehouseId: z.string().min(1, "Warehouse ID required"),
    
    // --- TAMBAHKAN INI ---
    customerName: z.string().min(3, "Customer Name is required"), 
    // ---------------------

    items: z.array(
      z.object({
        productId: z.string().min(1, "Product ID required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
      })
    ).min(1, "Order must have at least 1 item"),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().optional(), // Opsional, user boleh kasih alasan batal
  }),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>['body'];