import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js'; 
import { connectDB } from '../config/database.js'; 
import logger from '../common/utils/logger.js'; 

import { Role } from '../modules/users/models/role.model.js'; 
import { User } from '../modules/users/models/user.model.js'; 


import { PERMISSIONS } from '../common/types/permissions.js';

const seedData = async () => {
  try {
    await connectDB();

    logger.info('🌱 Starting Seeder...');

    // 1. Definisi Role & Permission 
    const rolesData = [
      {
        name: 'admin',
        permissions: [PERMISSIONS.ALL], // Admin Sakti
      },
      {
        name: 'manager',
        permissions: [
            // Manager bisa melakukan segalanya KECUALI 'all' (delete user, dsb mungkin dibatasi nanti)
            PERMISSIONS.INVENTORY.VIEW,
            PERMISSIONS.INVENTORY.MANAGE,
            PERMISSIONS.STOCK.ADJUST,
            PERMISSIONS.ORDER.VIEW,
            PERMISSIONS.ORDER.CREATE
        ]
      },
      {
        name: 'staff',
        permissions: [
            // Staff hanya bisa View Inventory dan Buat Order, tidak bisa Edit Produk Master
            PERMISSIONS.INVENTORY.VIEW,
            PERMISSIONS.ORDER.CREATE,
            PERMISSIONS.ORDER.VIEW,
            // Opsional: Staff gudang mungkin butuh adjust stock?
            // PERMISSIONS.STOCK.ADJUST 
        ]
      }
    ];

    // 2. Seed Roles (Gunakan findOneAndUpdate agar permission ter-update jika role sudah ada)
    for (const role of rolesData) {
      await Role.findOneAndUpdate(
        { name: role.name },
        { permissions: role.permissions },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      logger.info(`✅ Role synced: ${role.name}`);
    }

    // 3. Seed Super Admin User
    const adminRole = await Role.findOne({ name: 'admin' });
    const adminEmail = 'admin@enterprise.com';
    
    if (adminRole) {
      const adminExists = await User.findOne({ email: adminEmail });
      
      if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt); // Password default

        await User.create({
          fullName: 'Super Admin',
          email: adminEmail,
          passwordHash,
          role: adminRole._id,
          isActive: true
        });
        logger.info(`uper Admin created: ${adminEmail} / admin123`);
      } else {
        logger.info(`ℹSuper Admin already exists.`);
      }
    }

    logger.info('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seedData();