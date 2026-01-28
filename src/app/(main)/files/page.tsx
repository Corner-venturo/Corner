'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useFileSystemStore } from '@/stores/file-system-store'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { FolderTree } from '@/features/files/components/FolderTree'
import { FileList } from '@/features/files/components/FileList'
import { FilePreview } from '@/features/files/components/FilePreview'
import { UploadDialog } from '@/features/files/components/UploadDialog'
import { logger } from '@/lib/utils/logger'

export default function FilesPage() {
  const { sidebarCollapsed } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const {
    fetchFolders,
    fetchFiles,
    selectedFileIds,
    uploadDialogOpen,
    setUploadDialogOpen,
  } = useFileSystemStore()

  // 初始化
  useEffect(() => {
    logger.log('[FilesPage] 初始化檔案系統')
    fetchFolders()
    fetchFiles()
  }, [])

  // 選中檔案時顯示預覽（手機版）
  useEffect(() => {
    if (selectedFileIds.size > 0) {
      setShowPreview(true)
    }
  }, [selectedFileIds])

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
          {/* 左側：資料夾樹（桌面版） */}
          <div className="hidden lg:block w-64 border-r border-border shrink-0">
            <FolderTree />
          </div>

          {/* 中間：檔案列表 */}
          <div
            className={cn(
              'flex-1 min-w-0',
              selectedFileIds.size > 0 && 'lg:border-r lg:border-border',
              showPreview && 'hidden lg:block'
            )}
          >
            <FileList />
          </div>

          {/* 右側：檔案預覽（選中時顯示） */}
          {selectedFileIds.size > 0 && (
            <div
              className={cn(
                'lg:w-80 min-w-0 shrink-0',
                !showPreview && 'hidden lg:block'
              )}
            >
              <FilePreview onBack={() => setShowPreview(false)} />
            </div>
          )}
        </div>
      </main>

      {/* 上傳對話框 */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      />
    </>
  )
}
