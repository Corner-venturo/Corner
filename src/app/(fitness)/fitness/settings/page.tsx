'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Trash2, Info, User } from 'lucide-react'
import { FitnessLayout } from '../components/FitnessLayout'
import { useAuthStore } from '@/stores/auth-store'
import { localDB } from '@/lib/db'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

export default function FitnessSettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    const confirmed = await confirm('確定要登出嗎？', {
      title: '登出',
      type: 'warning',
    })
    if (confirmed) {
      await logout()
      router.push('/login')
    }
  }

  const handleClearData = async () => {
    const confirmed = await confirm(
      '⚠️ 警告：這將清除所有本地健身資料（訓練記錄、身體數據、目標等）。\n\n此操作無法復原，確定要繼續嗎？',
      {
        title: '清除本地資料',
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

        await alert('本地資料已清除', 'success')
        router.push('/fitness')
      } catch (error) {
        logger.error('清除資料失敗:', error)
        await alert('清除資料失敗，請稍後再試', 'error')
      }
    }
  }

  return (
    <FitnessLayout activeTab="settings">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">設定</h1>
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
                {user?.display_name || user?.chinese_name || '使用者'}
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
              <div className="font-medium text-foreground">清除本地資料</div>
              <div className="text-xs text-muted-foreground">
                清除所有健身記錄和設定
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
              <div className="font-medium text-foreground">登出</div>
              <div className="text-xs text-muted-foreground">
                登出 Corner Fitness
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
                關於 Corner Fitness
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>版本：1.0.0</p>
                <p>
                  簡潔優雅的健身記錄工具，專為 Corner
                  團隊設計。
                </p>
                <p className="mt-3 pt-3 border-t border-border space-y-1">
                  <span className="block">• 支援 134+ 訓練動作</span>
                  <span className="block">• 訓練容量自動計算</span>
                  <span className="block">• PWA 離線使用</span>
                  <span className="block">• 多裝置同步（開發中）</span>
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
          ← 返回 Corner 主系統
        </button>
      </div>
    </FitnessLayout>
  )
}
