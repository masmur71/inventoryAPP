import { randomBytes } from 'crypto';

export const generateOrderNumber = () => {
  // Format: ORD-TIMESTAMP-RANDOM
  const timestamp = Math.floor(Date.now() / 1000);
  const random = randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};