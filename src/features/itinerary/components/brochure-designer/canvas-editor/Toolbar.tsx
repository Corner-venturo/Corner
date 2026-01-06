'use client'

/**
 * Canvas Editor Toolbar
 * 畫布編輯器工具列
 */

import React from 'react'
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Ruler,
  AlertTriangle,
  Magnet,
  Save,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EditorState } from './types'

interface ToolbarProps {
  editorState: EditorState
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onToggleGrid: () => void
  onToggleGuides: () => void
  onToggleOverlapWarning: () => void
  onToggleSnap: () => void
  onSave: () => void
  onExport: () => void
  onPreview: () => void
  canUndo: boolean
  canRedo: boolean
  isSaving?: boolean
}

export function Toolbar({
  editorState,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleGrid,
  onToggleGuides,
  onToggleOverlapWarning,
  onToggleSnap,
  onSave,
  onExport,
  onPreview,
  canUndo,
  canRedo,
  isSaving,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border">
      {/* 左側：歷史操作 */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onUndo}
          disabled={!canUndo}
          title="復原 (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </Button>
      </div>

      {/* 中間：縮放控制 */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1 py-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onZoomOut}
          disabled={editorState.zoom <= 0.25}
          title="縮小 (Ctrl+-)"
        >
          <ZoomOut size={14} />
        </Button>

        <button
          className="px-2 py-1 text-xs font-mono min-w-[50px] text-center hover:bg-white rounded transition-colors"
          onClick={onZoomReset}
          title="重置縮放 (Ctrl+0)"
        >
          {Math.round(editorState.zoom * 100)}%
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onZoomIn}
          disabled={editorState.zoom >= 4}
          title="放大 (Ctrl++)"
        >
          <ZoomIn size={14} />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onZoomReset}
          title="適應畫面"
        >
          <Maximize2 size={14} />
        </Button>
      </div>

      {/* 右側：顯示選項與操作 */}
      <div className="flex items-center gap-2">
        {/* 顯示選項 */}
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg px-1 py-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editorState.showGrid && 'bg-white shadow-sm text-morandi-gold'
            )}
            onClick={onToggleGrid}
            title="顯示網格"
          >
            <Grid3X3 size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editorState.showGuides && 'bg-white shadow-sm text-morandi-gold'
            )}
            onClick={onToggleGuides}
            title="顯示參考線"
          >
            <Ruler size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editorState.showOverlapWarning && 'bg-white shadow-sm text-red-500'
            )}
            onClick={onToggleOverlapWarning}
            title="重疊警告"
          >
            <AlertTriangle size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editorState.snapToGuide && 'bg-white shadow-sm text-morandi-gold'
            )}
            onClick={onToggleSnap}
            title="吸附對齊"
          >
            <Magnet size={14} />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* 預覽 */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onPreview}
        >
          <Eye size={14} />
          預覽
        </Button>

        {/* 匯出 */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onExport}
        >
          <Download size={14} />
          匯出
        </Button>

        {/* 儲存 */}
        <Button
          size="sm"
          className="gap-1.5 h-8 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save size={14} />
          {isSaving ? '儲存中...' : '儲存'}
        </Button>
      </div>
    </div>
  )
}
