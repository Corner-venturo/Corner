'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useEmailStore } from '@/stores/email-store'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { MailSidebar } from '@/features/mail/components/MailSidebar'
import { MailList } from '@/features/mail/components/MailList'
import { MailDetail } from '@/features/mail/components/MailDetail'
import { ComposeDialog } from '@/features/mail/components/ComposeDialog'
import { logger } from '@/lib/utils/logger'

export default function MailPage() {
  const { sidebarCollapsed } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showDetail, setShowDetail] = useState(false) // 手機版控制

  const {
    fetchEmails,
    fetchAccounts,
    fetchStats,
    selectedEmailId,
    composeOpen,
    closeCompose,
  } = useEmailStore()

  // 初始化
  useEffect(() => {
    logger.log('[MailPage] 初始化郵件系統')
    fetchAccounts()
    fetchEmails()
    fetchStats()
  }, [])

  // 手機版：選中郵件時顯示詳情
  useEffect(() => {
    if (selectedEmailId) {
      setShowDetail(true)
    }
  }, [selectedEmailId])

  return (
    <>
      {/* 手機版頂部標題列 */}
      <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* 主內容區域 */}
      <main
        className={cn(
          'fixed right-0 bottom-0 overflow-hidden',
          'top-14 left-0 p-2',
          'lg:top-0 lg:p-4',
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-[190px]'
        )}
      >
        <div className="h-full rounded-lg border border-border bg-card shadow-sm overflow-hidden flex">
          {/* 左側：資料夾導航（桌面版） */}
          <div className="hidden lg:block w-56 border-r border-border shrink-0">
            <MailSidebar />
          </div>

          {/* 中間：郵件列表 */}
          <div
            className={cn(
              'flex-1 min-w-0 border-r border-border',
              // 手機版：顯示詳情時隱藏列表
              showDetail && 'hidden lg:block'
            )}
          >
            <MailList />
          </div>

          {/* 右側：郵件詳情預覽（桌面版固定顯示） */}
          <div
            className={cn(
              'lg:w-[45%] min-w-0',
              // 手機版：根據狀態顯示/隱藏
              !showDetail && 'hidden lg:block'
            )}
          >
            <MailDetail onBack={() => setShowDetail(false)} />
          </div>
        </div>
      </main>

      {/* 撰寫郵件對話框 */}
      <ComposeDialog open={composeOpen} onClose={closeCompose} />
    </>
  )
}
