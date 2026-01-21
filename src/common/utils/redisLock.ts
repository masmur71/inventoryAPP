import redis from '../../config/redis.js';
import { AppError } from './AppError.js';
import logger from './logger.js';

/**
 * Attempts to acquire an exclusive lock for a specific resource.
 *
 * Reminder:
 * - This lock exists to prevent race conditions.
 * - If this fails, another process is already modifying the same resource.
 *
 * @param key Unique resource key (e.g. lock:product:123)
 * @param ttl Lock expiration in seconds (acts as a safety fallback)
 */
export const acquireLock = async (key: string, ttl: number = 10) => {
  // Atomic Redis lock:
  // If this returns null, someone else already owns the lock.
  const result = await redis.set(key, 'LOCKED', 'EX', ttl, 'NX');
  
  if (!result) {
    // if returns null, lock not acquired
    throw new AppError(`Resource is busy. Please try again. Key: ${key}`, 409); // 409 Conflict
  }
  
  logger.info(`Lock acquired: ${key}`);
  return true;
};

export const releaseLock = async (key: string) => {
  await redis.del(key);
  logger.info(`Lock released: ${key}`);
};