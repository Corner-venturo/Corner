'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Trash2, Info, User } from 'lucide-react'
import { FitnessLayout } from '../components/FitnessLayout'
import { useAuthStore } from '@/stores/auth-store'
import { localDB } from '@/lib/db'

export default function FitnessSettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    if (confirm('確定要登出嗎？')) {
      await logout()
      router.push('/login')
    }
  }

  const handleClearData = async () => {
    if (
      confirm(
        '⚠️ 警告：這將清除所有本地健身資料（訓練記錄、身體數據、目標等）。\n\n此操作無法復原，確定要繼續嗎？'
      )
    ) {
      try {
        // 清除健身相關的 IndexedDB 資料表
        // 根據健身模組可能使用的表格，這裡列出常見的健身資料表
        // 如果有其他健身相關表格，可在此添加
        const fitnessTable = 'fitness_records' as const

        // 使用 try-catch 避免表格不存在時報錯
        try {
          await localDB.clear(fitnessTable)
        } catch (error) {
          // 表格不存在或其他錯誤，忽略
          console.warn('清除健身資料時發生錯誤:', error)
        }

        alert('本地資料已清除')
        router.push('/fitness')
      } catch (error) {
        console.error('清除資料失敗:', error)
        alert('清除資料失敗，請稍後再試')
      }
    }
  }

  return (
    <FitnessLayout activeTab="settings">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FEFEFE] border-b border-[#EDE8E0] px-4 py-4">
        <h1 className="text-xl font-bold text-[#3D2914]">設定</h1>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* 使用者資訊 */}
        <div className="bg-[#FEFEFE] border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_8px_rgba(61,41,20,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C9A961] rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-[#3D2914]">
                {user?.display_name || user?.chinese_name || '使用者'}
              </div>
              <div className="text-sm text-[#9E8F81]">{user?.personal_info?.email}</div>
            </div>
          </div>
        </div>

        {/* 設定選項 */}
        <div className="bg-[#FEFEFE] border border-[#EDE8E0] rounded-2xl overflow-hidden">
          {/* 清除本地資料 */}
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#FAF8F5] transition-colors border-b border-[#EDE8E0]"
          >
            <div className="w-10 h-10 bg-[#FFF3E0] rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-[#C9A961]" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-[#3D2914]">清除本地資料</div>
              <div className="text-xs text-[#9E8F81]">
                清除所有健身記錄和設定
              </div>
            </div>
          </button>

          {/* 登出 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#FAF8F5] transition-colors"
          >
            <div className="w-10 h-10 bg-[#FFE5E5] rounded-full flex items-center justify-center">
              <LogOut className="w-5 h-5 text-[#C94961]" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-[#3D2914]">登出</div>
              <div className="text-xs text-[#9E8F81]">
                登出 Corner Fitness
              </div>
            </div>
          </button>
        </div>

        {/* 關於 */}
        <div className="bg-[#FEFEFE] border border-[#EDE8E0] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#E8F4F8] rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-[#61A9C9]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-[#3D2914] mb-2">
                關於 Corner Fitness
              </div>
              <div className="text-sm text-[#9E8F81] space-y-1">
                <p>版本：1.0.0</p>
                <p>
                  簡潔優雅的健身記錄工具，專為 Corner
                  團隊設計。
                </p>
                <p className="mt-3 pt-3 border-t border-[#EDE8E0] space-y-1">
                  <div>• 支援 134+ 訓練動作</div>
                  <div>• 訓練容量自動計算</div>
                  <div>• PWA 離線使用</div>
                  <div>• 多裝置同步（開發中）</div>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 返回主系統 */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 text-sm text-[#6B5D52] border border-[#E0D8CC] rounded-xl hover:bg-[#FAF8F5] transition-colors"
        >
          ← 返回 Corner 主系統
        </button>
      </div>
    </FitnessLayout>
  )
}
