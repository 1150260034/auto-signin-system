import { database } from '../models/database';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface SigninLog {
  id?: number;
  accountId: number;
  accountName: string;
  success: boolean;
  message: string;
  responseData?: string;
  statusCode?: number;
  createdAt?: string;
}

export interface SystemLog {
  id?: number;
  level: string;
  message: string;
  meta?: string;
  category?: string;
  createdAt?: string;
}

export interface LogQuery {
  page: number;
  limit: number;
  accountId?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
}

export const logService = {
  // 创建签到日志
  async createSigninLog(logData: Omit<SigninLog, 'id' | 'createdAt'>): Promise<SigninLog> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO signin_logs (account_id, account_name, success, message, response_data, status_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        logData.accountId,
        logData.accountName,
        logData.success ? 1 : 0,
        logData.message,
        logData.responseData || '',
        logData.statusCode || 0,
        now
      ];

      database.run(sql, params, function(this: any, err: any) {
        if (err) {
          logger.error('创建签到日志失败:', err);
          reject(err);
          return;
        }

        const newLog: SigninLog = {
          id: this.lastID,
          ...logData,
          createdAt: now
        };

        resolve(newLog);
      });
    });
  },

  // 获取签到日志
  async getSigninLogs(query: LogQuery): Promise<{ logs: SigninLog[], total: number }> {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      // 添加筛选条件
      if (query.accountId) {
        whereClause += ' AND account_id = ?';
        params.push(query.accountId);
      }

      if (query.startDate) {
        whereClause += ' AND created_at >= ?';
        params.push(query.startDate);
      }

      if (query.endDate) {
        whereClause += ' AND created_at <= ?';
        params.push(query.endDate);
      }

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM signin_logs ${whereClause}`;
      
      database.get(countSql, params, (err: any, countRow: any) => {
        if (err) {
          logger.error('获取签到日志总数失败:', err);
          reject(err);
          return;
        }

        const total = countRow.total;

        // 获取分页数据
        const offset = (query.page - 1) * query.limit;
        const dataSql = `
          SELECT id, account_id, account_name, success, message, response_data, status_code, created_at
          FROM signin_logs 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `;

        database.all(dataSql, [...params, query.limit, offset], (err: any, rows: any[]) => {
          if (err) {
            logger.error('获取签到日志失败:', err);
            reject(err);
            return;
          }

          const logs = rows.map(row => ({
            id: row.id,
            accountId: row.account_id,
            accountName: row.account_name,
            success: Boolean(row.success),
            message: row.message,
            responseData: row.response_data,
            statusCode: row.status_code,
            createdAt: row.created_at
          }));

          resolve({ logs, total });
        });
      });
    });
  },

  // 获取系统日志
  async getSystemLogs(query: LogQuery): Promise<{ logs: SystemLog[], total: number }> {
    return new Promise((resolve, reject) => {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      // 添加筛选条件
      if (query.level) {
        whereClause += ' AND level = ?';
        params.push(query.level);
      }

      if (query.startDate) {
        whereClause += ' AND created_at >= ?';
        params.push(query.startDate);
      }

      if (query.endDate) {
        whereClause += ' AND created_at <= ?';
        params.push(query.endDate);
      }

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM system_logs ${whereClause}`;
      
      database.get(countSql, params, (err: any, countRow: any) => {
        if (err) {
          logger.error('获取系统日志总数失败:', err);
          reject(err);
          return;
        }

        const total = countRow.total;

        // 获取分页数据
        const offset = (query.page - 1) * query.limit;
        const dataSql = `
          SELECT id, level, message, meta, created_at
          FROM system_logs 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `;

        database.all(dataSql, [...params, query.limit, offset], (err: any, rows: any[]) => {
          if (err) {
            logger.error('获取系统日志失败:', err);
            reject(err);
            return;
          }

          const logs = rows.map(row => ({
            id: row.id,
            level: row.level,
            message: row.message,
            meta: row.meta,
            createdAt: row.created_at
          }));

          resolve({ logs, total });
        });
      });
    });
  },

  // 创建系统日志
  async createSystemLog(logData: Omit<SystemLog, 'id' | 'createdAt'>): Promise<SystemLog> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO system_logs (level, message, meta, category, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const params = [
        logData.level,
        logData.message,
        logData.meta || '',
        logData.category || '',
        now
      ];

      database.run(sql, params, function(err: any) {
        if (err) {
          logger.error('创建系统日志失败:', err);
          reject(err);
          return;
        }

        const newLog: SystemLog = {
          id: this.lastID,
          ...logData,
          createdAt: now
        };

        resolve(newLog);
      });
    });
  },

  // 清空日志
  async clearLogs(type: 'signin' | 'system' | 'all'): Promise<void> {
    return new Promise((resolve, reject) => {
      let sql = '';
      
      switch (type) {
        case 'signin':
          sql = 'DELETE FROM signin_logs';
          break;
        case 'system':
          sql = 'DELETE FROM system_logs';
          break;
        case 'all':
          sql = 'DELETE FROM signin_logs; DELETE FROM system_logs';
          break;
        default:
          reject(new Error('无效的日志类型'));
          return;
      }

        database.exec(sql, (err: any) => {
          if (err) {
            logger.error('清空日志失败:', err);
            reject(err);
            return;
          }

          logger.info(`清空${type}日志成功`);
          resolve();
        });
    });
  },

  // 导出日志
  async exportLogs(type: string, format: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        let data: any[] = [];

        if (type === 'signin' || type === 'all') {
          const signinResult = await this.getSigninLogs({ page: 1, limit: 10000 });
          data = data.concat(signinResult.logs.map(log => ({
            type: 'signin',
            ...log
          })));
        }

        if (type === 'system' || type === 'all') {
          const systemResult = await this.getSystemLogs({ page: 1, limit: 10000 });
          data = data.concat(systemResult.logs.map(log => ({
            type: 'system',
            ...log
          })));
        }

        if (format === 'csv') {
          const csv = this.convertToCSV(data);
          resolve(Buffer.from(csv, 'utf8'));
        } else if (format === 'json') {
          resolve(Buffer.from(JSON.stringify(data, null, 2), 'utf8'));
        } else {
          reject(new Error('不支持的导出格式'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // 转换为CSV格式
  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  },

  // 获取日志统计信息
  async getLogStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM signin_logs) as total_signin_logs,
          (SELECT COUNT(*) FROM signin_logs WHERE success = 1) as success_signin_logs,
          (SELECT COUNT(*) FROM signin_logs WHERE success = 0) as failed_signin_logs,
          (SELECT COUNT(*) FROM system_logs) as total_system_logs,
          (SELECT COUNT(*) FROM system_logs WHERE level = 'error') as error_system_logs
      `;

      database.get(sql, [], (err: any, row: any) => {
        if (err) {
          logger.error('获取日志统计失败:', err);
          reject(err);
          return;
        }

        resolve({
          signinLogs: {
            total: row.total_signin_logs,
            success: row.success_signin_logs,
            failed: row.failed_signin_logs
          },
          systemLogs: {
            total: row.total_system_logs,
            errors: row.error_system_logs
          }
        });
      });
    });
  }
};