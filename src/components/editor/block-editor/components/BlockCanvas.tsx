'use client'
/**
 * 區塊畫布
 *
 * 渲染所有區塊並處理選取和操作
 */


import { useCallback } from 'react'
import { BlockWrapper } from './BlockWrapper'
import type { AnyBlock, BlockType, BlockDataMap } from '../types'

// 區塊編輯器
import { CoverBlockEditor } from '../blocks/CoverBlockEditor'
import { FlightBlockEditor } from '../blocks/FlightBlockEditor'
import { FeaturesBlockEditor } from '../blocks/FeaturesBlockEditor'
import { DailyItineraryBlockEditor } from '../blocks/DailyItineraryBlockEditor'
import { HotelsBlockEditor } from '../blocks/HotelsBlockEditor'
import {
  FocusCardsBlockEditor,
  LeaderMeetingBlockEditor,
  PricingBlockEditor,
  PriceTiersBlockEditor,
  FAQsBlockEditor,
  NoticesBlockEditor,
  CancellationBlockEditor,
} from '../blocks/SimpleBlockEditors'
import { BLOCK_EDITOR_LABELS } from './constants/labels'

interface BlockCanvasProps {
  blocks: AnyBlock[]
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  onUpdateBlock: <T extends BlockType>(blockId: string, data: Partial<BlockDataMap[T]>) => void
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void
  onToggleVisibility: (blockId: string) => void
  onRemoveBlock: (blockId: string) => void
  className?: string
}

export function BlockCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onMoveBlock,
  onToggleVisibility,
  onRemoveBlock,
  className = '',
}: BlockCanvasProps) {
  // 建立更新處理器
  const createUpdateHandler = useCallback(
    <T extends BlockType>(blockId: string) =>
      (data: Partial<BlockDataMap[T]>) => {
        onUpdateBlock(blockId, data)
      },
    [onUpdateBlock]
  )

  // 渲染區塊編輯器
  const renderBlockEditor = (block: AnyBlock) => {
    const updateHandler = createUpdateHandler(block.meta.id)

    switch (block.meta.type) {
      case 'COVER':
        return (
          <CoverBlockEditor
            data={block.data as BlockDataMap['COVER']}
            onChange={updateHandler}
          />
        )
      case 'FLIGHT':
        return (
          <FlightBlockEditor
            data={block.data as BlockDataMap['FLIGHT']}
            onChange={updateHandler}
          />
        )
      case 'FEATURES':
        return (
          <FeaturesBlockEditor
            data={block.data as BlockDataMap['FEATURES']}
            onChange={updateHandler}
          />
        )
      case 'FOCUS_CARDS':
        return (
          <FocusCardsBlockEditor
            data={block.data as BlockDataMap['FOCUS_CARDS']}
            onChange={updateHandler}
          />
        )
      case 'LEADER_MEETING':
        return (
          <LeaderMeetingBlockEditor
            data={block.data as BlockDataMap['LEADER_MEETING']}
            onChange={updateHandler}
          />
        )
      case 'HOTELS':
        return (
          <HotelsBlockEditor
            data={block.data as BlockDataMap['HOTELS']}
            onChange={updateHandler}
          />
        )
      case 'DAILY_ITINERARY':
        return (
          <DailyItineraryBlockEditor
            data={block.data as BlockDataMap['DAILY_ITINERARY']}
            onChange={updateHandler}
          />
        )
      case 'PRICING':
        return (
          <PricingBlockEditor
            data={block.data as BlockDataMap['PRICING']}
            onChange={updateHandler}
          />
        )
      case 'PRICE_TIERS':
        return (
          <PriceTiersBlockEditor
            data={block.data as BlockDataMap['PRICE_TIERS']}
            onChange={updateHandler}
          />
        )
      case 'FAQS':
        return (
          <FAQsBlockEditor
            data={block.data as BlockDataMap['FAQS']}
            onChange={updateHandler}
          />
        )
      case 'NOTICES':
        return (
          <NoticesBlockEditor
            data={block.data as BlockDataMap['NOTICES']}
            onChange={updateHandler}
          />
        )
      case 'CANCELLATION':
        return (
          <CancellationBlockEditor
            data={block.data as BlockDataMap['CANCELLATION']}
            onChange={updateHandler}
          />
        )
      default:
        return <div className="text-sm text-morandi-secondary">{BLOCK_EDITOR_LABELS.LABEL_6612}</div>
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) => (
        <BlockWrapper
          key={block.meta.id}
          block={block}
          isSelected={block.meta.id === selectedBlockId}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
          onSelect={() => onSelectBlock(block.meta.id)}
          onMoveUp={() => onMoveBlock(block.meta.id, 'up')}
          onMoveDown={() => onMoveBlock(block.meta.id, 'down')}
          onToggleVisibility={() => onToggleVisibility(block.meta.id)}
          onRemove={() => onRemoveBlock(block.meta.id)}
        >
          {renderBlockEditor(block)}
        </BlockWrapper>
      ))}

      {blocks.length === 0 && (
        <div className="text-center py-12 text-morandi-secondary">
          <p className="text-sm">{BLOCK_EDITOR_LABELS.EMPTY_7991}</p>
          <p className="text-xs mt-1">{BLOCK_EDITOR_LABELS.ADD_8157}</p>
        </div>
      )}
    </div>
  )
}
