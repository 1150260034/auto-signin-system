import { database } from '../models/database';
import { logger } from '../utils/logger';

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
  createdAt?: string;
  updatedAt?: string;
  lastSigninAt?: string;
  lastSigninStatus?: boolean;
}

export const accountService = {
  // 获取所有账号
  async getAllAccounts(): Promise<Account[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, description, signin_url, method, cookies, headers, 
               request_body, success_keyword, enabled, created_at, updated_at,
               last_signin_at, last_signin_status
        FROM accounts 
        ORDER BY created_at DESC
      `;
      
      database.all(sql, [], (err: any, rows: any[]) => {
        if (err) {
          logger.error('获取账号列表失败:', err);
          reject(err);
          return;
        }

        const accounts = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          signinUrl: row.signin_url,
          method: row.method as 'GET' | 'POST',
          cookies: row.cookies,
          headers: row.headers,
          requestBody: row.request_body,
          successKeyword: row.success_keyword,
          enabled: Boolean(row.enabled),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastSigninAt: row.last_signin_at,
          lastSigninStatus: row.last_signin_status ? Boolean(row.last_signin_status) : undefined
        }));

        resolve(accounts);
      });
    });
  },

  // 根据ID获取账号
  async getAccountById(id: number): Promise<Account | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, description, signin_url, method, cookies, headers,
               request_body, success_keyword, enabled, created_at, updated_at,
               last_signin_at, last_signin_status
        FROM accounts 
        WHERE id = ?
      `;
      
      database.get(sql, [id], (err: any, row: any) => {
        if (err) {
          logger.error('获取账号失败:', err);
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        const account: Account = {
          id: row.id,
          name: row.name,
          description: row.description,
          signinUrl: row.signin_url,
          method: row.method as 'GET' | 'POST',
          cookies: row.cookies,
          headers: row.headers,
          requestBody: row.request_body,
          successKeyword: row.success_keyword,
          enabled: Boolean(row.enabled),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastSigninAt: row.last_signin_at,
          lastSigninStatus: row.last_signin_status ? Boolean(row.last_signin_status) : undefined
        };

        resolve(account);
      });
    });
  },

  // 创建账号
  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = `
        INSERT INTO accounts (name, description, signin_url, method, cookies, headers, 
                            request_body, success_keyword, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        accountData.name,
        accountData.description || '',
        accountData.signinUrl,
        accountData.method,
        accountData.cookies,
        accountData.headers || '',
        accountData.requestBody || '',
        accountData.successKeyword || '',
        accountData.enabled ? 1 : 0,
        now,
        now
      ];

      database.run(sql, params, function(this: any, err: any) {
        if (err) {
          logger.error('创建账号失败:', err);
          reject(err);
          return;
        }

        const newAccount: Account = {
          id: this.lastID,
          ...accountData,
          createdAt: now,
          updatedAt: now
        };

        logger.info(`创建账号成功: ${accountData.name}`);
        resolve(newAccount);
      });
    });
  },

  // 更新账号
  async updateAccount(id: number, accountData: Partial<Account>): Promise<Account | null> {
    return new Promise(async (resolve, reject) => {
      try {
        // 先获取原账号
        const existingAccount = await this.getAccountById(id);
        if (!existingAccount) {
          resolve(null);
          return;
        }

        const now = new Date().toISOString();
        const sql = `
          UPDATE accounts 
          SET name = ?, description = ?, signin_url = ?, method = ?, cookies = ?, 
              headers = ?, request_body = ?, success_keyword = ?, enabled = ?, updated_at = ?
          WHERE id = ?
        `;
        
        const params = [
          accountData.name || existingAccount.name,
          accountData.description !== undefined ? accountData.description : existingAccount.description,
          accountData.signinUrl || existingAccount.signinUrl,
          accountData.method || existingAccount.method,
          accountData.cookies || existingAccount.cookies,
          accountData.headers !== undefined ? accountData.headers : existingAccount.headers,
          accountData.requestBody !== undefined ? accountData.requestBody : existingAccount.requestBody,
          accountData.successKeyword !== undefined ? accountData.successKeyword : existingAccount.successKeyword,
          accountData.enabled !== undefined ? (accountData.enabled ? 1 : 0) : (existingAccount.enabled ? 1 : 0),
          now,
          id
        ];

        database.run(sql, params, function(this: any, err: any) {
          if (err) {
            logger.error('更新账号失败:', err);
            reject(err);
            return;
          }

          const updatedAccount: Account = {
            ...existingAccount,
            ...accountData,
            id,
            updatedAt: now
          };

          logger.info(`更新账号成功: ${updatedAccount.name}`);
          resolve(updatedAccount);
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  // 删除账号
  async deleteAccount(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM accounts WHERE id = ?';
      
      database.run(sql, [id], function(this: any, err: any) {
        if (err) {
          logger.error('删除账号失败:', err);
          reject(err);
          return;
        }

        if (this.changes === 0) {
          resolve(false);
          return;
        }

        logger.info(`删除账号成功: ID ${id}`);
        resolve(true);
      });
    });
  },

  // 启用/禁用账号
  async toggleAccount(id: number, enabled: boolean): Promise<Account | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const account = await this.getAccountById(id);
        if (!account) {
          resolve(null);
          return;
        }

        const now = new Date().toISOString();
        const sql = 'UPDATE accounts SET enabled = ?, updated_at = ? WHERE id = ?';
        
        database.run(sql, [enabled ? 1 : 0, now, id], function(this: any, err: any) {
          if (err) {
            logger.error('切换账号状态失败:', err);
            reject(err);
            return;
          }

          const updatedAccount: Account = {
            ...account,
            enabled,
            updatedAt: now
          };

          logger.info(`${enabled ? '启用' : '禁用'}账号: ${account.name}`);
          resolve(updatedAccount);
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  // 更新账号的最后签到信息
  async updateLastSignin(id: number, success: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = 'UPDATE accounts SET last_signin_at = ?, last_signin_status = ? WHERE id = ?';
      
      database.run(sql, [now, success ? 1 : 0, id], (err: any) => {
        if (err) {
          logger.error('更新账号签到信息失败:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  // 获取启用的账号
  async getEnabledAccounts(): Promise<Account[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, description, signin_url, method, cookies, headers,
               request_body, success_keyword, enabled, created_at, updated_at,
               last_signin_at, last_signin_status
        FROM accounts 
        WHERE enabled = 1
        ORDER BY created_at DESC
      `;
      
      database.all(sql, [], (err: any, rows: any[]) => {
        if (err) {
          logger.error('获取启用的账号失败:', err);
          reject(err);
          return;
        }

        const accounts = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          signinUrl: row.signin_url,
          method: row.method as 'GET' | 'POST',
          cookies: row.cookies,
          headers: row.headers,
          requestBody: row.request_body,
          successKeyword: row.success_keyword,
          enabled: Boolean(row.enabled),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastSigninAt: row.last_signin_at,
          lastSigninStatus: row.last_signin_status ? Boolean(row.last_signin_status) : undefined
        }));

        resolve(accounts);
      });
    });
  },

  // 批量导入账号
  async batchImportAccounts(accounts: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Account[]> {
    const results: Account[] = [];
    
    for (const accountData of accounts) {
      try {
        const account = await this.createAccount(accountData);
        results.push(account);
      } catch (error) {
        logger.error(`批量导入账号失败: ${accountData.name}`, error);
        // 继续处理其他账号
      }
    }

    logger.info(`批量导入完成，成功: ${results.length}，总数: ${accounts.length}`);
    return results;
  }
};