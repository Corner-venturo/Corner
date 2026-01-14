'use client'

/**
 * 頁面列表側邊欄
 *
 * 顯示所有頁面縮圖，支援：
 * - 切換頁面
 * - 新增頁面
 * - 刪除頁面
 * - 拖曳排序
 */

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CanvasPage } from './types'
import type { StyleSeries } from '../templates/engine'

// 頁面類型定義
interface PageTypeOption {
  id: string
  templateKey: keyof StyleSeries['templates']
  name: string
  description: string
}

const PAGE_TYPES: PageTypeOption[] = [
  { id: 'toc', templateKey: 'toc', name: '目錄', description: '章節目錄頁' },
  { id: 'itinerary', templateKey: 'itinerary', name: '行程總覽', description: '航班、集合資訊' },
  { id: 'daily', templateKey: 'daily', name: '每日行程', description: '單日行程詳情' },
  { id: 'hotel', templateKey: 'hotel', name: '飯店介紹', description: '單一飯店資訊' },
  { id: 'attraction', templateKey: 'attraction', name: '景點介紹', description: '景點特色說明' },
  { id: 'memo', templateKey: 'memo', name: '旅遊提醒', description: '注意事項備忘' },
]

interface PageListSidebarProps {
  pages: CanvasPage[]
  currentPageIndex: number
  selectedStyle: StyleSeries | null
  onSelectPage: (index: number) => void
  onAddPage: (templateKey: string) => void
  onDeletePage: (index: number) => void
  onReorderPages: (fromIndex: number, toIndex: number) => void
}

export function PageListSidebar({
  pages,
  currentPageIndex,
  selectedStyle,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onReorderPages,
}: PageListSidebarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // 拖曳開始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // 封面不可拖曳
    if (index === 0) {
      e.preventDefault()
      return
    }
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  // 拖曳經過
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    // 不能拖到封面位置
    if (index === 0) return
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  // 拖曳離開
  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  // 拖曳結束
  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== toIndex && toIndex > 0) {
      onReorderPages(draggedIndex, toIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 拖曳取消
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 可用的頁面類型（根據選擇的風格）
  const availablePageTypes = PAGE_TYPES.filter((pt) => {
    if (!selectedStyle) return false
    return pt.templateKey in selectedStyle.templates
  })

  return (
    <div className="w-48 bg-card border-r border-border flex flex-col shrink-0">
      {/* 標題 - 高度與元素庫一致 */}
      <div className="p-3 border-b border-border flex items-center justify-between h-[42px]">
        <span className="text-sm font-medium text-morandi-primary">頁面</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="h-5 w-5 p-0"
          disabled={!selectedStyle}
        >
          <Plus size={12} />
        </Button>
      </div>

      {/* 頁面列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pages.map((page, index) => (
          <div
            key={page.id}
            draggable={index > 0} // 封面不可拖曳
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'group relative rounded-lg border-2 transition-all cursor-pointer',
              'hover:border-morandi-gold/50',
              index === currentPageIndex
                ? 'border-morandi-gold bg-morandi-gold/5'
                : 'border-border',
              // 拖曳中的樣式
              draggedIndex === index && 'opacity-50',
              dragOverIndex === index && 'border-morandi-gold border-dashed'
            )}
            onClick={() => onSelectPage(index)}
          >
            {/* 縮圖預覽區 */}
            <div
              className="aspect-[559/794] bg-white rounded-t flex items-center justify-center text-xs text-morandi-secondary overflow-hidden"
            >
              {/* 簡易預覽：顯示頁面名稱 */}
              <div className="text-center p-2">
                <div className="text-morandi-primary font-medium truncate">
                  {page.name}
                </div>
                <div className="text-[10px] text-morandi-secondary">
                  第 {index + 1} 頁
                </div>
              </div>
            </div>

            {/* 頁面操作 */}
            <div className="flex items-center justify-between p-1.5 border-t border-border/50">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={12} className="text-morandi-muted cursor-grab" />
              </div>

              {/* 刪除按鈕（封面不可刪除） */}
              {index > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePage(index)
                  }}
                  className="p-1 rounded hover:bg-morandi-red/10 text-morandi-muted hover:text-morandi-red opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 新增頁面對話框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新增頁面</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {availablePageTypes.map((pageType) => (
              <button
                key={pageType.id}
                type="button"
                onClick={() => {
                  onAddPage(pageType.templateKey)
                  setShowAddDialog(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border border-border',
                  'hover:border-morandi-gold hover:bg-morandi-gold/5 transition-all text-left'
                )}
              >
                <div>
                  <div className="font-medium text-morandi-primary">
                    {pageType.name}
                  </div>
                  <div className="text-xs text-morandi-secondary">
                    {pageType.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
