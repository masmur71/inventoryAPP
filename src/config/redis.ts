import Redis from 'ioredis';
import { config } from './env';
import logger from '../common/utils/logger';

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  lazyConnect: true, //not connect immediately
});

redis.on('connect', () => {
  logger.info('Redis Connected successfully');
});

redis.on('error', (err) => {
  logger.error( 'Redis Connection Error:', err);
});

export default redis;