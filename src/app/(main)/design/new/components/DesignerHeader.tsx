/**
 * Designer Header 組件
 * 包含返回按鈕、標題、面板切換、縮放控制、儲存按鈕
 */

'use client'

import { useRouter } from 'next/navigation'
import {
  Save,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  PanelLeftClose,
  PanelRightClose,
  LayoutList,
  Layers,
  LayoutGrid,
  Columns2,
  FileDown,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnsavedIndicator } from '@/features/designer/components/LoadingOverlay'
import { cn } from '@/lib/utils'
import type { DesignType } from '@/features/designer/components/DesignTypeSelector'

interface DesignerHeaderProps {
  selectedDesignType: DesignType
  isDirty: boolean
  isSaving: boolean
  entityId: string | null
  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  // 面板狀態
  showPageList: boolean
  setShowPageList: (show: boolean) => void
  showLeftPanel: boolean
  setShowLeftPanel: (show: boolean) => void
  showRightPanel: boolean
  setShowRightPanel: (show: boolean) => void
  showLayerPanel: boolean
  setShowLayerPanel: (show: boolean) => void
  isDualPageMode: boolean
  setIsDualPageMode: (mode: boolean) => void
  setShowBlockLibrary: (show: boolean) => void
  // 頁面數量（用於判斷雙頁模式是否可用）
  pageCount: number
  // 操作
  onSave: () => void
  onExportPDF: () => void
}

export function DesignerHeader({
  selectedDesignType,
  isDirty,
  isSaving,
  entityId,
  zoom,
  zoomIn,
  zoomOut,
  showPageList,
  setShowPageList,
  showLeftPanel,
  setShowLeftPanel,
  showRightPanel,
  setShowRightPanel,
  showLayerPanel,
  setShowLayerPanel,
  isDualPageMode,
  setIsDualPageMode,
  setShowBlockLibrary,
  pageCount,
  onSave,
  onExportPDF,
}: DesignerHeaderProps) {
  const router = useRouter()

  return (
    <header className="h-[72px] bg-card border-b border-border px-4 flex items-center gap-3 shrink-0">
      {/* 返回按鈕 - 回到設計列表 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/design')}
        className="gap-2"
      >
        <ArrowLeft size={16} />
        返回
      </Button>

      <div className="w-px h-6 bg-border" />

      {/* Logo & Title */}
      <div className="flex items-center gap-2">
        <Palette size={20} className="text-morandi-gold" />
        <span className="font-semibold text-morandi-primary">{selectedDesignType.name}</span>
        <span className="text-sm text-morandi-secondary">{selectedDesignType.description}</span>
        <UnsavedIndicator isDirty={isDirty} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 面板切換 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPageList(!showPageList)}
        className={cn(!showPageList && 'text-morandi-muted')}
        title="頁面列表"
      >
        <LayoutList size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowLeftPanel(!showLeftPanel)}
        className={cn(!showLeftPanel && 'text-morandi-muted')}
        title="元素庫"
      >
        <PanelLeftClose size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowBlockLibrary(true)}
        title="插入區塊"
      >
        <LayoutGrid size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowRightPanel(!showRightPanel)}
        className={cn(!showRightPanel && 'text-morandi-muted')}
        title="屬性面板"
      >
        <PanelRightClose size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowLayerPanel(!showLayerPanel)}
        className={cn(!showLayerPanel && 'text-morandi-muted')}
        title="圖層面板"
      >
        <Layers size={16} />
      </Button>

      {/* 雙頁模式切換（只在手冊類型且有多頁時顯示） */}
      {selectedDesignType?.id.startsWith('brochure-') && pageCount > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDualPageMode(!isDualPageMode)}
          className={cn(isDualPageMode && 'bg-morandi-gold/10 text-morandi-gold')}
          title="雙頁預覽模式"
        >
          <Columns2 size={16} />
        </Button>
      )}

      <div className="w-px h-6 bg-border" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={zoomOut}>
          <ZoomOut size={16} />
        </Button>
        <span className="text-sm text-morandi-secondary w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={zoomIn}>
          <ZoomIn size={16} />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty || !entityId}
          className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Save size={14} />
          儲存
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={pageCount === 0}
          className="gap-1"
        >
          <FileDown size={14} />
          列印/匯出
        </Button>
      </div>
    </header>
  )
}
