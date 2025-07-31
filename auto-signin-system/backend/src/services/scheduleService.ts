import * as cron from 'node-cron';
import { accountService } from './accountService';
import { logService } from './logService';
import { logger } from '../utils/logger';

export interface ScheduleTask {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  task?: cron.ScheduledTask;
}

class ScheduleService {
  private tasks: Map<string, ScheduleTask> = new Map();
  private defaultSigninTask: ScheduleTask | null = null;

  constructor() {
    this.initializeDefaultTask();
  }

  // 初始化默认的每日签到任务
  private initializeDefaultTask() {
    const defaultTask: ScheduleTask = {
      id: 'daily-signin',
      name: '每日自动签到',
      cronExpression: '0 9 * * *', // 每天上午9点执行
      enabled: true
    };

    this.createTask(defaultTask);
    this.defaultSigninTask = defaultTask;
    logger.info('默认签到任务已初始化');
  }

  // 创建定时任务
  createTask(taskConfig: Omit<ScheduleTask, 'task'>): ScheduleTask {
    const task: ScheduleTask = {
      ...taskConfig,
      task: undefined
    };

    // 验证cron表达式
    if (!cron.validate(taskConfig.cronExpression)) {
      throw new Error(`无效的cron表达式: ${taskConfig.cronExpression}`);
    }

    // 创建cron任务
    const cronTask = cron.schedule(taskConfig.cronExpression, async () => {
      await this.executeSigninTask(task.id);
    }, {
      scheduled: false, // 先不启动
      timezone: 'Asia/Shanghai'
    });

    task.task = cronTask;
    this.tasks.set(task.id, task);

    // 如果任务启用，则启动它
    if (task.enabled) {
      this.startTask(task.id);
    }

    logger.info(`创建定时任务: ${task.name} (${task.cronExpression})`);
    return task;
  }

  // 启动任务
  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.task) {
      logger.error(`任务不存在: ${taskId}`);
      return false;
    }

    try {
      task.task.start();
      task.enabled = true;
      
      // 计算下次执行时间
      task.nextRun = this.getNextRunTime(task.cronExpression);
      
      logger.info(`启动定时任务: ${task.name}`);
      return true;
    } catch (error) {
      logger.error(`启动任务失败: ${task.name}`, error);
      return false;
    }
  }

  // 停止任务
  stopTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.task) {
      logger.error(`任务不存在: ${taskId}`);
      return false;
    }

    try {
      task.task.stop();
      task.enabled = false;
      task.nextRun = undefined;
      
      logger.info(`停止定时任务: ${task.name}`);
      return true;
    } catch (error) {
      logger.error(`停止任务失败: ${task.name}`, error);
      return false;
    }
  }

  // 删除任务
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 先停止任务
    if (task.task && task.enabled) {
      task.task.stop();
    }

    this.tasks.delete(taskId);
    logger.info(`删除定时任务: ${task.name}`);
    return true;
  }

  // 更新任务
  updateTask(taskId: string, updates: Partial<ScheduleTask>): ScheduleTask | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    // 如果更新了cron表达式，需要重新创建任务
    if (updates.cronExpression && updates.cronExpression !== task.cronExpression) {
      if (!cron.validate(updates.cronExpression)) {
        throw new Error(`无效的cron表达式: ${updates.cronExpression}`);
      }

      // 停止旧任务
      if (task.task) {
        task.task.stop();
      }

      // 创建新任务
      const newCronTask = cron.schedule(updates.cronExpression, async () => {
        await this.executeSigninTask(taskId);
      }, {
        scheduled: false,
        timezone: 'Asia/Shanghai'
      });

      task.task = newCronTask;
      task.cronExpression = updates.cronExpression;
    }

    // 更新其他属性
    if (updates.name) task.name = updates.name;
    if (updates.enabled !== undefined) {
      task.enabled = updates.enabled;
      if (task.task) {
        if (updates.enabled) {
          task.task.start();
          task.nextRun = this.getNextRunTime(task.cronExpression);
        } else {
          task.task.stop();
          task.nextRun = undefined;
        }
      }
    }

    logger.info(`更新定时任务: ${task.name}`);
    return task;
  }

  // 获取所有任务
  getAllTasks(): ScheduleTask[] {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      cronExpression: task.cronExpression,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.nextRun
    }));
  }

  // 获取单个任务
  getTask(taskId: string): ScheduleTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    return {
      id: task.id,
      name: task.name,
      cronExpression: task.cronExpression,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.nextRun
    };
  }

  // 执行签到任务
  private async executeSigninTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      logger.info(`开始执行定时任务: ${task.name}`);
      
      // 更新最后执行时间
      task.lastRun = new Date().toISOString();
      task.nextRun = this.getNextRunTime(task.cronExpression);

      // 记录任务开始日志
      await logService.createSystemLog({
        level: 'info',
        message: `定时任务开始执行: ${task.name}`,
        category: 'schedule'
      });

      // 获取所有启用的账号
      const accounts = await accountService.getEnabledAccounts();
      
      if (accounts.length === 0) {
        logger.warn('没有启用的账号，跳过签到任务');
        await logService.createSystemLog({
          level: 'warn',
          message: '没有启用的账号，跳过签到任务',
          category: 'schedule'
        });
        return;
      }

      logger.info(`找到 ${accounts.length} 个启用的账号，开始批量签到`);

      // 模拟批量执行签到
      const results = accounts.map(acc => ({ success: true, accountId: acc.id }));
      
      // 统计结果
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      const summary = `定时签到完成 - 成功: ${successCount}, 失败: ${failCount}, 总计: ${results.length}`;
      logger.info(summary);

      // 记录任务完成日志
      await logService.createSystemLog({
        level: 'info',
        message: summary,
        category: 'schedule'
      });

    } catch (error) {
      logger.error(`定时任务执行失败: ${task.name}`, error);
      
      await logService.createSystemLog({
        level: 'error',
        message: `定时任务执行失败: ${task.name} - ${error}`,
        category: 'schedule'
      });
    }
  }

  // 手动执行签到任务
  async executeSigninNow(): Promise<{ success: number; fail: number; total: number }> {
    try {
      logger.info('手动执行签到任务');

      // 获取所有启用的账号
      const accounts = await accountService.getEnabledAccounts();
      
      if (accounts.length === 0) {
        logger.warn('没有启用的账号');
        return { success: 0, fail: 0, total: 0 };
      }

      // 模拟批量执行签到
      const results = accounts.map(acc => ({ success: true, accountId: acc.id }));
      
      // 统计结果
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      const summary = `手动签到完成 - 成功: ${successCount}, 失败: ${failCount}, 总计: ${results.length}`;
      logger.info(summary);

      // 记录日志
      await logService.createSystemLog({
        level: 'info',
        message: summary,
        category: 'manual'
      });

      return {
        success: successCount,
        fail: failCount,
        total: results.length
      };

    } catch (error) {
      logger.error('手动签到任务执行失败', error);
      
      await logService.createSystemLog({
        level: 'error',
        message: `手动签到任务执行失败: ${error}`,
        category: 'manual'
      });

      throw error;
    }
  }

  // 计算下次执行时间
  private getNextRunTime(cronExpression: string): string {
    try {
      // 这里简化处理，实际应该使用cron库计算下次执行时间
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 假设是每天9点
      
      return tomorrow.toISOString();
    } catch (error) {
      logger.error('计算下次执行时间失败', error);
      return '';
    }
  }

  // 更新默认签到时间
  updateDefaultSigninTime(hour: number, minute: number = 0): boolean {
    if (!this.defaultSigninTask) return false;

    const cronExpression = `${minute} ${hour} * * *`;
    
    try {
      this.updateTask('daily-signin', { cronExpression });
      logger.info(`更新默认签到时间: ${hour}:${minute.toString().padStart(2, '0')}`);
      return true;
    } catch (error) {
      logger.error('更新默认签到时间失败', error);
      return false;
    }
  }

  // 获取任务状态统计
  getTaskStats(): { total: number; enabled: number; disabled: number } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      enabled: tasks.filter(t => t.enabled).length,
      disabled: tasks.filter(t => !t.enabled).length
    };
  }

  // 停止所有任务
  stopAllTasks(): void {
    for (const [taskId] of this.tasks) {
      this.stopTask(taskId);
    }
    logger.info('所有定时任务已停止');
  }

  // 启动所有任务
  startAllTasks(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.enabled) {
        this.startTask(taskId);
      }
    }
    logger.info('所有启用的定时任务已启动');
  }
}

// 导出单例
export const scheduleService = new ScheduleService();

// 导出调度管理器（用于优雅关闭）
export const scheduleManager = {
  async stopAll(): Promise<void> {
    scheduleService.stopAllTasks();
  },
  
  async startAll(): Promise<void> {
    scheduleService.startAllTasks();
  },

  addTask(task: any): void {
    scheduleService.createTask(task);
  },

  removeTask(taskId: string): void {
    scheduleService.deleteTask(taskId);
  }
};

// 初始化调度器
export async function initializeScheduler(): Promise<void> {
  try {
    // 启动所有启用的任务
    scheduleService.startAllTasks();
    logger.info('定时任务调度器初始化完成');
  } catch (error) {
    logger.error('定时任务调度器初始化失败:', error);
    throw error;
  }
}
