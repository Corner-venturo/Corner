'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileNav } from './MobileNav'
import { useAuthStore } from '@/stores/auth-store'

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()

  // 檢查登入狀態
  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push('/login')
    }
  }, [_hasHydrated, user, router])

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 主要內容區域 - 需要為底部導航留空間 */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* 底部導航 */}
      <MobileNav />
    </div>
  )
}
