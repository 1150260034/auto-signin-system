import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll, Account } from '../models/database';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import axios from 'axios';

// 获取所有账号
export const getAllAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await dbAll(`
      SELECT id, name, description, signin_url as signinUrl, method, cookies, headers, 
             request_body as requestBody, success_keyword as successKeyword, enabled, 
             last_signin_at as lastSigninAt, last_signin_status as lastSigninStatus, 
             created_at as createdAt, updated_at as updatedAt
      FROM accounts 
      ORDER BY created_at DESC
    `) as Account[];

    res.json({
      success: true,
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    logger.error('获取账号列表失败:', error);
    throw new AppError('获取账号列表失败', 500);
  }
};

// 根据ID获取账号
export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const account = await dbGet(`
      SELECT id, name, description, signin_url as signinUrl, method, cookies, headers, 
             request_body as requestBody, success_keyword as successKeyword, enabled, 
             last_signin_at as lastSigninAt, last_signin_status as lastSigninStatus, 
             created_at as createdAt, updated_at as updatedAt
      FROM accounts 
      WHERE id = ?
    `, [id]) as Account;

    if (!account) {
      throw new AppError('账号不存在', 404);
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    logger.error('获取账号详情失败:', error);
    throw error;
  }
};

// 创建新账号
export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, signinUrl, method = 'POST', cookies, headers, requestBody, successKeyword, enabled = true } = req.body;

    // 验证必填字段
    if (!name || !signinUrl || !cookies) {
      throw new AppError('账号名称、签到地址和Cookie为必填项', 400);
    }

    // 检查账号名称是否重复
    const existingAccount = await dbGet(`
      SELECT id FROM accounts WHERE name = ?
    `, [name]);

    if (existingAccount) {
      throw new AppError('账号名称已存在', 400);
    }

    const result = await dbRun(`
      INSERT INTO accounts (name, description, signin_url, method, cookies, headers, request_body, success_keyword, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, signinUrl, method, cookies, headers || null, requestBody || null, successKeyword || null, enabled ? 1 : 0]);

    const newAccount = await dbGet(`
      SELECT id, name, description, signin_url as signinUrl, method, cookies, headers, 
             request_body as requestBody, success_keyword as successKeyword, enabled, 
             created_at as createdAt
      FROM accounts 
      WHERE id = ?
    `, [result.lastID]) as Account;

    logger.info(`创建账号成功: ${name}`);
    res.status(201).json({
      success: true,
      message: '账号创建成功',
      data: newAccount
    });
  } catch (error) {
    logger.error('创建账号失败:', error);
    throw error;
  }
};

// 更新账号
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, signinUrl, method, cookies, headers, requestBody, successKeyword, enabled } = req.body;

    // 检查账号是否存在
    const existingAccount = await dbGet(`
      SELECT id FROM accounts WHERE id = ?
    `, [id]);

    if (!existingAccount) {
      throw new AppError('账号不存在', 404);
    }

    // 检查账号名称是否重复（排除当前账号）
    if (name) {
      const duplicateAccount = await dbGet(`
        SELECT id FROM accounts WHERE name = ? AND id != ?
      `, [name, id]);

      if (duplicateAccount) {
        throw new AppError('账号名称已存在', 400);
      }
    }

    await dbRun(`
      UPDATE accounts 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          signin_url = COALESCE(?, signin_url),
          method = COALESCE(?, method),
          cookies = COALESCE(?, cookies),
          headers = COALESCE(?, headers),
          request_body = COALESCE(?, request_body),
          success_keyword = COALESCE(?, success_keyword),
          enabled = COALESCE(?, enabled),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, signinUrl, method, cookies, headers, requestBody, successKeyword, enabled !== undefined ? (enabled ? 1 : 0) : null, id]);

    const updatedAccount = await dbGet(`
      SELECT id, name, description, signin_url as signinUrl, method, cookies, headers, 
             request_body as requestBody, success_keyword as successKeyword, enabled, 
             updated_at as updatedAt
      FROM accounts 
      WHERE id = ?
    `, [id]) as Account;

    logger.info(`更新账号成功: ${updatedAccount.name}`);
    res.json({
      success: true,
      message: '账号更新成功',
      data: updatedAccount
    });
  } catch (error) {
    logger.error('更新账号失败:', error);
    throw error;
  }
};

// 删除账号
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查账号是否存在
    const account = await dbGet(`
      SELECT name FROM accounts WHERE id = ?
    `, [id]) as Account;

    if (!account) {
      throw new AppError('账号不存在', 404);
    }

    await dbRun(`DELETE FROM accounts WHERE id = ?`, [id]);

    logger.info(`删除账号成功: ${account.name}`);
    res.json({
      success: true,
      message: '账号删除成功'
    });
  } catch (error) {
    logger.error('删除账号失败:', error);
    throw error;
  }
};

// 测试账号连接
export const testAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const account = await dbGet(`
      SELECT name, cookies, signin_url as signinUrl, method, headers FROM accounts WHERE id = ?
    `, [id]) as Account;

    if (!account) {
      throw new AppError('账号不存在', 404);
    }

    const startTime = Date.now();
    
    // 解析headers
    let parsedHeaders: any = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    if (account.headers) {
      try {
        parsedHeaders = { ...parsedHeaders, ...JSON.parse(account.headers) };
      } catch (e) {
        logger.warn('解析headers失败，使用默认headers');
      }
    }

    // 添加Cookie到headers
    parsedHeaders.Cookie = account.cookies;

    // 发送测试请求
    const response = await axios({
      method: account.method || 'GET',
      url: account.signinUrl,
      headers: parsedHeaders,
      timeout: 10000,
      validateStatus: () => true // 接受所有状态码
    });

    const executionTime = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 400;

    logger.info(`测试账号连接: ${account.name}, 状态: ${response.status}, 耗时: ${executionTime}ms`);

    res.json({
      success: true,
      data: {
        accountName: account.name,
        status: response.status,
        statusText: response.statusText,
        executionTime,
        isSuccess,
        responseData: typeof response.data === 'string' ? response.data.substring(0, 500) : JSON.stringify(response.data).substring(0, 500)
      }
    });
  } catch (error: any) {
    logger.error('测试账号连接失败:', error);
    
    res.json({
      success: false,
      message: '连接测试失败',
      error: error.message || '未知错误'
    });
  }
};