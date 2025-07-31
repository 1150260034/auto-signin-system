import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface AppErrorInterface extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class AppError extends Error implements AppErrorInterface {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 确保堆栈跟踪正确指向错误发生的位置
    Error.captureStackTrace(this, this.constructor);
  }
}

// 全局错误处理中间件
export const globalErrorHandler = (
  error: AppErrorInterface | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let isOperational = false;

  // 如果是我们自定义的 AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    // 处理验证错误
    statusCode = 400;
    message = '数据验证失败';
  } else if (error.name === 'CastError') {
    // 处理数据类型转换错误
    statusCode = 400;
    message = '无效的数据格式';
  }

  // 记录错误日志
  if (!isOperational || statusCode >= 500) {
    logger.error('服务器错误:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    logger.warn('客户端错误:', {
      message: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
  }

  // 返回错误响应
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error.message
    })
  });
};

// 处理未捕获的异常
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('未捕获的异常:', error);
    process.exit(1);
  });
};

// 处理未处理的 Promise 拒绝
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('未处理的 Promise 拒绝:', { reason, promise });
    process.exit(1);
  });
};

// 异步错误包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};