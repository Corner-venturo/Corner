/**
 * 認證服務 v5 - Supabase 整合版本
 */

import { supabase } from '@/lib/supabase/client';
import type { User } from '@/stores/types';

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;
  usedFallback?: boolean;
}

export class AuthServiceV5 {
  /**
   * 登入驗證（Supabase）
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    try {

      // 固定預設密碼
      const DEFAULT_PASSWORD = 'Venturo2025!';

      if (password !== DEFAULT_PASSWORD) {
        return {
          success: false,
          message: '密碼錯誤'
        };
      }

      // 從 API 查詢使用者（會自動路由到 SQLite）
      const { data: users, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_number', username);

      if (error) {
                return {
          success: false,
          message: '系統錯誤，請稍後再試'
        };
      }

      const user = users?.[0] as User | undefined;

      if (!user) {
        return {
          success: false,
          message: '帳號不存在'
        };
      }

      // 檢查狀態
      if (!(user as unknown).is_active || user.status === 'terminated') {
        return {
          success: false,
          message: '帳號已停用'
        };
      }


      return {
        success: true,
        user,
        usedFallback: false
      };

    } catch (error) {
            return {
        success: false,
        message: '系統錯誤，請稍後再試'
      };
    }
  }

  /**
   * 更新最後登入時間
   */
  static async updateLastLogin(user_id: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await (supabase as unknown)
        .from('employees')
        .update({
          last_login: now,
          updated_at: now
        })
        .eq('id', user_id);

    } catch (error) {
            // 不拋出錯誤，允許登入繼續
    }
  }

  /**
   * 登出
   */
  static logout(): void {
    // 清除 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
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
