import { Router } from 'express';
import logController from '../controllers/logController';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// 获取所有日志
router.get('/', asyncHandler(logController.getAllLogs));

// 获取签到日志
router.get('/signin', asyncHandler(logController.getSigninLogs));

// 获取系统日志
router.get('/system', asyncHandler(logController.getSystemLogs));

// 清空日志
router.post('/clear', asyncHandler(logController.clearLogs));

// 获取日志统计信息
router.get('/stats', asyncHandler(logController.getLogStats));

// 导出日志
router.get('/export', asyncHandler(logController.exportLogs));

export default router;
