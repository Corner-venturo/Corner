'use client'

/**
 * IconPicker - 圖示選擇器
 *
 * 使用 @iconify/react 提供大量可商用圖示
 * 只包含 100% 可商用（MIT/Apache 2.0）的圖示集
 */

import { useState, useMemo, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface IconPickerProps {
  onSelectIcon: (iconName: string, iconSet: string) => void
}

// 可商用圖示集（MIT / Apache 2.0 授權）
interface IconSetDef {
  name: string
  prefix: string
  license: string
  popular: string[]
}

const ICON_SETS: Record<string, IconSetDef> = {
  // Material Design Icons - 最豐富的圖示集
  mdi: {
    name: 'Material Design',
    prefix: 'mdi',
    license: 'Apache 2.0',
    popular: [
      'airplane', 'airplane-takeoff', 'airplane-landing',
      'bus', 'train', 'car', 'ship', 'walk',
      'map-marker', 'compass', 'earth', 'flag',
      'camera', 'image', 'food', 'silverware-fork-knife',
      'bed', 'hotel', 'home', 'office-building',
      'weather-sunny', 'weather-cloudy', 'umbrella',
      'star', 'heart', 'thumb-up', 'check-circle',
      'calendar', 'clock', 'phone', 'email',
      'information', 'alert', 'help-circle', 'lightbulb',
      'shopping', 'cart', 'gift', 'ticket',
      'passport', 'briefcase', 'luggage', 'bag-suitcase',
    ],
  },
  // Tabler Icons - 簡潔線性風格
  tabler: {
    name: 'Tabler',
    prefix: 'tabler',
    license: 'MIT',
    popular: [
      'plane', 'plane-departure', 'plane-arrival',
      'bus', 'train', 'car', 'ship', 'walk',
      'map-pin', 'compass', 'world', 'flag',
      'camera', 'photo', 'tools-kitchen-2', 'soup',
      'bed', 'building', 'home', 'building-skyscraper',
      'sun', 'cloud', 'umbrella',
      'star', 'heart', 'thumb-up', 'circle-check',
      'calendar', 'clock', 'phone', 'mail',
      'info-circle', 'alert-circle', 'help', 'bulb',
      'shopping-cart', 'gift', 'ticket', 'cash',
      'passport', 'briefcase', 'luggage', 'backpack',
    ],
  },
  // Phosphor Icons - 柔和友好風格
  ph: {
    name: 'Phosphor',
    prefix: 'ph',
    license: 'MIT',
    popular: [
      'airplane', 'airplane-takeoff', 'airplane-landing',
      'bus', 'train', 'car', 'boat', 'person-simple-walk',
      'map-pin', 'compass', 'globe', 'flag',
      'camera', 'image', 'fork-knife', 'bowl-food',
      'bed', 'buildings', 'house', 'office-chair',
      'sun', 'cloud', 'umbrella',
      'star', 'heart', 'thumbs-up', 'check-circle',
      'calendar', 'clock', 'phone', 'envelope',
      'info', 'warning', 'question', 'lightbulb',
      'shopping-cart', 'gift', 'ticket', 'money',
      'identification-card', 'briefcase', 'suitcase', 'backpack',
    ],
  },
  // Lucide Icons - 和你們原本用的一致
  lucide: {
    name: 'Lucide',
    prefix: 'lucide',
    license: 'ISC',
    popular: [
      'plane', 'plane-takeoff', 'plane-landing',
      'bus', 'train-front', 'car', 'ship', 'footprints',
      'map-pin', 'compass', 'globe', 'flag',
      'camera', 'image', 'utensils', 'soup',
      'bed', 'building', 'home', 'building-2',
      'sun', 'cloud', 'umbrella',
      'star', 'heart', 'thumbs-up', 'check-circle',
      'calendar', 'clock', 'phone', 'mail',
      'info', 'alert-circle', 'help-circle', 'lightbulb',
      'shopping-cart', 'gift', 'ticket', 'banknote',
      'id-card', 'briefcase', 'luggage', 'backpack',
    ],
  },
  // Carbon Icons - IBM 設計系統
  carbon: {
    name: 'Carbon',
    prefix: 'carbon',
    license: 'Apache 2.0',
    popular: [
      'airplane', 'flight-international',
      'bus', 'train', 'car', 'passenger-ship', 'pedestrian',
      'location', 'compass', 'earth', 'flag',
      'camera', 'image', 'restaurant', 'noodle-bowl',
      'hotel', 'building', 'home', 'enterprise',
      'sunny', 'cloudy', 'umbrella',
      'star', 'favorite', 'thumbs-up', 'checkmark-filled',
      'calendar', 'time', 'phone', 'email',
      'information', 'warning-alt', 'help', 'idea',
      'shopping-cart', 'gift', 'ticket', 'money',
      'identification', 'portfolio', 'luggage', 'backpack',
    ],
  },
}

type IconSetKey = keyof typeof ICON_SETS

// 搜尋關鍵字對應
const SEARCH_KEYWORDS: Record<string, string[]> = {
  // 交通
  '飛機': ['airplane', 'plane', 'flight'],
  '機場': ['airplane', 'plane', 'airport'],
  '巴士': ['bus'],
  '火車': ['train'],
  '汽車': ['car'],
  '船': ['ship', 'boat'],
  '走路': ['walk', 'pedestrian', 'footprints'],
  // 地點
  '地點': ['map', 'pin', 'location', 'marker'],
  '地圖': ['map', 'compass', 'globe', 'world', 'earth'],
  '國旗': ['flag'],
  // 拍照
  '相機': ['camera'],
  '照片': ['photo', 'image'],
  // 餐飲
  '餐廳': ['restaurant', 'food', 'fork', 'knife', 'utensils'],
  '食物': ['food', 'bowl', 'soup', 'noodle'],
  // 住宿
  '飯店': ['hotel', 'bed', 'building'],
  '房間': ['bed', 'room'],
  '住宿': ['hotel', 'bed', 'building', 'home'],
  // 天氣
  '天氣': ['weather', 'sun', 'cloud', 'umbrella'],
  '太陽': ['sun', 'sunny'],
  '雨': ['umbrella', 'rain'],
  // 評價
  '星星': ['star'],
  '愛心': ['heart', 'favorite'],
  '讚': ['thumb', 'like'],
  '確認': ['check', 'checkmark'],
  // 時間
  '日曆': ['calendar'],
  '時間': ['clock', 'time'],
  '電話': ['phone'],
  '信箱': ['mail', 'email', 'envelope'],
  // 資訊
  '資訊': ['info', 'information'],
  '警告': ['warning', 'alert'],
  '幫助': ['help', 'question'],
  '點子': ['lightbulb', 'bulb', 'idea'],
  // 購物
  '購物': ['shopping', 'cart'],
  '禮物': ['gift'],
  '票': ['ticket'],
  '錢': ['money', 'cash', 'banknote'],
  // 旅遊
  '護照': ['passport', 'identification', 'id'],
  '行李': ['luggage', 'suitcase', 'briefcase', 'backpack'],
  '背包': ['backpack', 'bag'],
}

export function IconPicker({ onSelectIcon }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [selectedSet, setSelectedSet] = useState<IconSetKey>('mdi')

  // 搜尋圖示
  const filteredIcons = useMemo(() => {
    const iconSet = ICON_SETS[selectedSet]
    let icons = iconSet.popular

    if (search.trim()) {
      const searchLower = search.toLowerCase()

      // 檢查中文關鍵字
      let keywords: string[] = []
      for (const [zhKey, enKeywords] of Object.entries(SEARCH_KEYWORDS)) {
        if (zhKey.includes(search) || search.includes(zhKey)) {
          keywords.push(...enKeywords)
        }
      }

      // 過濾圖示
      icons = iconSet.popular.filter(icon => {
        const iconLower = icon.toLowerCase()
        // 英文搜尋
        if (iconLower.includes(searchLower)) return true
        // 中文關鍵字對應
        if (keywords.some(k => iconLower.includes(k))) return true
        return false
      })
    }

    return icons
  }, [search, selectedSet])

  const handleSelect = useCallback((iconName: string) => {
    const prefix = ICON_SETS[selectedSet].prefix
    onSelectIcon(`${prefix}:${iconName}`, selectedSet)
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
            placeholder="搜尋圖示（支援中文）..."
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
      <div className="flex flex-wrap gap-1 p-2 border-b border-border">
        {(Object.keys(ICON_SETS) as IconSetKey[]).map((key) => (
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
            {ICON_SETS[key].name}
          </Button>
        ))}
      </div>

      {/* 授權提示 */}
      <div className="px-2 py-1 text-[10px] text-morandi-secondary bg-morandi-container/30">
        授權：{ICON_SETS[selectedSet].license}（可商用印刷）
      </div>

      {/* 圖示列表 */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-5 gap-1 p-2">
          {filteredIcons.map((iconName) => (
            <button
              key={iconName}
              onClick={() => handleSelect(iconName)}
              className="flex flex-col items-center justify-center p-2 rounded hover:bg-morandi-container/50 transition-colors group"
              title={iconName}
            >
              <Icon
                icon={`${ICON_SETS[selectedSet].prefix}:${iconName}`}
                className="w-6 h-6 text-morandi-primary group-hover:text-morandi-gold transition-colors"
              />
            </button>
          ))}
        </div>

        {filteredIcons.length === 0 && (
          <div className="p-4 text-center text-sm text-morandi-secondary">
            找不到符合的圖示
          </div>
        )}
      </div>

      {/* 圖示數量 */}
      <div className="p-2 border-t border-border text-[10px] text-morandi-secondary text-center">
        顯示 {filteredIcons.length} 個圖示
      </div>
    </div>
  )
}
