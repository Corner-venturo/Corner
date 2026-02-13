'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Trash2, Info, User } from 'lucide-react'
import { FitnessLayout } from '../components/FitnessLayout'
import { useAuthStore } from '@/stores/auth-store'
import { localDB } from '@/lib/db'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { FITNESS_SETTINGS_LABELS } from './constants/labels'

export default function FitnessSettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    const confirmed = await confirm(FITNESS_SETTINGS_LABELS.LOGOUT_CONFIRM_MESSAGE, {
      title: FITNESS_SETTINGS_LABELS.LOGOUT_CONFIRM_TITLE,
      type: 'warning',
    })
    if (confirmed) {
      await logout()
      router.push('/login')
    }
  }

  const handleClearData = async () => {
    const confirmed = await confirm(
      FITNESS_SETTINGS_LABELS.CLEAR_DATA_CONFIRM_MESSAGE,
      {
        title: FITNESS_SETTINGS_LABELS.CLEAR_DATA_CONFIRM_TITLE,
        type: 'warning',
      }
    )
    if (confirmed) {
      try {
        // 清除健身相關的 localStorage 資料
        // 健身模組目前使用 localStorage 儲存資料，未來可能會改用 IndexedDB
        const fitnessKeys = Object.keys(localStorage).filter(key =>
          key.startsWith('fitness_') || key.startsWith('workout_')
        )

        fitnessKeys.forEach(key => {
          localStorage.removeItem(key)
        })

        await alert(FITNESS_SETTINGS_LABELS.CLEAR_DATA_SUCCESS, 'success')
        router.push('/fitness')
      } catch (error) {
        logger.error('清除資料失敗:', error)
        await alert(FITNESS_SETTINGS_LABELS.CLEAR_DATA_ERROR, 'error')
      }
    }
  }

  return (
    <FitnessLayout activeTab="settings">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">{FITNESS_SETTINGS_LABELS.PAGE_TITLE}</h1>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* 使用者資訊 */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-morandi-gold rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-foreground">
                {user?.display_name || user?.chinese_name || FITNESS_SETTINGS_LABELS.DEFAULT_USER_NAME}
              </div>
              <div className="text-sm text-muted-foreground">{user?.personal_info?.email}</div>
            </div>
          </div>
        </div>

        {/* 設定選項 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* 清除本地資料 */}
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-morandi-gold" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-foreground">{FITNESS_SETTINGS_LABELS.CLEAR_DATA_TITLE}</div>
              <div className="text-xs text-muted-foreground">
                {FITNESS_SETTINGS_LABELS.CLEAR_DATA_DESC}
              </div>
            </div>
          </button>

          {/* 登出 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <LogOut className="w-5 h-5 text-morandi-red" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-foreground">{FITNESS_SETTINGS_LABELS.LOGOUT_TITLE}</div>
              <div className="text-xs text-muted-foreground">
                {FITNESS_SETTINGS_LABELS.LOGOUT_DESC}
              </div>
            </div>
          </button>
        </div>

        {/* 關於 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground mb-2">
                {FITNESS_SETTINGS_LABELS.ABOUT_TITLE}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{FITNESS_SETTINGS_LABELS.ABOUT_VERSION}</p>
                <p>
                  {FITNESS_SETTINGS_LABELS.ABOUT_DESC}
                </p>
                <p className="mt-3 pt-3 border-t border-border space-y-1">
                  <span className="block">{FITNESS_SETTINGS_LABELS.ABOUT_FEATURE_1}</span>
                  <span className="block">{FITNESS_SETTINGS_LABELS.ABOUT_FEATURE_2}</span>
                  <span className="block">{FITNESS_SETTINGS_LABELS.ABOUT_FEATURE_3}</span>
                  <span className="block">{FITNESS_SETTINGS_LABELS.ABOUT_FEATURE_4}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 返回主系統 */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 text-sm text-muted-foreground border border-border rounded-xl hover:bg-muted/50 transition-colors"
        >
          {FITNESS_SETTINGS_LABELS.BACK_TO_MAIN}
        </button>
      </div>
    </FitnessLayout>
  )
}
