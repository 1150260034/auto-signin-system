import { Request, Response } from 'express';
import { logService } from '../services/logService';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

// 获取所有日志
const getAllLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      type = 'all'
    } = req.query;

    const query = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    let result;
    if (type === 'signin') {
      result = await logService.getSigninLogs(query);
    } else if (type === 'system') {
      result = await logService.getSystemLogs(query);
    } else {
      // 获取所有类型的日志
      const signinResult = await logService.getSigninLogs(query);
      const systemResult = await logService.getSystemLogs(query);
      
        result = {
          logs: [...signinResult.logs, ...systemResult.logs].sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          }).slice(0, query.limit),
          total: signinResult.total + systemResult.total
        };
    }

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pages: Math.ceil(result.total / query.limit)
      }
    });
  } catch (error) {
    logger.error('获取日志失败:', error);
    throw new AppError('获取日志失败', 500);
  }
};

// 获取签到日志
const getSigninLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      accountId,
      startDate,
      endDate
    } = req.query;

    const query = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      accountId: accountId as string,
      startDate: startDate as string,
      endDate: endDate as string
    };

    const result = await logService.getSigninLogs(query);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pages: Math.ceil(result.total / query.limit)
      }
    });
  } catch (error) {
    logger.error('获取签到日志失败:', error);
    throw new AppError('获取签到日志失败', 500);
  }
};

// 获取系统日志
const getSystemLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      level,
      startDate,
      endDate
    } = req.query;

    const query = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      level: level as string,
      startDate: startDate as string,
      endDate: endDate as string
    };

    const result = await logService.getSystemLogs(query);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pages: Math.ceil(result.total / query.limit)
      }
    });
  } catch (error) {
    logger.error('获取系统日志失败:', error);
    throw new AppError('获取系统日志失败', 500);
  }
};

// 清空日志
const clearLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.body;

    if (!['signin', 'system', 'all'].includes(type)) {
      throw new AppError('无效的日志类型', 400);
    }

    await logService.clearLogs(type);

    logger.info(`清空${type}日志成功`);
    res.json({
      success: true,
      message: `${type}日志已清空`
    });
  } catch (error) {
    logger.error('清空日志失败:', error);
    throw error;
  }
};

// 导出日志
const exportLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'all', format = 'json' } = req.query;

    if (!['signin', 'system', 'all'].includes(type as string)) {
      throw new AppError('无效的日志类型', 400);
    }

    if (!['json', 'csv'].includes(format as string)) {
      throw new AppError('无效的导出格式', 400);
    }

    const buffer = await logService.exportLogs(type as string, format as string);
    
    const filename = `logs_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    logger.error('导出日志失败:', error);
    throw error;
  }
};

// 导出控制器对象
const logController = {
  getAllLogs,
  getSigninLogs,
  getSystemLogs,
  clearLogs,
  exportLogs
};

export default logController;
