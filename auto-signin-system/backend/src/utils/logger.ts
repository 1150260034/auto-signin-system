import winston from 'winston';
import path from 'path';

// 日志目录
const LOG_DIR = path.join(__dirname, '../../logs');

// 创建日志目录
const fs = require('fs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 签到日志文件
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'signin.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// 签到专用日志记录器
export const signinLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'signin.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// 如果不是生产环境，添加调试日志
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(LOG_DIR, 'debug.log'),
    level: 'debug',
    maxsize: 5242880, // 5MB
    maxFiles: 3
  }));
}

export default logger;