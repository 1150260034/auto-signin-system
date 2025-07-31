import axios, { AxiosRequestConfig } from 'axios';
import { accountService } from './accountService';
import { logService } from './logService';
import { logger } from '../utils/logger';

export interface SigninResult {
  accountId: number;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const signinService = {
  // 执行单个账号签到
  async executeSignin(accountId: number): Promise<SigninResult> {
    try {
      logger.info(`开始执行账号 ${accountId} 的签到`);
      
      // 获取账号信息
      const account = await accountService.getAccountById(accountId);
      if (!account) {
        throw new Error('账号不存在');
      }

      if (!account.enabled) {
        throw new Error('账号已禁用');
      }

      // 解析Cookie和Headers
      const cookies = this.parseCookies(account.cookies);
      const headers = account.headers ? JSON.parse(account.headers) : {};

      // 构建请求配置
      const requestConfig: AxiosRequestConfig = {
        method: account.method as any,
        url: account.signinUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies,
          ...headers
        },
        timeout: 30000,
        validateStatus: () => true // 不自动抛出HTTP错误
      };

      // 添加请求体（如果是POST请求）
      if (account.method.toLowerCase() === 'post' && account.requestBody) {
        requestConfig.data = JSON.parse(account.requestBody);
        requestConfig.headers!['Content-Type'] = 'application/json';
      }

      // 发送签到请求
      const response = await axios(requestConfig);
      
      // 判断签到是否成功
      const isSuccess = this.checkSigninSuccess(response.data, account.successKeyword);
      
      const result: SigninResult = {
        accountId,
        success: isSuccess,
        message: isSuccess ? '签到成功' : '签到失败',
        data: response.data
      };

      // 记录签到日志
      await logService.createSigninLog({
        accountId,
        accountName: account.name,
        success: isSuccess,
        message: result.message,
        responseData: JSON.stringify(response.data),
        statusCode: response.status
      });

      logger.info(`账号 ${accountId} 签到完成: ${result.message}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`账号 ${accountId} 签到失败:`, error);

      // 记录错误日志
      await logService.createSigninLog({
        accountId,
        accountName: `账号${accountId}`,
        success: false,
        message: `签到失败: ${errorMessage}`,
        responseData: JSON.stringify({ error: errorMessage }),
        statusCode: 0
      });

      return {
        accountId,
        success: false,
        message: `签到失败: ${errorMessage}`,
        error: errorMessage
      };
    }
  },

  // 批量执行签到
  async batchExecuteSignin(accountIds: number[]): Promise<SigninResult[]> {
    logger.info(`开始批量执行签到，账号数量: ${accountIds.length}`);
    
    const results: SigninResult[] = [];
    
    // 并发执行签到，但限制并发数量
    const concurrency = 3; // 最大并发数
    for (let i = 0; i < accountIds.length; i += concurrency) {
      const batch = accountIds.slice(i, i + concurrency);
      const batchPromises = batch.map(accountId => this.executeSignin(accountId));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟，避免请求过于频繁
      if (i + concurrency < accountIds.length) {
        await this.delay(2000);
      }
    }

    logger.info(`批量签到完成，成功: ${results.filter(r => r.success).length}，失败: ${results.filter(r => !r.success).length}`);
    return results;
  },

  // 测试签到接口
  async testSignin(accountId: number): Promise<SigninResult> {
    logger.info(`开始测试账号 ${accountId} 的签到接口`);
    
    try {
      const account = await accountService.getAccountById(accountId);
      if (!account) {
        throw new Error('账号不存在');
      }

      // 构建测试请求
      const cookies = this.parseCookies(account.cookies);
      const headers = account.headers ? JSON.parse(account.headers) : {};

      const requestConfig: AxiosRequestConfig = {
        method: account.method as any,
        url: account.signinUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies,
          ...headers
        },
        timeout: 10000,
        validateStatus: () => true
      };

      if (account.method.toLowerCase() === 'post' && account.requestBody) {
        requestConfig.data = JSON.parse(account.requestBody);
        requestConfig.headers!['Content-Type'] = 'application/json';
      }

      const response = await axios(requestConfig);
      
      return {
        accountId,
        success: response.status === 200,
        message: `测试完成，状态码: ${response.status}`,
        data: {
          status: response.status,
          headers: response.headers,
          data: response.data
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`测试签到接口失败:`, error);

      return {
        accountId,
        success: false,
        message: `测试失败: ${errorMessage}`,
        error: errorMessage
      };
    }
  },

  // 解析Cookie字符串
  parseCookies(cookieString: string): string {
    if (!cookieString) return '';
    
    // 如果已经是标准格式，直接返回
    if (cookieString.includes('=') && !cookieString.includes('{')) {
      return cookieString;
    }

    // 尝试解析JSON格式的Cookie
    try {
      const cookieObj = JSON.parse(cookieString);
      return Object.entries(cookieObj)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    } catch {
      return cookieString;
    }
  },

  // 检查签到是否成功
  checkSigninSuccess(responseData: any, successKeyword?: string): boolean {
    if (!successKeyword) {
      return true; // 如果没有设置成功关键词，默认认为成功
    }

    const responseStr = JSON.stringify(responseData).toLowerCase();
    const keywords = successKeyword.toLowerCase().split(',').map(k => k.trim());
    
    return keywords.some(keyword => responseStr.includes(keyword));
  },

  // 延迟函数
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};