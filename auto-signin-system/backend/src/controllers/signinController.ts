import { Request, Response } from 'express';
import { signinExecutor } from '../services/signin-executor';
import { accountService } from '../services/accountService';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

// 手动执行签到
const executeSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await signinExecutor.executeBatchSignin();
    
    res.json({
      success: true,
      message: '签到任务执行完成',
      data: result
    });
  } catch (error) {
    logger.error('手动执行签到失败:', error);
    throw new AppError('签到执行失败', 500);
  }
};

// 执行单个账号签到
const executeAccountSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const account = await accountService.getAccountById(parseInt(id));
    if (!account) {
      throw new AppError('账号不存在', 404);
    }

    if (!account.enabled) {
      throw new AppError('账号已禁用', 400);
    }

    // 执行单个账号签到
    const result = await signinExecutor.executeSignin(account);

    res.json({
      success: true,
      message: `账号 ${account.name} 签到完成`,
      data: result
    });
  } catch (error) {
    logger.error('执行账号签到失败:', error);
    throw error;
  }
};

// 批量执行指定账号签到
const executeBatchSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountIds } = req.body;
    
    const result = await signinExecutor.executeBatchSignin(accountIds);
    
    res.json({
      success: true,
      message: '批量签到执行完成',
      data: result
    });
  } catch (error) {
    logger.error('批量签到执行失败:', error);
    throw new AppError('批量签到执行失败', 500);
  }
};

// 获取签到统计
const getSigninStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await accountService.getAllAccounts();
    const enabledAccounts = accounts.filter(acc => acc.enabled);
    
    // 获取日志统计
    const logStats = await signinExecutor.getLogStats();
    
    const stats = {
      totalAccounts: accounts.length,
      enabledAccounts: enabledAccounts.length,
      disabledAccounts: accounts.length - enabledAccounts.length,
      lastSigninTime: enabledAccounts.reduce((latest, acc) => {
        if (!acc.lastSigninAt) return latest;
        return !latest || acc.lastSigninAt > latest ? acc.lastSigninAt : latest;
      }, null as string | null),
      ...logStats
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取签到状态失败:', error);
    throw new AppError('获取签到状态失败', 500);
  }
};

// 测试账号连接
const testAccountConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const account = await accountService.getAccountById(parseInt(id));
    if (!account) {
      throw new AppError('账号不存在', 404);
    }

    const result = await signinExecutor.testConnection(account);

    res.json({
      success: true,
      message: '连接测试完成',
      data: result
    });
  } catch (error) {
    logger.error('测试账号连接失败:', error);
    throw error;
  }
};

// 获取签到日志
const getSigninLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId, status, page = 1, limit = 20 } = req.query;
    
    const filters = {
      accountId: accountId ? parseInt(accountId as string) : undefined,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };
    
    const result = await signinExecutor.getSigninLogs(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('获取签到日志失败:', error);
    throw new AppError('获取签到日志失败', 500);
  }
};

// 清空签到日志
const clearSigninLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    await signinExecutor.clearLogs();
    
    res.json({
      success: true,
      message: '签到日志已清空'
    });
  } catch (error) {
    logger.error('清空签到日志失败:', error);
    throw new AppError('清空签到日志失败', 500);
  }
};

// 导出控制器对象
const signinController = {
  executeSignin,
  executeAccountSignin,
  executeBatchSignin,
  getSigninStats,
  testAccountConnection,
  getSigninLogs,
  clearSigninLogs
};

export default signinController;