import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, EyeOff, Eye, Camera, User, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { alert, alertSuccess, alertError, alertWarning } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { PasswordData } from '../types'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'
import { supabase } from '@/lib/supabase/client'

interface AccountSettingsProps {
  user: {
    id: string
    employee_number: string
    display_name?: string
    chinese_name?: string
    english_name?: string
    name?: string
    email?: string
    avatar_url?: string | null
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
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(user?.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      await alertWarning('只支援 JPG、PNG、GIF、WebP 格式的圖片')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      await alertWarning('檔案大小不能超過 5MB')
      return
    }

    setAvatarUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.employee_number}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'user-avatars')
      formData.append('path', filePath)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '上傳失敗')
      }

      const { publicUrl } = await response.json()

      const { error: updateError } = await supabase
        .from('employees')
        .update({ avatar_url: publicUrl })
        .eq('employee_number', user.employee_number)

      if (updateError) throw updateError

      setCurrentAvatarUrl(publicUrl)
      await alertSuccess('頭像上傳成功')
    } catch (error) {
      logger.error('頭像上傳失敗:', error)
      await alertError('頭像上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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
        {/* 個人頭像區塊 */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-morandi-container flex items-center justify-center border-2 border-morandi-gold/20">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt="頭像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-morandi-secondary" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-morandi-gold hover:bg-morandi-gold-hover rounded-full flex items-center justify-center text-white shadow-md transition-colors disabled:opacity-50"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-medium mb-1">個人頭像</h3>
                <p className="text-sm text-morandi-secondary">點擊相機圖示更換頭像</p>
                <p className="text-xs text-morandi-muted mt-1">支援 JPG、PNG、GIF、WebP，最大 5MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* 修改密碼區塊 */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium mb-1">修改密碼</h3>
              <p className="text-sm text-morandi-secondary">定期更換密碼以保護您的帳號安全</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordSection(!showPasswordSection)} className="gap-2">
              {showPasswordSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showPasswordSection ? '收合' : '修改密碼'}
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
                    <span className="text-status-success">✓ 密碼確認一致</span>
                  ) : (
                    <span className="text-status-danger">✗ 密碼確認不一致</span>
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
                  className="gap-2"
                >
                  <X size={16} />
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
