import app from './app';
import { initDatabase } from './models/database';
import { scheduleService } from './services/scheduleService';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

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
      logger.info(`前端界面: http://localhost:5173`);
      logger.info(`后端API: http://localhost:${PORT}`);
      logger.info(`健康检查: http://localhost:${PORT}/health`);
      console.log(`服务器运行在 http://localhost:${PORT}`);
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

export default app;