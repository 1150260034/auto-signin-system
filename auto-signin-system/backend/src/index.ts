import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 基础API路由
app.get('/api/accounts', (req, res) => {
  res.json({ accounts: [], message: '账号列表' });
});

app.post('/api/accounts', (req, res) => {
  res.json({ success: true, message: '账号添加成功' });
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: [], message: '日志列表' });
});

app.get('/api/tasks', (req, res) => {
  res.json({ tasks: [], message: '任务列表' });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`服务器启动成功，端口: ${PORT}`);
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;