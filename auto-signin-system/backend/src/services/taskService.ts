import { database } from '../models/database';
import { scheduleManager } from './scheduleService';
import { logger } from '../utils/logger';

export interface Task {
  id?: number;
  name: string;
  description?: string;
  cron: string;
  accountIds: number[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export const taskService = {
  // 获取所有定时任务
  async getAllTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, description, cron, account_ids, enabled, 
               created_at, updated_at, last_run_at, next_run_at
        FROM tasks 
        ORDER BY created_at DESC
      `;
      
      database.all(sql, [], (err, rows: any[]) => {
        if (err) {
          logger.error('获取定时任务列表失败:', err);
          reject(err);
          return;
        }

        const tasks = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          cron: row.cron,
          accountIds: JSON.parse(row.account_ids || '[]'),
          enabled: Boolean(row.enabled),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastRunAt: row.last_run_at,
          nextRunAt: row.next_run_at
        }));

        resolve(tasks);
      });
    });
  },

  // 根据ID获取定时任务
  async getTaskById(id: number): Promise<Task | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, description, cron, account_ids, enabled,
               created_at, updated_at, last_run_at, next_run_at
        FROM tasks 
        WHERE id = ?
      `;
      
      database.get(sql, [id], (err, row: any) => {
        if (err) {
          logger.error('获取定时任务失败:', err);
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        const task: Task = {
          id: row.id,
          name: row.name,
          description: row.description,
          cron: row.cron,
          accountIds: JSON.parse(row.account_ids || '[]'),
          enabled: Boolean(row.enabled),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastRunAt: row.last_run_at,
          nextRunAt: row.next_run_at
        };

        resolve(task);
      });
    });
  },

  // 创建定时任务
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO tasks (name, description, cron, account_ids, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        taskData.name,
        taskData.description || '',
        taskData.cron,
        JSON.stringify(taskData.accountIds),
        taskData.enabled ? 1 : 0,
        now,
        now
      ];

      database.run(sql, params, function(err) {
        if (err) {
          logger.error('创建定时任务失败:', err);
          reject(err);
          return;
        }

        const newTask: Task = {
          id: this.lastID,
          ...taskData,
          createdAt: now,
          updatedAt: now
        };

        // 如果任务启用，添加到调度器
        if (taskData.enabled) {
          // scheduleManager.addTask 方法暂时注释，等待scheduleService完善
          logger.info(`任务 ${newTask.name} 已创建，调度器集成待完善`);
        }

        logger.info(`创建定时任务成功: ${taskData.name}`);
        resolve(newTask);
      });
    });
  },

  // 更新定时任务
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | null> {
    return new Promise(async (resolve, reject) => {
      try {
        // 先获取原任务
        const existingTask = await this.getTaskById(id);
        if (!existingTask) {
          resolve(null);
          return;
        }

        const now = new Date().toISOString();
        const sql = `
          UPDATE tasks 
          SET name = ?, description = ?, cron = ?, account_ids = ?, 
              enabled = ?, updated_at = ?
          WHERE id = ?
        `;
        
        const params = [
          taskData.name || existingTask.name,
          taskData.description !== undefined ? taskData.description : existingTask.description,
          taskData.cron || existingTask.cron,
          JSON.stringify(taskData.accountIds || existingTask.accountIds),
          taskData.enabled !== undefined ? (taskData.enabled ? 1 : 0) : (existingTask.enabled ? 1 : 0),
          now,
          id
        ];

        database.run(sql, params, function(err) {
          if (err) {
            logger.error('更新定时任务失败:', err);
            reject(err);
            return;
          }

          const updatedTask: Task = {
            ...existingTask,
            ...taskData,
            id,
            updatedAt: now
          };

          // 更新调度器中的任务
          // scheduleManager.removeTask(id.toString());
          if (updatedTask.enabled) {
            // scheduleManager.addTask 方法暂时注释，等待scheduleService完善
            logger.info(`任务 ${updatedTask.name} 已更新，调度器集成待完善`);
          }

          logger.info(`更新定时任务成功: ${updatedTask.name}`);
          resolve(updatedTask);
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  // 删除定时任务
  async deleteTask(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM tasks WHERE id = ?';
      
      database.run(sql, [id], function(err) {
        if (err) {
          logger.error('删除定时任务失败:', err);
          reject(err);
          return;
        }

        if (this.changes === 0) {
          resolve(false);
          return;
        }

        // 从调度器中移除任务
        // scheduleManager.removeTask(id.toString());
        logger.info(`任务 ID ${id} 已删除，调度器集成待完善`);

        logger.info(`删除定时任务成功: ID ${id}`);
        resolve(true);
      });
    });
  },

  // 启用/禁用定时任务
  async toggleTask(id: number, enabled: boolean): Promise<Task | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const task = await this.getTaskById(id);
        if (!task) {
          resolve(null);
          return;
        }

        const now = new Date().toISOString();
        const sql = 'UPDATE tasks SET enabled = ?, updated_at = ? WHERE id = ?';
        
        database.run(sql, [enabled ? 1 : 0, now, id], function(err) {
          if (err) {
            logger.error('切换定时任务状态失败:', err);
            reject(err);
            return;
          }

          const updatedTask: Task = {
            ...task,
            enabled,
            updatedAt: now
          };

          // 更新调度器
          // scheduleManager.removeTask(id.toString());
          if (enabled) {
            // scheduleManager.addTask 方法暂时注释，等待scheduleService完善
            logger.info(`任务 ${task.name} 状态已切换为${enabled ? '启用' : '禁用'}，调度器集成待完善`);
          }

          logger.info(`${enabled ? '启用' : '禁用'}定时任务: ${task.name}`);
          resolve(updatedTask);
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  // 更新任务的最后运行时间
  async updateLastRunTime(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = 'UPDATE tasks SET last_run_at = ? WHERE id = ?';
      
      database.run(sql, [now, id], (err) => {
        if (err) {
          logger.error('更新任务运行时间失败:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  // 获取启用的定时任务
  async getEnabledTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, description, cron, account_ids, enabled,
               created_at, updated_at, last_run_at, next_run_at
        FROM tasks 
        WHERE enabled = 1
        ORDER BY created_at DESC
      `;
      
      database.all(sql, [], (err, rows: any[]) => {
        if (err) {
          logger.error('获取启用的定时任务失败:', err);
          reject(err);
          return;
        }

        const tasks = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          cron: row.cron,
          accountIds: JSON.parse(row.account_ids || '[]'),
          enabled: Boolean(row.enabled),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastRunAt: row.last_run_at,
          nextRunAt: row.next_run_at
        }));

        resolve(tasks);
      });
    });
  }
};