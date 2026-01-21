import app from './app';
import { config } from './config/env';
import logger from './common/utils/logger';
import { connectDB } from './config/database';
import redis from './config/redis';

const startServer = async () => {
  // 1. Connect Database
  await connectDB();
  
  // 2. Connect Redis
  await redis.connect();

  // 3. Start Server
  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });

  // Graceful Shutdown 
  const shutdown = async () => {
    logger.info('Shutting down server...');
    server.close(async () => {
      await redis.quit();
      logger.info('Redis connection closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();