// PM2 进程管理配置文件
module.exports = {
  apps: [
    {
      name: 'auto-signin-system',
      script: './backend/dist/server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },

      // 日志配置
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 进程管理
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      max_memory_restart: '500M',
      
      // 自动重启配置
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 健康检查
      health_check_grace_period: 3000,
      
      // 其他配置
      merge_logs: true,
      time: true
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'root',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/auto-signin-system.git',
      path: '/var/www/auto-signin-system',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};