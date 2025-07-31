import { Router } from 'express';
import taskController from '../controllers/taskController';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// 获取所有任务
router.get('/', asyncHandler(taskController.getAllTasks));

// 获取单个任务
router.get('/:id', asyncHandler(taskController.getTask));

// 创建任务
router.post('/', asyncHandler(taskController.createTask));

// 更新任务
router.put('/:id', asyncHandler(taskController.updateTask));

// 删除任务
router.delete('/:id', asyncHandler(taskController.deleteTask));

// 启动任务
router.post('/:id/start', asyncHandler(taskController.startTask));

// 停止任务
router.post('/:id/stop', asyncHandler(taskController.stopTask));

// 获取任务统计
router.get('/stats/overview', asyncHandler(taskController.getTaskStats));

export default router;
