'use client'

/**
 * 彩色圖標選擇器
 *
 * 使用 Iconify API 搜索彩色圖標
 * 支援 Twemoji, Noto Emoji, Fluent Emoji 等
 * 全部免費商用
 */

import { useState, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ColorfulIconPickerProps {
  onSelectIcon: (iconName: string) => void
}

// 彩色圖標集（全部免費商用）
const COLORFUL_ICON_SETS = {
  'noto': { name: 'Noto Emoji', license: 'Apache 2.0' },
  'twemoji': { name: 'Twitter Emoji', license: 'CC BY 4.0' },
  'fluent-emoji-flat': { name: 'Fluent Emoji', license: 'MIT' },
  'openmoji': { name: 'OpenMoji', license: 'CC BY-SA 4.0' },
  'fxemoji': { name: 'Firefox Emoji', license: 'CC BY 4.0' },
  'emojione': { name: 'EmojiOne', license: 'CC BY 4.0' },
} as const

type IconSetKey = keyof typeof COLORFUL_ICON_SETS

// 預設分類和關鍵字
const CATEGORIES = [
  { id: 'travel', label: '旅遊', keywords: ['airplane', 'plane', 'train', 'bus', 'car', 'ship', 'luggage', 'passport', 'world', 'globe', 'map'] },
  { id: 'food', label: '美食', keywords: ['food', 'sushi', 'ramen', 'pizza', 'burger', 'rice', 'noodle', 'fruit', 'drink', 'coffee', 'tea', 'cake'] },
  { id: 'nature', label: '自然', keywords: ['sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'tree', 'flower', 'mountain', 'beach', 'ocean', 'wave'] },
  { id: 'animals', label: '動物', keywords: ['dog', 'cat', 'bird', 'fish', 'elephant', 'panda', 'monkey', 'rabbit', 'bear', 'tiger'] },
  { id: 'flags', label: '國旗', keywords: ['flag', 'japan', 'korea', 'thailand', 'taiwan', 'usa', 'uk'] },
  { id: 'places', label: '地標', keywords: ['building', 'house', 'temple', 'church', 'tower', 'castle', 'hotel', 'hospital'] },
  { id: 'activities', label: '活動', keywords: ['camera', 'photo', 'swim', 'ski', 'surf', 'camp', 'hike', 'bike', 'golf', 'tennis'] },
  { id: 'symbols', label: '符號', keywords: ['heart', 'star', 'check', 'cross', 'arrow', 'number', 'letter', 'warning', 'info'] },
]

// 熱門圖標（預設顯示）
const POPULAR_ICONS = [
  // 🇯🇵🇹🇭🇰🇷 亞洲國旗
  'twemoji:flag-japan', 'twemoji:flag-thailand', 'twemoji:flag-south-korea', 'twemoji:flag-taiwan',
  'twemoji:flag-vietnam', 'twemoji:flag-singapore', 'twemoji:flag-malaysia', 'twemoji:flag-indonesia',
  'twemoji:flag-philippines', 'twemoji:flag-china', 'twemoji:flag-hong-kong-sar-china', 'twemoji:flag-india',
  // 🌏 其他熱門國旗
  'twemoji:flag-united-states', 'twemoji:flag-united-kingdom', 'twemoji:flag-france', 'twemoji:flag-germany',
  'twemoji:flag-italy', 'twemoji:flag-spain', 'twemoji:flag-australia', 'twemoji:flag-new-zealand',
  'twemoji:flag-canada', 'twemoji:flag-switzerland', 'twemoji:flag-netherlands', 'twemoji:flag-turkey',
  // ✈️ 旅遊
  'noto:airplane', 'noto:world-map', 'noto:luggage', 'noto:passport-control',
  'noto:bullet-train', 'noto:bus', 'noto:automobile', 'noto:ship',
  // 🍜 美食
  'noto:sushi', 'noto:steaming-bowl', 'noto:curry-rice', 'noto:bento-box',
  'noto:tropical-drink', 'noto:bubble-tea', 'noto:hot-beverage', 'noto:ice-cream',
  // 🌸 自然
  'noto:sun', 'noto:full-moon', 'noto:star', 'noto:rainbow',
  'noto:palm-tree', 'noto:cherry-blossom', 'noto:mount-fuji', 'noto:beach-with-umbrella',
  // 🐘 動物
  'noto:elephant', 'noto:panda', 'noto:dog-face', 'noto:cat-face',
  // 🏯 地標
  'noto:shinto-shrine', 'noto:japanese-castle', 'noto:tokyo-tower', 'noto:statue-of-liberty',
  // 📸 活動
  'noto:camera', 'noto:camera-with-flash', 'noto:person-swimming', 'noto:skier',
  // ❤️ 愛心符號
  'noto:red-heart', 'noto:sparkling-heart', 'noto:growing-heart', 'noto:star-struck',
  // 🏳️‍🌈 彩虹相關
  'noto:rainbow-flag', 'noto:rainbow', 'noto:unicorn',
]

// localStorage key for recent icons
const RECENT_ICONS_KEY = 'venturo-recent-icons'
const MAX_RECENT_ICONS = 20

// 讀取最近使用的圖標
function getRecentIcons(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_ICONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// 儲存最近使用的圖標
function saveRecentIcon(iconName: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentIcons().filter(i => i !== iconName)
    recent.unshift(iconName)
    localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_ICONS)))
  } catch {
    // ignore
  }
}

export function ColorfulIconPicker({ onSelectIcon }: ColorfulIconPickerProps) {
  const [search, setSearch] = useState('')
  const [selectedSet, setSelectedSet] = useState<IconSetKey | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [displayIcons, setDisplayIcons] = useState<string[]>(POPULAR_ICONS)
  const [recentIcons, setRecentIcons] = useState<string[]>([])

  // 載入最近使用的圖標
  useEffect(() => {
    setRecentIcons(getRecentIcons())
  }, [])

  // 選擇圖標時記錄
  const handleSelectIcon = useCallback((iconName: string) => {
    saveRecentIcon(iconName)
    setRecentIcons(getRecentIcons())
    onSelectIcon(iconName)
  }, [onSelectIcon])

  // 搜索圖標
  const searchIcons = useCallback(async (query: string) => {
    if (!query.trim()) {
      setDisplayIcons(POPULAR_ICONS)
      return
    }

    setIsLoading(true)
    try {
      // 構建搜索的圖標集列表
      const prefixes = selectedSet === 'all'
        ? Object.keys(COLORFUL_ICON_SETS).join(',')
        : selectedSet

      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefixes=${prefixes}&limit=64`
      )
      const data = await response.json()

      if (data.icons && Array.isArray(data.icons)) {
        setSearchResults(data.icons)
        setDisplayIcons(data.icons)
      } else {
        setDisplayIcons([])
      }
    } catch (error) {
      console.error('Failed to search icons:', error)
      setDisplayIcons([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedSet])

  // 按分類搜索
  const searchByCategory = useCallback(async (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId)
    if (!category) return

    setIsLoading(true)
    setSelectedCategory(categoryId)
    setSearch('')

    try {
      const prefixes = selectedSet === 'all'
        ? Object.keys(COLORFUL_ICON_SETS).join(',')
        : selectedSet

      // 搜索該分類的所有關鍵字
      const allResults: string[] = []
      for (const keyword of category.keywords.slice(0, 3)) { // 只取前3個關鍵字避免太多請求
        const response = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&prefixes=${prefixes}&limit=20`
        )
        const data = await response.json()
        if (data.icons) {
          allResults.push(...data.icons)
        }
      }

      // 去重
      const uniqueResults = [...new Set(allResults)]
      setDisplayIcons(uniqueResults.slice(0, 60))
    } catch (error) {
      console.error('Failed to search by category:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSet])

  // 搜索防抖
  useEffect(() => {
    if (!search.trim()) {
      if (!selectedCategory) {
        setDisplayIcons(POPULAR_ICONS)
      }
      return
    }

    setSelectedCategory(null)
    const timer = setTimeout(() => {
      searchIcons(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, searchIcons, selectedCategory])

  return (
    <div className="flex flex-col h-full">
      {/* 搜索框 */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-morandi-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋彩色圖標..."
            className="pl-8 pr-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory(null)
                setDisplayIcons(POPULAR_ICONS)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 圖標集選擇 */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border">
        <Button
          variant={selectedSet === 'all' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-6 px-2 text-[10px]',
            selectedSet === 'all' && 'bg-morandi-gold hover:bg-morandi-gold-hover'
          )}
          onClick={() => setSelectedSet('all')}
        >
          全部
        </Button>
        {(Object.entries(COLORFUL_ICON_SETS) as [IconSetKey, { name: string }][]).map(([key, { name }]) => (
          <Button
            key={key}
            variant={selectedSet === key ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-6 px-2 text-[10px]',
              selectedSet === key && 'bg-morandi-gold hover:bg-morandi-gold-hover'
            )}
            onClick={() => setSelectedSet(key)}
          >
            {name}
          </Button>
        ))}
      </div>

      {/* 分類標籤 */}
      <div className="p-2 border-b border-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* 最近使用 */}
          {recentIcons.length > 0 && (
            <Button
              variant={selectedCategory === 'recent' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-6 px-2 text-[10px]',
                selectedCategory === 'recent' && 'bg-morandi-gold hover:bg-morandi-gold-hover'
              )}
              onClick={() => {
                setSelectedCategory('recent')
                setSearch('')
                setDisplayIcons(recentIcons)
              }}
            >
              最近
            </Button>
          )}
          <Button
            variant={selectedCategory === null && !search ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-6 px-2 text-[10px]',
              selectedCategory === null && !search && 'bg-morandi-gold hover:bg-morandi-gold-hover'
            )}
            onClick={() => {
              setSelectedCategory(null)
              setSearch('')
              setDisplayIcons(POPULAR_ICONS)
            }}
          >
            熱門
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-6 px-2 text-[10px]',
                selectedCategory === cat.id && 'bg-morandi-gold hover:bg-morandi-gold-hover'
              )}
              onClick={() => searchByCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 圖標列表 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-morandi-secondary" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1 p-2">
            {displayIcons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => handleSelectIcon(iconName)}
                className="flex flex-col items-center justify-center p-2 rounded hover:bg-morandi-container/50 transition-colors group"
                title={iconName}
              >
                <Icon
                  icon={iconName}
                  className="w-8 h-8"
                />
              </button>
            ))}
          </div>
        )}

        {!isLoading && displayIcons.length === 0 && (
          <div className="p-4 text-center text-sm text-morandi-secondary">
            找不到符合的圖標
          </div>
        )}
      </div>

      {/* 底部資訊 */}
      <div className="p-2 border-t border-border text-[10px] text-morandi-secondary text-center">
        {displayIcons.length} 個圖標 · 點擊即可插入
      </div>
    </div>
  )
}
