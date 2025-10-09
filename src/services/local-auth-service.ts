/**
 * 純本地認證服務
 * 完全不依賴 Supabase，使用 IndexedDB 儲存所有資料
 */

import bcrypt from 'bcryptjs';
import { localDB } from '@/lib/db';
import type { User } from '@/stores/types';

export interface LocalLoginResult {
  success: boolean;
  message?: string;
  user?: User;
}

export class LocalAuthService {
  /**
   * 本地登入驗證
   */
  static async login(username: string, password: string): Promise<LocalLoginResult> {
    try {
      // 1. 從 IndexedDB 查詢員工
      const employees = await localDB.filter('employees', [
        { field: 'employeeNumber', operator: 'eq', value: username }
      ]);

      if (employees.length === 0) {
        return { 
          success: false, 
          message: '帳號或密碼錯誤' 
        };
      }

      const employee: any = employees[0];

      // 2. 檢查帳號是否啟用
      if (employee.is_active === false) {
        return { 
          success: false, 
          message: '帳號已停用，請聯繫管理員' 
        };
      }

      // 3. 檢查帳號鎖定
      if (employee.lockedUntil) {
        const lockedTime = new Date(employee.lockedUntil);
        if (lockedTime > new Date()) {
          const remainingMinutes = Math.ceil((lockedTime.getTime() - Date.now()) / (60 * 1000));
          return { 
            success: false, 
            message: `帳號已鎖定，請 ${remainingMinutes} 分鐘後再試` 
          };
        }
      }

      // 4. 驗證密碼
      let isValidPassword = false;
      
      if (employee.passwordHash) {
        try {
          isValidPassword = await bcrypt.compare(password, employee.passwordHash);
        } catch (error) {
          console.error('密碼驗證失敗:', error);
          // 開發環境 fallback
          if (password === 'Venturo2025!' && username === 'william01') {
            isValidPassword = true;
            console.warn('⚠️ 使用開發環境預設密碼');
          }
        }
      } else {
        // 沒有密碼雜湊，檢查是否為預設帳號
        if (password === 'Venturo2025!' && username === 'william01') {
          // 自動設定密碼
          const hashedPassword = await bcrypt.hash(password, 10);
          await localDB.update('employees', employee.id, {
            passwordHash: hashedPassword
          });
          isValidPassword = true;
          console.log('✅ 已為預設帳號設定密碼');
        }
      }

      if (!isValidPassword) {
        // 記錄失敗次數
        const attempts = (employee.loginAttempts || 0) + 1;
        const updates: any = { loginAttempts: attempts };

        // 超過 5 次鎖定 30 分鐘
        if (attempts >= 5) {
          updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }

        await localDB.update('employees', employee.id, updates);

        return { 
          success: false, 
          message: '帳號或密碼錯誤' 
        };
      }

      // 5. 登入成功，重設失敗次數
      await localDB.update('employees', employee.id, {
        lastLoginAt: new Date().toISOString(),
        loginAttempts: 0,
        lockedUntil: null
      });

      // 6. 建立使用者物件
      const user: User = {
        id: employee.id,
        employeeNumber: employee.employee_number,
        name: employee.name,
        email: employee.email,
        permissions: employee.permissions || [],
        department: employee.department,
        position: employee.position,
        avatar: employee.avatar,
        isActive: employee.is_active !== false,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at
      };

      return { 
        success: true, 
        user
      };

    } catch (error) {
      console.error('登入錯誤:', error);
      return { 
        success: false, 
        message: '系統錯誤，請稍後再試' 
      };
    }
  }

  /**
   * 變更密碼
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. 取得使用者資料
      const employee: any = await localDB.read('employees', userId);
      
      if (!employee) {
        return { 
          success: false, 
          message: '使用者不存在' 
        };
      }

      // 2. 驗證舊密碼
      if (employee.passwordHash) {
        const isValid = await bcrypt.compare(oldPassword, employee.passwordHash);
        if (!isValid) {
          return { 
            success: false, 
            message: '舊密碼錯誤' 
          };
        }
      }

      // 3. 加密新密碼
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 4. 更新密碼
      await localDB.update('employees', userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      });

      return { success: true };

    } catch (error) {
      console.error('變更密碼錯誤:', error);
      return { 
        success: false, 
        message: '變更密碼失敗' 
      };
    }
  }

  /**
   * 重設密碼（管理員功能）
   */
  static async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 加密新密碼
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // 更新密碼並清除鎖定
      await localDB.update('employees', userId, {
        passwordHash,
        loginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date().toISOString()
      });

      return { success: true };

    } catch (error) {
      console.error('重設密碼錯誤:', error);
      return { 
        success: false, 
        message: '重設密碼失敗' 
      };
    }
  }

  /**
   * 建立新使用者
   */
  static async createUser(userData: {
    employeeNumber: string;
    name: string;
    email: string;
    password: string;
    department?: string;
    position?: string;
    permissions?: string[];
  }): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      // 檢查員工編號是否已存在
      const existing = await localDB.filter('employees', [
        { field: 'employeeNumber', operator: 'eq', value: userData.employee_number }
      ]);

      if (existing.length > 0) {
        return { 
          success: false, 
          message: '員工編號已存在' 
        };
      }

      // 加密密碼
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // 建立員工資料
      const newEmployee = {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeNumber: userData.employee_number,
        name: userData.name,
        email: userData.email,
        passwordHash,
        permissions: userData.permissions || [],
        department: userData.department || '',
        position: userData.position || '',
        salary: 0,
        isActive: true,
        loginAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 儲存到 IndexedDB
      const created = await localDB.create('employees', newEmployee);

      // 建立使用者物件
      const user: User = {
        id: created.id,
        employeeNumber: created.employee_number,
        name: created.name,
        email: created.email,
        permissions: created.permissions,
        department: created.department,
        position: created.position,
        isActive: true,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      };

      return { 
        success: true, 
        user 
      };

    } catch (error) {
      console.error('建立使用者錯誤:', error);
      return { 
        success: false, 
        message: '建立使用者失敗' 
      };
    }
  }

  /**
   * 檢查權限
   */
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    
    const permissions = user.permissions || [];
    return permissions.includes(permission) ||
           permissions.includes('super_admin') ||
           permissions.includes('admin');
  }

  /**
   * 檢查多個權限（任一符合）
   */
  static hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    
    return permissions.some(permission => 
      this.hasPermission(user, permission)
    );
  }

  /**
   * 檢查多個權限（全部符合）
   */
  static hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    
    return permissions.every(permission => 
      this.hasPermission(user, permission)
    );
  }
}
