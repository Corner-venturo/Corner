'use client'

/**
 * IconPicker - 圖示選擇器
 *
 * 使用 Iconify API 搜尋大量可商用圖示
 * 支援中文搜尋（自動轉換為英文關鍵字）
 */

import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { Icon } from '@iconify/react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 導入靜態數據
import { ICON_SETS, ICONS_BY_SET, ZH_TO_EN } from './icon-data'
import { DESIGNER_LABELS } from './constants/labels'

interface IconPickerProps {
  onSelectIcon: (iconName: string, iconSet: string) => void
}

// 將中文轉換為英文搜尋詞
function translateToEnglish(query: string): string[] {
  const results: string[] = []

  // 直接加入原始查詢（可能是英文）
  results.push(query.toLowerCase())

  // 檢查中文關鍵字
  for (const [zh, enList] of Object.entries(ZH_TO_EN)) {
    if (query.includes(zh) || zh.includes(query)) {
      results.push(...enList)
    }
  }

  return [...new Set(results)]
}

export function IconPicker({ onSelectIcon }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [selectedSet, setSelectedSet] = useState('mdi')
  const [icons, setIcons] = useState<string[]>(ICONS_BY_SET.mdi)
  const [isLoading, setIsLoading] = useState(false)

  // 切換圖示集時更新圖示
  useEffect(() => {
    if (!search.trim()) {
      setIcons(ICONS_BY_SET[selectedSet] || [])
    }
  }, [selectedSet, search])

  // 搜尋圖示
  useEffect(() => {
    if (!search.trim()) {
      setIcons(ICONS_BY_SET[selectedSet] || [])
      return
    }

    const searchIcons = async () => {
      setIsLoading(true)

      try {
        // 將搜尋詞轉換為英文
        const keywords = translateToEnglish(search.trim())
        const allIcons: string[] = []

        // 只搜尋第一個關鍵字（最相關的）
        const keyword = keywords[0]

        // 搜尋所有可商用圖示集
        const prefixes = ICON_SETS.map(s => s.prefix).join(',')

        // 使用 Iconify API 搜尋
        const response = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=60&prefixes=${prefixes}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.icons && Array.isArray(data.icons)) {
            // 根據選中的圖示集過濾，但如果結果太少就顯示全部
            const filtered = data.icons.filter((icon: string) => icon.startsWith(selectedSet + ':'))
            if (filtered.length >= 5) {
              allIcons.push(...filtered)
            } else {
              // 結果太少，顯示所有圖示集的結果
              allIcons.push(...data.icons)
            }
          }
        }

        setIcons(allIcons.length > 0 ? allIcons : [])
      } catch (error) {
        logger.error('搜尋圖示失敗:', error)
        setIcons([])
      } finally {
        setIsLoading(false)
      }
    }

    // 防抖
    const timer = setTimeout(searchIcons, 400)
    return () => clearTimeout(timer)
  }, [search, selectedSet])

  const handleSelect = useCallback((iconName: string) => {
    onSelectIcon(iconName, selectedSet)
  }, [selectedSet, onSelectIcon])

  return (
    <div className="flex flex-col h-full">
      {/* 搜尋框 */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-morandi-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={DESIGNER_LABELS.SEARCH_5417}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 圖示集選擇 */}
      <div className="p-2 border-b border-border">
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={DESIGNER_LABELS.SELECT_5236} />
          </SelectTrigger>
          <SelectContent>
            {ICON_SETS.map((set) => (
              <SelectItem key={set.prefix} value={set.prefix}>
                <span className="flex items-center gap-2">
                  <span>{set.name}</span>
                  <span className="text-[10px] text-morandi-secondary">({set.license})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 授權提示 */}
      <div className="px-2 py-1 text-[10px] text-morandi-secondary bg-morandi-container/30">
        共 {ICON_SETS.length} 個圖示集 · {ICONS_BY_SET[selectedSet]?.length || 0} 個圖示 · 可商用印刷
      </div>

      {/* 圖示列表 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1 p-2">
            {icons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                className="flex flex-col items-center justify-center p-2 rounded hover:bg-morandi-container/50 transition-colors group"
                title={iconName}
              >
                <Icon
                  icon={iconName}
                  className="w-6 h-6 text-morandi-primary group-hover:text-morandi-gold transition-colors"
                />
              </button>
            ))}
          </div>
        )}

        {!isLoading && icons.length === 0 && (
          <div className="p-4 text-center text-sm text-morandi-secondary">
            {DESIGNER_LABELS.NOT_FOUND_2855}
          </div>
        )}
      </div>

      {/* 圖示數量 */}
      <div className="p-2 border-t border-border text-[10px] text-morandi-secondary text-center">
        {search ? `找到 ${icons.length} 個圖示` : '熱門旅遊圖示'}
      </div>
    </div>
  )
}
