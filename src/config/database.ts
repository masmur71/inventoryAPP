import mongoose from 'mongoose';
import { config } from './env.js';
import logger from '../common/utils/logger.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info('MongoDB Connected successfully');
  } catch (error) {
    logger.error('MongoDB Connection Failed:', error);
    process.exit(1);
  }
};