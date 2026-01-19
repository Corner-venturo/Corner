'use client'

/**
 * 插圖選擇器組件
 *
 * 提供彩色 SVG 插圖庫，按主題分類
 * 支援搜尋和分類篩選
 */

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  ILLUSTRATIONS,
  ILLUSTRATION_CATEGORIES,
  getIllustrationsByCategory,
  searchIllustrations,
  type IllustrationCategory,
  type Illustration,
} from './core/illustration-library'

interface IllustrationPickerProps {
  onSelectIllustration: (illustration: Illustration) => void
}

export function IllustrationPicker({ onSelectIllustration }: IllustrationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IllustrationCategory | 'all'>('all')

  // 篩選插圖
  const filteredIllustrations = useMemo(() => {
    let results: Illustration[]

    if (searchQuery.trim()) {
      results = searchIllustrations(searchQuery)
    } else if (selectedCategory === 'all') {
      results = ILLUSTRATIONS
    } else {
      results = getIllustrationsByCategory(selectedCategory)
    }

    return results
  }, [searchQuery, selectedCategory])

  // 按分類分組顯示
  const groupedIllustrations = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== 'all') {
      return { [selectedCategory === 'all' ? '搜尋結果' : ILLUSTRATION_CATEGORIES[selectedCategory]]: filteredIllustrations }
    }

    const groups: Record<string, Illustration[]> = {}
    Object.entries(ILLUSTRATION_CATEGORIES).forEach(([category, label]) => {
      const items = getIllustrationsByCategory(category as IllustrationCategory)
      if (items.length > 0) {
        groups[label] = items
      }
    })
    return groups
  }, [filteredIllustrations, searchQuery, selectedCategory])

  const categories = Object.entries(ILLUSTRATION_CATEGORIES) as [IllustrationCategory, string][]

  return (
    <div className="flex flex-col h-full">
      {/* 搜尋列 */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-morandi-secondary" size={14} />
          <Input
            type="text"
            placeholder="搜尋插圖..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-7 h-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 分類標籤 */}
      <div className="p-2 border-b border-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <CategoryButton
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          >
            全部
          </CategoryButton>
          {categories.map(([category, label]) => (
            <CategoryButton
              key={category}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {label}
            </CategoryButton>
          ))}
        </div>
      </div>

      {/* 插圖列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {Object.entries(groupedIllustrations).map(([groupName, illustrations]) => (
            <div key={groupName}>
              <h4 className="text-xs font-medium text-morandi-secondary mb-2 sticky top-0 bg-white py-1">
                {groupName} ({illustrations.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {illustrations.map((illustration) => (
                  <IllustrationButton
                    key={illustration.id}
                    illustration={illustration}
                    onClick={() => onSelectIllustration(illustration)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredIllustrations.length === 0 && (
            <div className="text-center py-8 text-morandi-secondary text-sm">
              找不到符合的插圖
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// 分類按鈕
function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors',
        active
          ? 'bg-morandi-gold text-white'
          : 'bg-morandi-container/50 text-morandi-secondary hover:bg-morandi-container'
      )}
    >
      {children}
    </button>
  )
}

// 插圖按鈕
function IllustrationButton({
  illustration,
  onClick,
}: {
  illustration: Illustration
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex flex-col items-center justify-center h-16 p-1 hover:border-morandi-gold overflow-hidden"
      onClick={onClick}
      title={illustration.name}
    >
      <div
        className="w-10 h-10"
        dangerouslySetInnerHTML={{ __html: illustration.svg }}
      />
      <span className="text-[9px] text-morandi-secondary truncate w-full text-center mt-0.5">
        {illustration.name}
      </span>
    </Button>
  )
}
