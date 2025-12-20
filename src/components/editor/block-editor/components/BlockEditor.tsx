/**
 * 區塊編輯器主組件
 *
 * 整合工具箱、畫布和預覽功能
 */

'use client'

import { useMemo } from 'react'
import { BlockCanvas } from './BlockCanvas'
import { BlockToolbox } from './BlockToolbox'
import { useBlockEditor, UseBlockEditorOptions } from '../hooks'
import type { AnyBlock, BlockType, BlockDataMap } from '../types'
import { tourDataToBlocks, blocksToTourData } from '../types'
import type { TourFormData } from '@/components/editor/tour-form/types'

interface BlockEditorProps extends UseBlockEditorOptions {
  /** 初始行程資料（會自動轉換為區塊） */
  initialData?: TourFormData
  /** 區塊變更時的回調（回傳轉換後的 TourFormData） */
  onDataChange?: (data: TourFormData) => void
  /** 是否顯示工具箱 */
  showToolbox?: boolean
  /** 自訂類別 */
  className?: string
}

export function BlockEditor({
  initialData,
  initialBlocks,
  onDataChange,
  onBlocksChange,
  showToolbox = true,
  className = '',
}: BlockEditorProps) {
  // 如果有 initialData，轉換為區塊
  const resolvedInitialBlocks = useMemo(() => {
    if (initialBlocks) return initialBlocks
    if (initialData) return tourDataToBlocks(initialData)
    return []
  }, [initialBlocks, initialData])

  // 使用 hook 管理狀態
  const editor = useBlockEditor({
    initialBlocks: resolvedInitialBlocks,
    onBlocksChange: (blocks) => {
      onBlocksChange?.(blocks)
      if (onDataChange) {
        const data = blocksToTourData(blocks)
        onDataChange(data)
      }
    },
  })

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* 主編輯區 */}
      <div className="flex-1 min-w-0">
        <BlockCanvas
          blocks={editor.blocks}
          selectedBlockId={editor.selectedBlockId}
          onSelectBlock={editor.selectBlock}
          onUpdateBlock={editor.updateBlock}
          onMoveBlock={editor.moveBlock}
          onToggleVisibility={editor.toggleBlockVisibility}
          onRemoveBlock={editor.removeBlock}
        />
      </div>

      {/* 右側工具箱 */}
      {showToolbox && (
        <div className="w-48 shrink-0">
          <div className="sticky top-4">
            <BlockToolbox
              blocks={editor.blocks}
              onAddBlock={(type) => editor.addBlock(type)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 導出 hook 以便進階使用
export { useBlockEditor } from '../hooks'
export type { UseBlockEditorOptions, UseBlockEditorReturn } from '../hooks'
