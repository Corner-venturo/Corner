/**
 * 純本地認證服務
 * 完全不依賴 Supabase，使用 IndexedDB 儲存所有資料
 */

import bcrypt from 'bcryptjs'
import { localDB } from '@/lib/db'
import type { User, Employee } from '@/stores/types'

export interface LocalLoginResult {
  success: boolean
  message?: string
  user?: User
}

export class LocalAuthService {
  /**
   * 本地登入驗證
   */
  static async login(username: string, password: string): Promise<LocalLoginResult> {
    try {
      // 1. 從 IndexedDB 查詢員工
      const employees = await localDB.filter('employees', [
        { field: 'employee_number', operator: 'eq', value: username },
      ])

      if (employees.length === 0) {
        return {
          success: false,
          message: '帳號或密碼錯誤',
        }
      }

      const employee = employees[0] as Employee & {
        is_active?: boolean
        lockedUntil?: string
        loginAttempts?: number
        password_hash?: string
        lastLoginAt?: string
      }

      // 2. 檢查帳號是否啟用
      if (employee.status === 'terminated') {
        return {
          success: false,
          message: '帳號已停用，請聯繫管理員',
        }
      }

      // 3. 檢查帳號鎖定
      if (employee.lockedUntil) {
        const lockedTime = new Date(employee.lockedUntil)
        if (lockedTime > new Date()) {
          const remainingMinutes = Math.ceil((lockedTime.getTime() - Date.now()) / (60 * 1000))
          return {
            success: false,
            message: `帳號已鎖定，請 ${remainingMinutes} 分鐘後再試`,
          }
        }
      }

      // 4. 驗證密碼
      let isValidPassword = false

      if (employee.password_hash) {
        try {
          isValidPassword = await bcrypt.compare(password, employee.password_hash)
        } catch (error) {
          // 開發環境 fallback
          if (password === 'Venturo2025!' && username === 'william01') {
            isValidPassword = true
          }
        }
      } else {
        // 沒有密碼雜湊，檢查是否為預設帳號
        if (password === 'Venturo2025!' && username === 'william01') {
          // 自動設定密碼
          const hashedPassword = await bcrypt.hash(password, 10)
          await localDB.update('employees', employee.id, {
            password_hash: hashedPassword,
          } as Partial<Employee>)
          isValidPassword = true
        }
      }

      if (!isValidPassword) {
        // 記錄失敗次數
        const attempts = (employee.loginAttempts || 0) + 1
        const updates: Record<string, unknown> = { loginAttempts: attempts }

        // 超過 5 次鎖定 30 分鐘
        if (attempts >= 5) {
          updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }

        await localDB.update('employees', employee.id, updates as Partial<Employee>)

        return {
          success: false,
          message: '帳號或密碼錯誤',
        }
      }

      // 5. 登入成功，重設失敗次數
      await localDB.update('employees', employee.id, {
        lastLoginAt: new Date().toISOString(),
        loginAttempts: 0,
        lockedUntil: null,
      } as Partial<Employee>)

      // 6. 建立使用者物件（使用 employee 資料）
      const user = employee as User

      return {
        success: true,
        user,
      }
    } catch (error) {
      return {
        success: false,
        message: '系統錯誤，請稍後再試',
      }
    }
  }

  /**
   * 變更密碼
   */
  static async changePassword(
    user_id: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. 取得使用者資料
      const employee = await localDB.read('employees', user_id) as (Employee & { password_hash?: string }) | null

      if (!employee) {
        return {
          success: false,
          message: '使用者不存在',
        }
      }

      // 2. 驗證舊密碼
      if (employee.password_hash) {
        const isValid = await bcrypt.compare(oldPassword, employee.password_hash)
        if (!isValid) {
          return {
            success: false,
            message: '舊密碼錯誤',
          }
        }
      }

      // 3. 加密新密碼
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      // 4. 更新密碼
      await localDB.update('employees', user_id, {
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      } as Partial<Employee>)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: '變更密碼失敗',
      }
    }
  }

  /**
   * 重設密碼（管理員功能）
   */
  static async resetPassword(
    user_id: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 加密新密碼
      const password_hash = await bcrypt.hash(newPassword, 10)

      // 更新密碼並清除鎖定
      await localDB.update('employees', user_id, {
        password_hash,
        loginAttempts: 0,
        lockedUntil: null,
        updated_at: new Date().toISOString(),
      } as Partial<Employee>)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: '重設密碼失敗',
      }
    }
  }

  /**
   * 建立新使用者
   */
  static async createUser(userData: {
    employee_number: string
    name: string
    email: string
    password: string
    department?: string
    position?: string
    permissions?: string[]
  }): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      // 檢查員工編號是否已存在
      const existing = await localDB.filter('employees', [
        { field: 'employee_number', operator: 'eq', value: userData.employee_number },
      ])

      if (existing.length > 0) {
        return {
          success: false,
          message: '員工編號已存在',
        }
      }

      // 加密密碼
      const password_hash = await bcrypt.hash(userData.password, 10)

      // 建立員工資料
      const newEmployee = {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_number: userData.employee_number,
        name: userData.name,
        email: userData.email,
        password_hash,
        permissions: userData.permissions || [],
        department: userData.department || '',
        position: userData.position || '',
        salary: 0,
        is_active: true,
        loginAttempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 儲存到 IndexedDB
      const created = await localDB.create('employees', newEmployee as Employee)

      // 建立使用者物件
      const user = created as unknown as User

      return {
        success: true,
        user,
      }
    } catch (error) {
      return {
        success: false,
        message: '建立使用者失敗',
      }
    }
  }

  /**
   * 檢查權限
   */
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false

    const permissions = user.permissions || []
    return permissions.includes(permission) || permissions.includes('admin')
  }

  /**
   * 檢查多個權限（任一符合）
   */
  static hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false

    return permissions.some(permission => this.hasPermission(user, permission))
  }

  /**
   * 檢查多個權限（全部符合）
   */
  static hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user) return false

    return permissions.every(permission => this.hasPermission(user, permission))
  }
}
