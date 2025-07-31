import app from './app';
import { initDatabase } from './models/database';
import { scheduleService } from './services/scheduleService';

// 初始化调度器函数
async function initializeScheduler(): Promise<void> {
  try {
    scheduleService.startAllTasks();
    logger.info('定时任务调度器初始化完成');
  } catch (error) {
    logger.error('定时任务调度器初始化失败:', error);
    throw error;
  }
}
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    logger.info('数据库初始化完成');

    // 初始化定时任务调度器
    await initializeScheduler();
    logger.info('定时任务调度器初始化完成');

    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`服务器已启动，端口: ${PORT}`);
      logger.info(`API文档地址: http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  scheduleService.stopAllTasks();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
  scheduleService.stopAllTasks();
  process.exit(0);
});

// 启动服务器
startServer();