import { initDatabase, dbRun, dbGet } from '../models/database';
import { logger } from './logger';

// 初始化数据库并插入测试数据
export async function initDatabaseWithTestData(): Promise<void> {
  try {
    // 初始化数据库表
    await initDatabase();
    
    // 检查是否已有测试数据
    const existingAccount = await dbGet('SELECT id FROM accounts LIMIT 1');
    if (existingAccount) {
      logger.info('数据库已有数据，跳过测试数据插入');
      return;
    }

    // 插入测试账号数据
    const testAccounts = [
      {
        name: '测试账号1',
        description: '这是一个测试签到账号',
        signin_url: 'https://api.example.com/signin',
        method: 'POST',
        cookies: 'session_id=abc123; user_token=xyz789',
        headers: '{"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}',
        request_body: '{"action": "signin", "timestamp": "{{timestamp}}"}',
        success_keyword: 'success',
        enabled: 1
      },
      {
        name: '测试账号2',
        description: '另一个测试签到账号',
        signin_url: 'https://api.test.com/checkin',
        method: 'GET',
        cookies: 'auth_token=def456; session=uvw012',
        headers: '{"Authorization": "Bearer token123"}',
        request_body: '',
        success_keyword: 'ok',
        enabled: 1
      },
      {
        name: '禁用账号',
        description: '这是一个已禁用的测试账号',
        signin_url: 'https://api.disabled.com/signin',
        method: 'POST',
        cookies: 'disabled_token=ghi789',
        headers: '{"Content-Type": "application/json"}',
        request_body: '{"type": "daily_signin"}',
        success_keyword: 'success',
        enabled: 0
      }
    ];

    for (const account of testAccounts) {
      await dbRun(`
        INSERT INTO accounts (name, description, signin_url, method, cookies, headers, request_body, success_keyword, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        account.name,
        account.description,
        account.signin_url,
        account.method,
        account.cookies,
        account.headers,
        account.request_body,
        account.success_keyword,
        account.enabled
      ]);
    }

    // 插入测试签到日志
    const testLogs = [
      {
        accountId: 1,
        accountName: '测试账号1',
        status: 'success',
        message: '签到成功',
        responseData: '{"code": 200, "message": "签到成功", "data": {"points": 10}}',
        executionTime: 1250
      },
      {
        accountId: 2,
        accountName: '测试账号2',
        status: 'success',
        message: '签到成功',
        responseData: '{"status": "ok", "reward": "5积分"}',
        executionTime: 980
      },
      {
        accountId: 1,
        accountName: '测试账号1',
        status: 'failed',
        message: 'Cookie已过期',
        responseData: '{"error": "unauthorized", "code": 401}',
        executionTime: 500
      }
    ];

    for (const log of testLogs) {
      await dbRun(`
        INSERT INTO signin_logs (accountId, accountName, status, message, responseData, executionTime)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        log.accountId,
        log.accountName,
        log.status,
        log.message,
        log.responseData,
        log.executionTime
      ]);
    }

    logger.info('测试数据插入成功');
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    throw error;
  }
}

// 清空所有数据
export async function clearAllData(): Promise<void> {
  try {
    await dbRun('DELETE FROM signin_logs');
    await dbRun('DELETE FROM accounts');
    await dbRun('DELETE FROM schedule_tasks WHERE name != "每日自动签到"');
    
    // 重置自增ID
    await dbRun('DELETE FROM sqlite_sequence WHERE name IN ("accounts", "signin_logs")');
    
    logger.info('所有数据已清空');
  } catch (error) {
    logger.error('清空数据失败:', error);
    throw error;
  }
}

// 重置数据库到初始状态
export async function resetDatabase(): Promise<void> {
  try {
    await clearAllData();
    await initDatabaseWithTestData();
    logger.info('数据库重置完成');
  } catch (error) {
    logger.error('数据库重置失败:', error);
    throw error;
  }
}