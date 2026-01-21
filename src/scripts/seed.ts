import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js'; 
import { connectDB } from '../config/database.js'; 
import logger from '../common/utils/logger.js'; 


import { Role } from '../modules/users/models/role.model.js'; 
import { User } from '../modules/users/models/user.model.js'; 

const seedData = async () => {
  try {
    await connectDB();

    // 1. Seed Roles
    const roles = ['admin', 'manager', 'staff'];
    for (const roleName of roles) {
      const exists = await Role.findOne({ name: roleName });
      if (!exists) {
        // Tentukan permission dasar (bisa diedit nanti)
        const permissions = roleName === 'admin' 
          ? ['all'] 
          : ['inventory.view', 'order.create'];
        
        await Role.create({ name: roleName, permissions });
        logger.info(`✅ Role created: ${roleName}`);
      }
    }

    // 2. Seed Super Admin User
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
        logger.info(`✅ Super Admin created: ${adminEmail} / admin123`);
      }
    }

    logger.info('🌱 Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();