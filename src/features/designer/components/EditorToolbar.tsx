'use client'

/**
 * 編輯器工具列組件
 *
 * 提供圖層管理、對齊、插入元素等功能按鈕
 */

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Lock,
  Unlock,
  Type,
  Square,
  Circle,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// 簡易分隔線組件
function Separator({ orientation = 'horizontal', className = '' }: { orientation?: 'horizontal' | 'vertical'; className?: string }) {
  return (
    <div
      className={`bg-border ${orientation === 'vertical' ? 'w-px' : 'h-px'} ${className}`}
    />
  )
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CanvasElement } from './types'

interface EditorToolbarProps {
  selectedElementId: string | null
  selectedElement?: CanvasElement | null
  clipboard: CanvasElement[]
  // 元素操作
  onAddText: () => void
  onAddRectangle: () => void
  onAddCircle: () => void
  onCopy: () => void
  onPaste: () => void
  onCut: () => void
  onDelete: () => void
  // 圖層操作
  onBringForward: () => void
  onSendBackward: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onToggleLock: () => void
  // 對齊操作
  onAlignLeft: () => void
  onAlignCenterH: () => void
  onAlignRight: () => void
  onAlignTop: () => void
  onAlignCenterV: () => void
  onAlignBottom: () => void
}

export function EditorToolbar({
  selectedElementId,
  selectedElement,
  clipboard,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onCopy,
  onPaste,
  onCut,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
}: EditorToolbarProps) {
  const hasSelection = !!selectedElementId
  const isLocked = selectedElement?.locked ?? false

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 bg-white border-b border-border">
        {/* 插入元素 */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddText}
                className="h-8 w-8 p-0"
              >
                <Type size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新增文字</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddRectangle}
                className="h-8 w-8 p-0"
              >
                <Square size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新增矩形</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddCircle}
                className="h-8 w-8 p-0"
              >
                <Circle size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新增圓形</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 剪貼簿操作 */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <Copy size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>複製 (Ctrl+C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCut}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <Scissors size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>剪下 (Ctrl+X)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onPaste}
                disabled={clipboard.length === 0}
                className="h-8 w-8 p-0"
              >
                <Clipboard size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>貼上 (Ctrl+V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={!hasSelection}
                className="h-8 w-8 p-0 text-morandi-red hover:text-morandi-red"
              >
                <Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>刪除 (Delete)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 圖層操作 */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!hasSelection}
                    className="h-8 px-2 gap-1"
                  >
                    <Layers size={16} />
                    <span className="text-xs">圖層</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>圖層管理</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onBringToFront}>
                <ChevronsUp size={14} className="mr-2" />
                置頂
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBringForward}>
                <ChevronUp size={14} className="mr-2" />
                上移一層
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendBackward}>
                <ChevronDown size={14} className="mr-2" />
                下移一層
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendToBack}>
                <ChevronsDown size={14} className="mr-2" />
                置底
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleLock}>
                {isLocked ? (
                  <>
                    <Unlock size={14} className="mr-2" />
                    解除鎖定
                  </>
                ) : (
                  <>
                    <Lock size={14} className="mr-2" />
                    鎖定元素
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 水平對齊 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAlignLeft}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignLeft size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠左對齊</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAlignCenterH}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignCenter size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>水平置中</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAlignRight}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignRight size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠右對齊</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 垂直對齊 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAlignTop}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignStartVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠上對齊</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAlignCenterV}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignCenterVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>垂直置中</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAlignBottom}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignEndVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠下對齊</TooltipContent>
          </Tooltip>
        </div>

        {/* 快捷鍵提示 */}
        <div className="ml-auto text-xs text-morandi-secondary">
          <span className="hidden md:inline">
            Ctrl+C 複製 | Ctrl+V 貼上 | Delete 刪除
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
