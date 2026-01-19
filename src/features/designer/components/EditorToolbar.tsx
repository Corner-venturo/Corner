'use client'

/**
 * 編輯器工具列組件
 *
 * 提供圖層管理、對齊、插入元素等功能按鈕
 */

import { useRef } from 'react'
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
  Group,
  Ungroup,
  Image,
  Minus,
  Triangle,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  FlipHorizontal,
  FlipVertical,
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
  selectedCount: number
  clipboard: CanvasElement[]
  // 元素操作
  onAddText: () => void
  onAddRectangle: () => void
  onAddCircle: () => void
  onAddEllipse: () => void
  onAddTriangle: () => void
  onAddLine: () => void
  onAddImage: (file: File) => void
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
  // 群組操作
  onGroup: () => void
  onUngroup: () => void
  // 對齊操作
  onAlignLeft: () => void
  onAlignCenterH: () => void
  onAlignRight: () => void
  onAlignTop: () => void
  onAlignCenterV: () => void
  onAlignBottom: () => void
  // 分佈操作
  onDistributeH: () => void
  onDistributeV: () => void
  // 翻轉操作
  onFlipHorizontal?: () => void
  onFlipVertical?: () => void
}

export function EditorToolbar({
  selectedElementId,
  selectedElement,
  selectedCount,
  clipboard,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onAddEllipse,
  onAddTriangle,
  onAddLine,
  onAddImage,
  onCopy,
  onPaste,
  onCut,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onGroup,
  onUngroup,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onDistributeH,
  onDistributeV,
  onFlipHorizontal,
  onFlipVertical,
}: EditorToolbarProps) {
  const hasSelection = !!selectedElementId
  const hasMultiSelection = selectedCount > 1
  const isLocked = selectedElement?.locked ?? false
  const isGroup = selectedElement?.type === 'group'

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAddImage(file)
      e.target.value = '' // Reset for same file selection
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 bg-white border-b border-border overflow-x-auto">
        {/* 隱藏的檔案輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 插入元素 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAddText} className="h-8 w-8 p-0">
                <Type size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新增文字</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleImageClick} className="h-8 w-8 p-0">
                <Image size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新增圖片</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Square size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>新增形狀</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onAddRectangle}>
                <Square size={14} className="mr-2" />
                矩形
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddCircle}>
                <Circle size={14} className="mr-2" />
                圓形
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddEllipse}>
                <Circle size={14} className="mr-2" style={{ transform: 'scaleX(1.5)' }} />
                橢圓
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddTriangle}>
                <Triangle size={14} className="mr-2" />
                三角形
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddLine}>
                <Minus size={14} className="mr-2" />
                線條
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 剪貼簿操作 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onCopy} disabled={!hasSelection} className="h-8 w-8 p-0">
                <Copy size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>複製 (Ctrl+C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onCut} disabled={!hasSelection} className="h-8 w-8 p-0">
                <Scissors size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>剪下 (Ctrl+X)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onPaste} disabled={clipboard.length === 0} className="h-8 w-8 p-0">
                <Clipboard size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>貼上 (Ctrl+V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onDelete} disabled={!hasSelection} className="h-8 w-8 p-0 text-morandi-red hover:text-morandi-red">
                <Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>刪除 (Delete)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 群組操作 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onGroup} disabled={!hasMultiSelection} className="h-8 w-8 p-0">
                <Group size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>群組 (Ctrl+G)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onUngroup} disabled={!isGroup} className="h-8 w-8 p-0">
                <Ungroup size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>取消群組 (Ctrl+Shift+G)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 翻轉操作 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onFlipHorizontal} disabled={!hasSelection} className="h-8 w-8 p-0">
                <FlipHorizontal size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>水平翻轉</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onFlipVertical} disabled={!hasSelection} className="h-8 w-8 p-0">
                <FlipVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>垂直翻轉</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 圖層操作 */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={!hasSelection} className="h-8 px-2 gap-1">
                    <Layers size={16} />
                    <span className="text-xs hidden sm:inline">圖層</span>
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

        {/* 對齊操作 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAlignLeft} disabled={!hasSelection} className="h-8 w-8 p-0">
                <AlignLeft size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠左對齊</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAlignCenterH} disabled={!hasSelection} className="h-8 w-8 p-0">
                <AlignCenter size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>水平置中</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAlignRight} disabled={!hasSelection} className="h-8 w-8 p-0">
                <AlignRight size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠右對齊</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAlignTop} disabled={!hasSelection} className="h-8 w-8 p-0">
                <AlignStartVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠上對齊</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAlignCenterV} disabled={!hasSelection} className="h-8 w-8 p-0">
                <AlignCenterVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>垂直置中</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAlignBottom} disabled={!hasSelection} className="h-8 w-8 p-0">
                <AlignEndVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>靠下對齊</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 分佈操作 */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onDistributeH} disabled={selectedCount < 3} className="h-8 w-8 p-0">
                <AlignHorizontalSpaceAround size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>水平等距分佈 (需選3個以上)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onDistributeV} disabled={selectedCount < 3} className="h-8 w-8 p-0">
                <AlignVerticalSpaceAround size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>垂直等距分佈 (需選3個以上)</TooltipContent>
          </Tooltip>
        </div>

        {/* 快捷鍵提示 */}
        <div className="ml-auto text-xs text-morandi-secondary whitespace-nowrap">
          <span className="hidden lg:inline">
            Ctrl+C 複製 | Ctrl+V 貼上 | Delete 刪除 | Ctrl+G 群組
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
