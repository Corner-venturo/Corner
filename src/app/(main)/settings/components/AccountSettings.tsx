import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, EyeOff, Eye, Camera, User, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { alertSuccess, alertError, alertWarning } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { PasswordData } from '../types'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'
import { supabase } from '@/lib/supabase/client'
import { compressAvatarImage } from '@/lib/image-utils'
import { LABELS } from '../constants/labels'

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
    workspace_code?: string
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
      await alertWarning(LABELS.UNSUPPORTED_IMAGE_FORMAT)
      return
    }

    // 放寬原始檔案大小限制（因為會自動壓縮）
    if (file.size > 10 * 1024 * 1024) {
      await alertWarning(LABELS.FILE_SIZE_TOO_LARGE)
      return
    }

    setAvatarUploading(true)
    try {
      // 自動壓縮圖片（最大 400px，目標 200KB）
      const compressedFile = await compressAvatarImage(file)
      logger.log(`圖片壓縮完成: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`)

      const fileName = `${user.employee_number}_${Date.now()}.jpg`
      const filePath = `avatars/${fileName}`

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('bucket', 'user-avatars')
      formData.append('path', filePath)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || LABELS.UPLOAD_FAILED)
      }

      const { publicUrl } = await response.json()

      const { error: updateError } = await supabase
        .from('employees')
        .update({ avatar_url: publicUrl })
        .eq('employee_number', user.employee_number)

      if (updateError) throw updateError

      setCurrentAvatarUrl(publicUrl)
      await alertSuccess(LABELS.AVATAR_UPLOAD_SUCCESS)
    } catch (error) {
      logger.error('頭像上傳失敗:', error)
      await alertError(LABELS.AVATAR_UPLOAD_FAILED + (error instanceof Error ? error.message : '未知錯誤'))
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
      await alertWarning(LABELS.PLEASE_LOGIN_FIRST)
      return
    }

    if (!passwordData.currentPassword) {
      await alertWarning(LABELS.CURRENT_PASSWORD_REQUIRED)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      await alertWarning(LABELS.PASSWORDS_NOT_MATCH)
      return
    }

    if (passwordData.newPassword.length < 8) {
      await alertWarning(LABELS.PASSWORD_TOO_SHORT)
      return
    }

    // 檢查網路狀態
    if (!navigator.onLine) {
      await alertWarning(LABELS.OFFLINE_PASSWORD_CHANGE, LABELS.NETWORK_DISCONNECTED)
      return
    }

    setPasswordUpdateLoading(true)

    try {
      // 使用新的 API 來更換密碼（同時更新 employees 和 Supabase Auth）
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_number: user.employee_number,
          workspace_code: user.workspace_code,
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        await alertError(result.error || LABELS.PASSWORD_UPDATE_FAILED)
        setPasswordUpdateLoading(false)
        return
      }

      await alertSuccess(LABELS.PASSWORD_UPDATE_SUCCESS, LABELS.UPDATE_SUCCESS)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (error) {
      logger.error('密碼更新過程中發生錯誤:', error)
      await alertError(LABELS.PASSWORD_UPDATE_ERROR)
    } finally {
      setPasswordUpdateLoading(false)
    }
  }

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">{LABELS.ACCOUNT_SECURITY}</h2>
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
                      alt={LABELS.AVATAR}
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
                <h3 className="font-medium mb-1">{LABELS.PERSONAL_AVATAR}</h3>
                <p className="text-sm text-morandi-secondary">{LABELS.CLICK_CAMERA_TO_CHANGE}</p>
                <p className="text-xs text-morandi-muted mt-1">{LABELS.SUPPORTED_IMAGE_FORMATS}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 修改密碼區塊 */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium mb-1">{LABELS.CHANGE_PASSWORD}</h3>
              <p className="text-sm text-morandi-secondary">{LABELS.PASSWORD_SECURITY_TIP}</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordSection(!showPasswordSection)} className="gap-2">
              {showPasswordSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showPasswordSection ? LABELS.COLLAPSE : LABELS.CHANGE_PASSWORD}
            </Button>
          </div>

          {showPasswordSection && (
            <div className="mt-4 space-y-4 pt-4 border-t border-border">
              {/* 目前密碼 */}
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  {LABELS.CURRENT_PASSWORD}
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
                    placeholder={LABELS.CURRENT_PASSWORD_PLACEHOLDER}
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
                  {LABELS.NEW_PASSWORD}
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
                  placeholder={LABELS.NEW_PASSWORD_PLACEHOLDER}
                />
              </div>

              {/* 確認新密碼 */}
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  {LABELS.CONFIRM_NEW_PASSWORD}
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
                  placeholder={LABELS.CONFIRM_PASSWORD_PLACEHOLDER}
                />
              </div>

              {/* 密碼確認提示 */}
              {passwordData.newPassword && passwordData.confirmPassword && (
                <div className="text-sm">
                  {passwordData.newPassword === passwordData.confirmPassword ? (
                    <span className="text-status-success">{LABELS.PASSWORD_MATCH}</span>
                  ) : (
                    <span className="text-status-danger">{LABELS.PASSWORD_MISMATCH}</span>
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
                  {passwordUpdateLoading ? LABELS.UPDATING : LABELS.UPDATE_PASSWORD}
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
                  {LABELS.CANCEL}
                </Button>
              </div>

              {/* 密碼要求提示 */}
              <div className="text-xs text-morandi-muted bg-morandi-container/30 p-3 rounded">
                <p className="font-medium mb-1">{LABELS.PASSWORD_REQUIREMENTS_TITLE}</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{LABELS.PASSWORD_REQ_LENGTH}</li>
                  <li>{LABELS.PASSWORD_REQ_FORMAT}</li>
                  <li>{LABELS.PASSWORD_REQ_CURRENT}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
