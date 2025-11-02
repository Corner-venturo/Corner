'use client'

import { useThemeStore } from '@/stores/theme-store'
import { useAuthStore } from '@/stores/auth-store'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import { useSettingsState } from './hooks/useSettingsState'
import {
  AppearanceSettings,
  AccountSettings,
  SystemSettings,
  OtherSettings,
} from './components'

// 強制客戶端渲染，不預取伺服器資料
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function SettingsPage() {
  const { currentTheme, setTheme } = useThemeStore()
  const { user, logout } = useAuthStore()

  const {
    showPasswordSection,
    setShowPasswordSection,
    passwordData,
    setPasswordData,
    showPassword,
    setShowPassword,
    passwordUpdateLoading,
    setPasswordUpdateLoading,
    cacheInfo,
    clearingCache,
    setClearingCache,
  } = useSettingsState()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="系統設定"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '設定', href: '/settings' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* 用戶資訊 */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-morandi-container rounded-lg">
                <User className="h-4 w-4 text-morandi-secondary" />
                <span className="text-sm font-medium text-morandi-primary">
                  {user.display_name ||
                    user.chinese_name ||
                    user.english_name ||
                    user.name ||
                    user.email ||
                    '使用者'}
                </span>
              </div>
            )}

            {/* 登出按鈕 */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8 p-6">
          {/* 主題設定 */}
          <AppearanceSettings currentTheme={currentTheme} onThemeChange={setTheme} />

          {/* 帳號安全設定 */}
          <AccountSettings
            user={user}
            showPasswordSection={showPasswordSection}
            setShowPasswordSection={setShowPasswordSection}
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordUpdateLoading={passwordUpdateLoading}
            setPasswordUpdateLoading={setPasswordUpdateLoading}
          />

          {/* 系統維護 */}
          <SystemSettings
            cacheInfo={cacheInfo}
            clearingCache={clearingCache}
            setClearingCache={setClearingCache}
          />

          {/* 其他設定 */}
          <OtherSettings />
        </div>
      </div>
    </div>
  )
}
