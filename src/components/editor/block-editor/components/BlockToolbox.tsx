/**
 * 區塊工具箱
 *
 * 顯示可用的區塊列表，用於新增區塊
 */

'use client'

import { useMemo } from 'react'
import {
  Image,
  Plane,
  Star,
  MapPin,
  Users,
  Building,
  Calendar,
  DollarSign,
  Tag,
  HelpCircle,
  AlertCircle,
  XCircle,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlockType, AnyBlock } from '../types'
import { BLOCK_CONFIGS, canAddBlock } from '../types'

// 圖示映射
const ICON_MAP: Record<string, React.ElementType> = {
  Image,
  Plane,
  Star,
  MapPin,
  Users,
  Building,
  Calendar,
  DollarSign,
  Tag,
  HelpCircle,
  AlertCircle,
  XCircle,
}

interface BlockToolboxProps {
  blocks: AnyBlock[]
  onAddBlock: (type: BlockType) => void
  className?: string
}

export function BlockToolbox({ blocks, onAddBlock, className = '' }: BlockToolboxProps) {
  // 可新增的區塊列表
  const availableBlocks = useMemo(() => {
    return Object.values(BLOCK_CONFIGS)
      .filter(config => canAddBlock(config.type, blocks))
      .map(config => ({
        ...config,
        IconComponent: ICON_MAP[config.icon] || Plus,
      }))
  }, [blocks])

  if (availableBlocks.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-xs font-medium text-morandi-secondary uppercase tracking-wider px-1">
        新增區塊
      </h3>
      <div className="space-y-1">
        {availableBlocks.map(config => (
          <Button
            key={config.type}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-8"
            onClick={() => onAddBlock(config.type)}
          >
            <config.IconComponent size={14} className="text-morandi-gold" />
            <span>{config.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
