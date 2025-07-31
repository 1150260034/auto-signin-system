import { Request, Response } from 'express';
import { scheduleService } from '../services/scheduleService';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

// 获取所有定时任务
const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = scheduleService.getAllTasks();
    const stats = scheduleService.getTaskStats();

    res.json({
      success: true,
      data: {
        tasks,
        stats
      }
    });
  } catch (error) {
    logger.error('获取定时任务失败:', error);
    throw new AppError('获取定时任务失败', 500);
  }
};

// 根据ID获取任务
const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = scheduleService.getTask(id);

    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('获取任务详情失败:', error);
    throw error;
  }
};

// 创建新任务
const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, cronExpression, enabled = true } = req.body;

    if (!name || !cronExpression) {
      throw new AppError('任务名称和Cron表达式为必填项', 400);
    }

    const taskId = `task-${Date.now()}`;
    const task = scheduleService.createTask({
      id: taskId,
      name,
      cronExpression,
      enabled
    });

    logger.info(`创建定时任务成功: ${name}`);
    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: task
    });
  } catch (error) {
    logger.error('创建定时任务失败:', error);
    throw error;
  }
};

// 更新任务
const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = scheduleService.updateTask(id, updates);
    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    logger.info(`更新定时任务成功: ${task.name}`);
    res.json({
      success: true,
      message: '任务更新成功',
      data: task
    });
  } catch (error) {
    logger.error('更新定时任务失败:', error);
    throw error;
  }
};

// 删除任务
const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const success = scheduleService.deleteTask(id);
    if (!success) {
      throw new AppError('任务不存在', 404);
    }

    logger.info(`删除定时任务成功: ${id}`);
    res.json({
      success: true,
      message: '任务删除成功'
    });
  } catch (error) {
    logger.error('删除定时任务失败:', error);
    throw error;
  }
};

// 启动任务
const startTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const success = scheduleService.startTask(id);
    if (!success) {
      throw new AppError('启动任务失败', 400);
    }

    res.json({
      success: true,
      message: '任务启动成功'
    });
  } catch (error) {
    logger.error('启动任务失败:', error);
    throw error;
  }
};

// 停止任务
const stopTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const success = scheduleService.stopTask(id);
    if (!success) {
      throw new AppError('停止任务失败', 400);
    }

    res.json({
      success: true,
      message: '任务停止成功'
    });
  } catch (error) {
    logger.error('停止任务失败:', error);
    throw error;
  }
};

// 获取任务统计
const getTaskStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = scheduleService.getTaskStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取任务统计失败:', error);
    throw new AppError('获取任务统计失败', 500);
  }
};

// 导出控制器对象
const taskController = {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  stopTask,
  getTaskStats
};

export default taskController;
