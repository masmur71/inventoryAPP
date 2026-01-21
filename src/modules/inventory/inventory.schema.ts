import { z } from 'zod';

// create warehouse schema
export const createWarehouseSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(10),
    name: z.string().min(3),
    address: z.string().min(5),
    description: z.string().optional(),
  }),
});

// create product schema
export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3),
    name: z.string().min(3),
    price: z.number().min(0),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
});

// stock adjustment schema
export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    quantity: z.number().min(1), // Jumlah yang diubah (selalu positif)
    type: z.enum(['IN', 'OUT']), // Masuk atau Keluar
    reason: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN']),
    notes: z.string().optional(),
  }),
});