import { Router } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  testAccount
} from '../controllers/accountController';

const router = Router();

// 获取所有账号
router.get('/', asyncHandler(getAllAccounts));

// 根据ID获取账号
router.get('/:id', asyncHandler(getAccountById));

// 创建新账号
router.post('/', asyncHandler(createAccount));

// 更新账号
router.put('/:id', asyncHandler(updateAccount));

// 删除账号
router.delete('/:id', asyncHandler(deleteAccount));

// 测试账号连接
router.post('/:id/test', asyncHandler(testAccount));

export default router;