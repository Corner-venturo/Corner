'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, History, BarChart3, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface FitnessLayoutProps {
  children: React.ReactNode
  activeTab?: 'workout' | 'history' | 'stats' | 'settings'
}

export function FitnessLayout({ children, activeTab = 'workout' }: FitnessLayoutProps) {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 登入檢查
  useEffect(() => {
    if (_hasHydrated && !user && isClient) {
      // 未登入 → 跳轉到主系統登入頁面
      router.push('/login?redirect=/fitness')
    }
  }, [user, _hasHydrated, router, isClient])

  // 載入中或未登入 → 顯示載入畫面
  if (!_hasHydrated || !user || !isClient) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏋️</div>
          <div className="text-[#8C8C8C]">載入中...</div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'workout', name: '訓練', icon: Dumbbell, path: '/fitness' },
    { id: 'history', name: '歷史', icon: History, path: '/fitness/history' },
    { id: 'stats', name: '統計', icon: BarChart3, path: '/fitness/stats' },
    { id: 'settings', name: '設定', icon: Settings, path: '/fitness/settings' },
  ]

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-20">
      {/* 內容區域 */}
      <div className="pb-16">{children}</div>

      {/* 底部 Tab 導航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#E8E4E0] safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-[#B8A99A]'
                    : 'text-[#8C8C8C] hover:text-[#8C8C8C]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
