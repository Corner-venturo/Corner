import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, EyeOff, Eye } from 'lucide-react'
import { alert, alertSuccess, alertError, alertWarning } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { PasswordData } from '../types'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'
import type { Employee } from '@/types/models'

interface AccountSettingsProps {
  user: {
    id: string
    employee_number: string
    display_name?: string
    chinese_name?: string
    english_name?: string
    name?: string
    email?: string
  } | null
  showPasswordSection: boolean
  setShowPasswordSection: (show: boolean) => void
  passwordData: PasswordData
  setPasswordData: (data: PasswordData) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  passwordUpdateLoading: boolean
  setPasswordUpdateLoading: (loading: boolean) => void
}

export function AccountSettings({
  user,
  showPasswordSection,
  setShowPasswordSection,
  passwordData,
  setPasswordData,
  showPassword,
  setShowPassword,
  passwordUpdateLoading,
  setPasswordUpdateLoading,
}: AccountSettingsProps) {
  const handlePasswordUpdate = async () => {
    const auth = useRequireAuthSync()

    if (!auth.isAuthenticated) {
      auth.showLoginRequired()
      return
    }

    if (!user) {
      await alertWarning('請先登入')
      return
    }

    if (!passwordData.currentPassword) {
      await alertWarning('請輸入目前密碼！')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      await alertWarning('新密碼與確認密碼不符！')
      return
    }

    if (passwordData.newPassword.length < 8) {
      await alertWarning('密碼長度至少需要8個字元！')
      return
    }

    // 檢查網路狀態
    if (!navigator.onLine) {
      await alertWarning('目前離線，無法修改密碼。請連接網路後再試。', '網路未連接')
      return
    }

    setPasswordUpdateLoading(true)

    try {
      // 動態導入（只在需要時載入）
      const [authModule, supabaseModule] = await Promise.all([
        import('@/lib/auth'),
        import('@/lib/supabase/client'),
      ])

      const { hashPassword, verifyPassword } = authModule
      const { supabase } = supabaseModule

      // 1. 驗證目前密碼
      const { data: userData, error: fetchError } = await supabase
        .from('employees')
        .select('password_hash')
        .eq('employee_number', user.employee_number)
        .single()

      if (fetchError || !userData) {
        await alertError('驗證失敗，請稍後再試')
        setPasswordUpdateLoading(false)
        return
      }

      const isPasswordValid = await verifyPassword(
        passwordData.currentPassword,
        userData.password_hash || ''
      )
      if (!isPasswordValid) {
        await alertError('目前密碼錯誤！')
        setPasswordUpdateLoading(false)
        return
      }

      // 2. 更新新密碼
      const hashedPassword = await hashPassword(passwordData.newPassword)

      const { error } = await supabase
        .from('employees')
        .update({ password_hash: hashedPassword })
        .eq('employee_number', user.employee_number)

      if (error) {
        logger.error('密碼更新失敗:', error)
        await alertError('密碼更新失敗：' + error.message)
        setPasswordUpdateLoading(false)
        return
      }

      // 3. 清除角色卡（重要！否則舊密碼還能登入）
      try {
        const { useLocalAuthStore } = await import('@/lib/auth/local-auth-manager')
        const localAuthStore = useLocalAuthStore.getState()

        // 刪除當前用戶的角色卡
        localAuthStore.removeProfile(user.id)
        logger.log('🗑️ 已刪除角色卡，下次登入需從網路驗證')
      } catch (profileError) {
        logger.warn('⚠️ 清除角色卡失敗（不影響密碼更新）:', profileError)
      }

      // 4. 同步更新 IndexedDB 的密碼
      try {
        const { localDB } = await import('@/lib/db')
        const { TABLES } = await import('@/lib/db/schemas')

        const employee = await localDB.read<Employee>(TABLES.EMPLOYEES, user.id)
        if (employee) {
          await localDB.put(TABLES.EMPLOYEES, {
            ...employee,
            password_hash: hashedPassword,
            last_password_change: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          logger.log('✅ IndexedDB 密碼已更新')
        }
      } catch (dbError) {
        logger.warn('⚠️ IndexedDB 更新失敗（不影響主要功能）:', dbError)
      }

      await alertSuccess('密碼更新成功！下次登入需重新驗證。', '更新成功')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (error) {
      logger.error('密碼更新過程中發生錯誤:', error)
      await alertError('密碼更新失敗，請稍後再試')
    } finally {
      setPasswordUpdateLoading(false)
    }
  }

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">帳號安全</h2>
      </div>

      <div className="space-y-6">
        {/* 修改密碼區塊 */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium mb-1">修改密碼</h3>
              <p className="text-sm text-morandi-secondary">定期更換密碼以保護您的帳號安全</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordSection(!showPasswordSection)}>
              {showPasswordSection ? '取消' : '修改密碼'}
            </Button>
          </div>

          {showPasswordSection && (
            <div className="mt-4 space-y-4 pt-4 border-t border-border">
              {/* 目前密碼 */}
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  目前密碼
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={e =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="請輸入目前密碼"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 新密碼 */}
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  新密碼
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="至少8個字元"
                />
              </div>

              {/* 確認新密碼 */}
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  確認新密碼
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="再次輸入新密碼"
                />
              </div>

              {/* 密碼確認提示 */}
              {passwordData.newPassword && passwordData.confirmPassword && (
                <div className="text-sm">
                  {passwordData.newPassword === passwordData.confirmPassword ? (
                    <span className="text-green-600">✓ 密碼確認一致</span>
                  ) : (
                    <span className="text-red-600">✗ 密碼確認不一致</span>
                  )}
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={
                    passwordUpdateLoading ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    passwordData.newPassword.length < 8
                  }
                  className="bg-morandi-gold hover:bg-morandi-gold-hover"
                >
                  {passwordUpdateLoading ? '更新中...' : '更新密碼'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordSection(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }}
                >
                  取消
                </Button>
              </div>

              {/* 密碼要求提示 */}
              <div className="text-xs text-morandi-muted bg-morandi-container/30 p-3 rounded">
                <p className="font-medium mb-1">📝 密碼要求：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>至少8個字元</li>
                  <li>建議包含數字和字母</li>
                  <li>需要先輸入目前密碼進行驗證</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
