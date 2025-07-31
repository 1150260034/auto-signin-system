import { Router } from 'express';
import signinController from '../controllers/signinController';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// 手动执行签到
router.post('/execute', asyncHandler(signinController.executeSignin));

// 测试签到接口
router.post('/test', asyncHandler(signinController.testSignin));

// 获取签到统计
router.get('/stats', asyncHandler(signinController.getSigninStats));

export default router;
