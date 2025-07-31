import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { accountService, Account } from './accountService';
import { dbRun, database } from '../models/database';

export interface SigninResult {
  accountId: number;
  accountName: string;
  success: boolean;
  message: string;
  responseData?: string;
  executionTime: number;
}

export class SigninExecutor {
  // 执行单个账号签到
  async executeSignin(account: Account): Promise<SigninResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`开始执行账号签到: ${account.name}`);
      
      // 准备请求配置
      const config: any = {
        method: account.method,
        url: account.signinUrl,
        timeout: 30000, // 30秒超时
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': account.cookies
        }
      };

      // 添加自定义headers
      if (account.headers) {
        try {
          const customHeaders = JSON.parse(account.headers);
          config.headers = { ...config.headers, ...customHeaders };
        } catch (error) {
          logger.warn(`解析自定义headers失败: ${account.name}`, error);
        }
      }

      // 添加请求体（仅POST请求）
      if (account.method === 'POST' && account.requestBody) {
        try {
          // 支持动态替换时间戳等变量
          let requestBody = account.requestBody;
          requestBody = requestBody.replace(/\{\{timestamp\}\}/g, Date.now().toString());
          requestBody = requestBody.replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0]);
          
          config.data = JSON.parse(requestBody);
          
          if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
          }
        } catch (error) {
          logger.warn(`解析请求体失败: ${account.name}`, error);
        }
      }

      // 执行请求
      const response: AxiosResponse = await axios(config);
      const executionTime = Date.now() - startTime;
      
      // 判断签到是否成功
      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const isSuccess = this.checkSigninSuccess(response, account.successKeyword, responseText);
      
      const result: SigninResult = {
        accountId: account.id!,
        accountName: account.name,
        success: isSuccess,
        message: isSuccess ? '签到成功' : '签到失败',
        responseData: responseText,
        executionTime
      };

      // 记录日志到数据库
      await this.saveSigninLog(result);
      
      // 更新账号最后签到信息
      await accountService.updateLastSignin(account.id!, isSuccess);
      
      logger.info(`账号签到完成: ${account.name}, 结果: ${isSuccess ? '成功' : '失败'}, 耗时: ${executionTime}ms`);
      
      return result;
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.message || error.message || '网络请求失败';
      
      const result: SigninResult = {
        accountId: account.id!,
        accountName: account.name,
        success: false,
        message: errorMessage,
        responseData: error.response ? JSON.stringify(error.response.data) : error.message,
        executionTime
      };

      // 记录错误日志
      await this.saveSigninLog(result);
      await accountService.updateLastSignin(account.id!, false);
      
      logger.error(`账号签到失败: ${account.name}`, error);
      
      return result;
    }
  }

  // 批量执行签到
  async executeBatchSignin(accountIds?: number[]): Promise<{
    results: SigninResult[];
    summary: { success: number; fail: number; total: number };
  }> {
    try {
      let accounts: Account[];
      
      if (accountIds && accountIds.length > 0) {
        // 执行指定账号
        accounts = [];
        for (const id of accountIds) {
          const account = await accountService.getAccountById(id);
          if (account && account.enabled) {
            accounts.push(account);
          }
        }
      } else {
        // 执行所有启用的账号
        accounts = await accountService.getEnabledAccounts();
      }

      if (accounts.length === 0) {
        return {
          results: [],
          summary: { success: 0, fail: 0, total: 0 }
        };
      }

      logger.info(`开始批量签到，账号数量: ${accounts.length}`);

      // 并发执行签到（限制并发数为3，避免请求过于频繁）
      const results: SigninResult[] = [];
      const batchSize = 3;
      
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);
        const batchPromises = batch.map(account => this.executeSignin(account));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // 批次间延迟，避免请求过于频繁
        if (i + batchSize < accounts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const summary = {
        success: results.filter(r => r.success).length,
        fail: results.filter(r => !r.success).length,
        total: results.length
      };

      logger.info(`批量签到完成，成功: ${summary.success}, 失败: ${summary.fail}, 总计: ${summary.total}`);

      return { results, summary };
      
    } catch (error) {
      logger.error('批量签到执行失败:', error);
      throw error;
    }
  }

  // 检查签到是否成功
  private checkSigninSuccess(response: AxiosResponse, successKeyword?: string, responseText?: string): boolean {
    // 首先检查HTTP状态码
    if (response.status < 200 || response.status >= 300) {
      return false;
    }

    // 如果没有设置成功关键词，则认为HTTP 2xx就是成功
    if (!successKeyword) {
      return true;
    }

    // 检查响应内容是否包含成功关键词
    const textToCheck = responseText || JSON.stringify(response.data);
    return textToCheck.includes(successKeyword);
  }

  // 保存签到日志到数据库
  private async saveSigninLog(result: SigninResult): Promise<void> {
    try {
      await dbRun(`
        INSERT INTO signin_logs (accountId, accountName, status, message, responseData, executionTime)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        result.accountId,
        result.accountName,
        result.success ? 'success' : 'failed',
        result.message,
        result.responseData || '',
        result.executionTime
      ]);
    } catch (error) {
      logger.error('保存签到日志失败:', error);
    }
  }

  // 测试账号连接
  async testConnection(account: Account): Promise<{
    success: boolean;
    status: number;
    statusText: string;
    executionTime: number;
    responseData: string;
  }> {
    const startTime = Date.now();
    
    try {
      const config: any = {
        method: account.method,
        url: account.signinUrl,
        timeout: 10000, // 10秒超时
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': account.cookies
        }
      };

      if (account.headers) {
        try {
          const customHeaders = JSON.parse(account.headers);
          config.headers = { ...config.headers, ...customHeaders };
        } catch (error) {
          // 忽略headers解析错误
        }
      }

      const response = await axios(config);
      const executionTime = Date.now() - startTime;
      
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        executionTime,
        responseData: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      };
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        status: error.response?.status || 0,
        statusText: error.response?.statusText || error.message,
        executionTime,
        responseData: error.response ? JSON.stringify(error.response.data) : error.message
      };
    }
  }

  // 获取签到日志
  async getSigninLogs(filters: {
    accountId?: number;
    status?: string;
    page: number;
    limit: number;
  }) {
    try {
      const { accountId, status, page, limit } = filters;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const params: any[] = [];
      
      if (accountId) {
        whereClause += ' WHERE accountId = ?';
        params.push(accountId);
      }
      
      if (status) {
        whereClause += accountId ? ' AND status = ?' : ' WHERE status = ?';
        params.push(status);
      }
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM signin_logs${whereClause}`;
      const countResult = await new Promise<{ total: number }>((resolve, reject) => {
        database.get(countQuery, params, (err, row: any) => {
          if (err) reject(err);
          else resolve(row as { total: number });
        });
      });
      const total = countResult.total;
      
      // 获取分页数据
      const dataQuery = `
        SELECT * FROM signin_logs${whereClause}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);
      const logs = await new Promise((resolve, reject) => {
        database.all(dataQuery, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取签到日志失败:', error);
      throw error;
    }
  }

  // 获取日志统计信息
  async getLogStats() {
    try {
      const total = await new Promise<number>((resolve, reject) => {
        database.get('SELECT COUNT(*) as count FROM signin_logs', (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      const success = await new Promise<number>((resolve, reject) => {
        database.get('SELECT COUNT(*) as count FROM signin_logs WHERE status = ?', ['success'], (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      const failed = await new Promise<number>((resolve, reject) => {
        database.get('SELECT COUNT(*) as count FROM signin_logs WHERE status = ?', ['failed'], (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      return {
        total,
        success,
        failed,
        successRate: total > 0 ? Math.round((success / total) * 100) : 0
      };
    } catch (error) {
      logger.error('获取日志统计失败:', error);
      throw error;
    }
  }

  // 清空日志
  async clearLogs() {
    try {
      await new Promise<void>((resolve, reject) => {
        database.run('DELETE FROM signin_logs', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('签到日志已清空');
    } catch (error) {
      logger.error('清空日志失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const signinExecutor = new SigninExecutor();
