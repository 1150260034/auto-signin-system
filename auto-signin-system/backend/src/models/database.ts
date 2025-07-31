import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger';

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../../logs/signin.db');

// 创建数据库连接
export const db = new sqlite3.Database(DB_PATH);
export const database = db; // 为了兼容其他文件的导入

// 将数据库方法Promise化
export const dbRun = promisify(db.run.bind(db)) as any;
export const dbGet = promisify(db.get.bind(db)) as any;
export const dbAll = promisify(db.all.bind(db)) as any;

// 账号表接口
export interface Account {
  id?: number;
  name: string;
  description?: string;
  signinUrl: string;
  method: 'GET' | 'POST';
  cookies: string;
  headers?: string;
  requestBody?: string;
  successKeyword?: string;
  enabled: boolean;
  lastSigninAt?: string;
  lastSigninStatus?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 签到日志表接口
export interface SigninLog {
  id?: number;
  accountId: number;
  accountName: string;
  status: 'success' | 'failed';
  message: string;
  responseData?: string;
  executionTime: number;
  createdAt?: string;
}

// 定时任务表接口
export interface ScheduleTask {
  id?: number;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastExecutionTime?: string;
  nextExecutionTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 初始化数据库
export async function initDatabase(): Promise<void> {
  try {
    // 创建数据目录
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建账号表
    await dbRun(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        signin_url TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'POST',
        cookies TEXT NOT NULL,
        headers TEXT,
        request_body TEXT,
        success_keyword TEXT,
        enabled BOOLEAN DEFAULT 1,
        last_signin_at DATETIME,
        last_signin_status BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建签到日志表
    await dbRun(`
      CREATE TABLE IF NOT EXISTS signin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accountId INTEGER NOT NULL,
        accountName TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
        message TEXT NOT NULL,
        responseData TEXT,
        executionTime INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
      )
    `);

    // 创建定时任务表
    await dbRun(`
      CREATE TABLE IF NOT EXISTS schedule_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cronExpression TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        lastExecutionTime DATETIME,
        nextExecutionTime DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_accounts_enabled ON accounts(enabled)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_signin_logs_account ON signin_logs(accountId)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_signin_logs_created ON signin_logs(createdAt)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_schedule_tasks_enabled ON schedule_tasks(enabled)`);

    // 插入默认定时任务
    const existingTask = await dbGet(`SELECT id FROM schedule_tasks WHERE name = '每日自动签到'`);
    if (!existingTask) {
      await dbRun(`
        INSERT INTO schedule_tasks (name, cronExpression, enabled)
        VALUES ('每日自动签到', '0 8 * * *', 1)
      `);
    }

    logger.info('数据库表创建成功');
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    throw error;
  }
}

// 关闭数据库连接
export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        logger.error('关闭数据库失败:', err);
        reject(err);
      } else {
        logger.info('数据库连接已关闭');
        resolve();
      }
    });
  });
}