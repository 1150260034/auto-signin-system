import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { initDatabaseWithTestData } from './utils/database-init';
import { accountService } from './services/accountService';
import { signinExecutor } from './services/signin-executor';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 任务配置数据（保留用于任务管理）
let tasks: any[] = [
  {
    id: 'daily-signin',
    name: '每日自动签到',
    cronExpression: '0 9 * * *',
    enabled: true,
    nextRun: '2024-01-16 09:00:00'
  }
];

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: '服务器运行正常'
  });
});

// 账号管理API
app.get('/api/accounts', async (req, res): Promise<void> => {
  try {
    const accounts = await accountService.getAllAccounts();
    res.json({
      success: true,
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    logger.error('获取账号列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取账号列表失败'
    });
  }
});

app.get('/api/accounts/:id', async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const account = await accountService.getAccountById(id);
    
    if (!account) {
      res.status(404).json({
        success: false,
        message: '账号不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    logger.error('获取账号失败:', error);
    res.status(500).json({
      success: false,
      message: '获取账号失败'
    });
  }
});

app.post('/api/accounts', async (req, res): Promise<void> => {
  try {
    const { name, description, signinUrl, method = 'POST', cookies, headers, requestBody, successKeyword, enabled = true } = req.body;
    
    if (!name || !signinUrl || !cookies) {
      res.status(400).json({
        success: false,
        message: '账号名称、签到地址和Cookie为必填项'
      });
      return;
    }
    
    const accountData = {
      name,
      description,
      signinUrl,
      method: method as 'GET' | 'POST',
      cookies,
      headers,
      requestBody,
      successKeyword,
      enabled
    };
    
    const newAccount = await accountService.createAccount(accountData);
    
    res.status(201).json({
      success: true,
      message: '账号创建成功',
      data: newAccount
    });
  } catch (error) {
    logger.error('创建账号失败:', error);
    res.status(500).json({
      success: false,
      message: '创建账号失败'
    });
  }
});

app.put('/api/accounts/:id', async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const updatedAccount = await accountService.updateAccount(id, req.body);
    
    if (!updatedAccount) {
      res.status(404).json({
        success: false,
        message: '账号不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      message: '账号更新成功',
      data: updatedAccount
    });
  } catch (error) {
    logger.error('更新账号失败:', error);
    res.status(500).json({
      success: false,
      message: '更新账号失败'
    });
  }
});

app.delete('/api/accounts/:id', async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await accountService.deleteAccount(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: '账号不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      message: '账号删除成功'
    });
  } catch (error) {
    logger.error('删除账号失败:', error);
    res.status(500).json({
      success: false,
      message: '删除账号失败'
    });
  }
});

app.post('/api/accounts/:id/test', async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const account = await accountService.getAccountById(id);
    
    if (!account) {
      res.status(404).json({
        success: false,
        message: '账号不存在'
      });
      return;
    }
    
    // 使用真实的连接测试
    const testResult = await signinExecutor.testConnection(account);
    
    res.json({
      success: true,
      data: {
        accountName: account.name,
        status: testResult.status,
        statusText: testResult.statusText,
        executionTime: testResult.executionTime,
        isSuccess: testResult.success,
        responseData: testResult.responseData
      }
    });
  } catch (error) {
    logger.error('测试账号连接失败:', error);
    res.status(500).json({
      success: false,
      message: '测试连接失败'
    });
  }
});

// 签到API
app.post('/api/signin/execute', async (req, res): Promise<void> => {
  try {
    const { accountIds } = req.body; // 可选：指定要执行的账号ID数组
    
    const { results, summary } = await signinExecutor.executeBatchSignin(accountIds);
    
    res.json({
      success: true,
      message: '签到任务执行完成',
      data: {
        success: summary.success,
        fail: summary.fail,
        total: summary.total,
        results: results.map(r => ({
          accountId: r.accountId,
          accountName: r.accountName,
          success: r.success,
          message: r.message,
          executionTime: r.executionTime
        }))
      }
    });
  } catch (error) {
    logger.error('批量签到执行失败:', error);
    res.status(500).json({
      success: false,
      message: '签到执行失败'
    });
  }
});

app.post('/api/signin/execute/:id', async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const account = await accountService.getAccountById(id);
    
    if (!account) {
      res.status(404).json({
        success: false,
        message: '账号不存在'
      });
      return;
    }
    
    if (!account.enabled) {
      res.status(400).json({
        success: false,
        message: '账号已禁用'
      });
      return;
    }
    
    const result = await signinExecutor.executeSignin(account);
    
    res.json({
      success: true,
      message: `账号 ${account.name} 签到完成`,
      data: {
        accountId: result.accountId,
        accountName: result.accountName,
        success: result.success,
        message: result.message,
        executionTime: result.executionTime
      }
    });
  } catch (error) {
    logger.error('单账号签到执行失败:', error);
    res.status(500).json({
      success: false,
      message: '签到执行失败'
    });
  }
});

app.get('/api/signin/status', async (req, res): Promise<void> => {
  try {
    const accounts = await accountService.getAllAccounts();
    const enabledAccounts = accounts.filter(acc => acc.enabled);
    
    // 获取最近的签到时间
    const lastSigninTime = enabledAccounts.reduce((latest: string | null, acc) => {
      if (!acc.lastSigninAt) return latest;
      return !latest || acc.lastSigninAt > latest ? acc.lastSigninAt : latest;
    }, null as string | null);
    
    res.json({
      success: true,
      data: {
        totalAccounts: accounts.length,
        enabledAccounts: enabledAccounts.length,
        disabledAccounts: accounts.length - enabledAccounts.length,
        lastSigninTime
      }
    });
  } catch (error) {
    logger.error('获取签到状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取签到状态失败'
    });
  }
});

// 任务管理API
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: {
      tasks,
      stats: {
        total: tasks.length,
        enabled: tasks.filter(t => t.enabled).length,
        disabled: tasks.filter(t => !t.enabled).length
      }
    }
  });
});

app.put('/api/tasks/default/signin-time', (req, res) => {
  const { hour, minute = 0 } = req.body;
  
  if (typeof hour !== 'number' || hour < 0 || hour > 23) {
    res.status(400).json({
      success: false,
      message: '小时必须是0-23之间的数字'
    });
    return;
  }
  
  if (typeof minute !== 'number' || minute < 0 || minute > 59) {
    res.status(400).json({
      success: false,
      message: '分钟必须是0-59之间的数字'
    });
    return;
  }
  
  const cronExpression = `${minute} ${hour} * * *`;
  const defaultTask = tasks.find(t => t.id === 'daily-signin');
  
  if (defaultTask) {
    defaultTask.cronExpression = cronExpression;
    
    // 计算下次执行时间
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, minute, 0, 0);
    defaultTask.nextRun = tomorrow.toISOString();
  }
  
  res.json({
    success: true,
    message: `签到时间已更新为 ${hour}:${minute.toString().padStart(2, '0')}`
  });
});

// 日志API
app.get('/api/logs/signin', async (req, res): Promise<void> => {
  try {
    const { page = 1, limit = 20, accountId, status } = req.query;
    
    const filters = {
      accountId: accountId ? parseInt(accountId as string) : undefined,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };
    
    const result = await signinExecutor.getSigninLogs(filters);
    
    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        pages: result.pagination.pages
      }
    });
  } catch (error) {
    logger.error('获取签到日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日志失败'
    });
  }
});

app.get('/api/logs/stats', async (req, res): Promise<void> => {
  try {
    const stats = await signinExecutor.getLogStats();
    
    res.json({
      success: true,
      data: {
        signinLogs: {
          total: stats.total,
          success: stats.success,
          failed: stats.failed
        },
        systemLogs: {
          total: 0,
          errors: 0
        }
      }
    });
  } catch (error) {
    logger.error('获取日志统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

app.delete('/api/logs/clear', async (req, res): Promise<void> => {
  try {
    await signinExecutor.clearLogs();
    
    res.json({
      success: true,
      message: '日志已清空'
    });
  } catch (error) {
    logger.error('清空日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清空日志失败'
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 错误处理
app.use((err: any, req: any, res: any, next: any) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
const startServer = async (): Promise<void> => {
  try {
    // 初始化数据库
    await initDatabaseWithTestData();
    
    app.listen(PORT, () => {
      logger.info(`服务器已启动，端口: ${PORT}`);
      logger.info(`API地址: http://localhost:${PORT}`);
      logger.info(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

export default app;