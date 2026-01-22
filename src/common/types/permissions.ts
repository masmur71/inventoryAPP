// src/common/types/permissions.ts

export const PERMISSIONS = {
  INVENTORY: {
    VIEW: 'inventory.view',
    MANAGE: 'inventory.manage',
  },
  STOCK: {
    ADJUST: 'stock.adjust',
  },
  ORDER: {
    VIEW: 'order.view',
    CREATE: 'order.create',
    MANAGE: 'order.manage',
  },

  ALL: 'all' 
} as const; 

// --- MAGIC TYPE HELPER ---

type DeepValueOf<T> = T extends object 
  ? { [K in keyof T]: DeepValueOf<T[K]> }[keyof T] 
  : T;

// Hasilnya: 'inventory.view' | 'inventory.manage' | 'stock.adjust' | 'all' ...
export type Permission = DeepValueOf<typeof PERMISSIONS>;