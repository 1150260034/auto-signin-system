import { Router } from 'express';
import signinController from '../controllers/signinController';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// 手动执行所有账号签到
router.post('/execute', asyncHandler(signinController.executeSignin));

// 执行单个账号签到
router.post('/execute/:id', asyncHandler(signinController.executeAccountSignin));

// 批量执行指定账号签到
router.post('/batch', asyncHandler(signinController.executeBatchSignin));

// 测试账号连接
router.post('/test/:id', asyncHandler(signinController.testAccountConnection));

// 获取签到统计
router.get('/stats', asyncHandler(signinController.getSigninStats));

// 获取签到日志
router.get('/logs', asyncHandler(signinController.getSigninLogs));

// 清空签到日志
router.delete('/logs', asyncHandler(signinController.clearSigninLogs));

export default router;
