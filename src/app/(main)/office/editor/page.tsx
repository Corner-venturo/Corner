'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'

// 動態載入 Univer 編輯器（避免 SSR 問題）
const UniverSpreadsheet = dynamic(
  () => import('@/features/office/components/UniverSpreadsheet').then(m => ({ default: m.UniverSpreadsheet })),
  { ssr: false, loading: () => <EditorLoading /> }
)

const UniverDocument = dynamic(
  () => import('@/features/office/components/UniverDocument').then(m => ({ default: m.UniverDocument })),
  { ssr: false, loading: () => <EditorLoading /> }
)

const UniverSlides = dynamic(
  () => import('@/features/office/components/UniverSlides').then(m => ({ default: m.UniverSlides })),
  { ssr: false, loading: () => <EditorLoading /> }
)

function EditorLoading() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-morandi-gold mx-auto mb-3"></div>
        <p className="text-sm text-morandi-secondary">載入編輯器中...</p>
      </div>
    </div>
  )
}

function EditorContent() {
  const { sidebarCollapsed } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const searchParams = useSearchParams()
  const docType = searchParams.get('type') || 'spreadsheet'

  const renderEditor = () => {
    switch (docType) {
      case 'spreadsheet':
        return <UniverSpreadsheet className="h-full" />
      case 'document':
        return <UniverDocument className="h-full" />
      case 'slides':
        return <UniverSlides className="h-full" />
      default:
        return <UniverSpreadsheet className="h-full" />
    }
  }

  return (
    <>
      {/* 手機版頂部標題列 */}
      <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* 主內容區域 - 類似工作空間的全屏佈局 */}
      <main
        className={cn(
          'fixed right-0 bottom-0 overflow-hidden',
          // 手機模式：全寬，頂部扣除標題列
          'top-14 left-0 p-2',
          // 桌面模式：扣除 sidebar 寬度，從頂部開始
          'lg:top-0 lg:p-4',
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-[190px]'
        )}
      >
        <div className="h-full rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          {renderEditor()}
        </div>
      </main>
    </>
  )
}

export default function OfficeEditorPage() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorContent />
    </Suspense>
  )
}
