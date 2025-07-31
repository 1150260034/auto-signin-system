import { Request, Response } from 'express';
import { scheduleService } from '../services/scheduleService';
import { accountService } from '../services/accountService';
import { logService } from '../services/logService';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

// 手动执行签到
const executeSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await scheduleService.executeSigninNow();
    
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

    // 这里应该调用实际的签到服务
    // 暂时模拟签到结果
    const success = Math.random() > 0.3; // 70% 成功率
    const message = success ? '签到成功' : '签到失败';

    // 记录签到日志
    await logService.createSigninLog({
      accountId: account.id!,
      accountName: account.name,
      success,
      message,
      responseData: JSON.stringify({ status: success ? 'ok' : 'error' })
    });

    // 更新账号最后签到信息
    await accountService.updateLastSignin(account.id!, success);

    res.json({
      success: true,
      message: `账号 ${account.name} 签到完成`,
      data: {
        accountId: account.id,
        accountName: account.name,
        success,
        message
      }
    });
  } catch (error) {
    logger.error('执行账号签到失败:', error);
    throw error;
  }
};

// 获取签到统计
const getSigninStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await accountService.getAllAccounts();
    const enabledAccounts = accounts.filter(acc => acc.enabled);
    
    const stats = {
      totalAccounts: accounts.length,
      enabledAccounts: enabledAccounts.length,
      disabledAccounts: accounts.length - enabledAccounts.length,
      lastSigninTime: enabledAccounts.reduce((latest, acc) => {
        if (!acc.lastSigninAt) return latest;
        return !latest || acc.lastSigninAt > latest ? acc.lastSigninAt : latest;
      }, null as string | null)
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

// 测试签到接口
const testSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountId } = req.body;
    
    if (accountId) {
      await executeAccountSignin(req, res);
    } else {
      await executeSignin(req, res);
    }
  } catch (error) {
    logger.error('测试签到失败:', error);
    throw error;
  }
};

// 导出控制器对象
const signinController = {
  executeSignin,
  executeAccountSignin,
  getSigninStats,
  testSignin
};

export default signinController;
