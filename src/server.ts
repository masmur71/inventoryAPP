import app from './app.js';
import { config } from './config/env.js';
import logger from './common/utils/logger.js';
import { connectDB } from './config/database.js';
import redis from './config/redis.js';
import { setupSwagger } from './config/swagger.js';

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Connect Redis
    await redis.connect();

    // 3. Start Server
    const server = app.listen(config.PORT, () => {
      logger.info(
        `Server running on port ${config.PORT} in ${config.NODE_ENV} mode`
      );
      // 4. Setup Swagger Docs
      setupSwagger(app, Number(config.PORT));
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

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
