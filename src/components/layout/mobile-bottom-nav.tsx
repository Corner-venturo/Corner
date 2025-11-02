'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  MapPin,
  ShoppingCart,
  Calculator,
  CreditCard,
  Users,
  Database,
  MoreHorizontal,
  Settings,
} from 'lucide-react'

// 可用的導航項目配置
export interface NavItem {
  id: string
  icon: keyof typeof ICON_MAP
  label: string
  href: string
  requiredPermission?: string
}

// 圖標映射
const ICON_MAP = {
  Home,
  Calendar,
  MapPin,
  ShoppingCart,
  Calculator,
  CreditCard,
  Users,
  Database,
  Settings,
  MoreHorizontal,
}

// 預設導航項目（所有可選的功能）
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: 'Home', label: '首頁', href: '/' },
  { id: 'calendar', icon: 'Calendar', label: '行事曆', href: '/calendar', requiredPermission: 'calendar' },
  { id: 'tours', icon: 'MapPin', label: '旅遊團', href: '/tours', requiredPermission: 'tours' },
  { id: 'orders', icon: 'ShoppingCart', label: '訂單', href: '/orders', requiredPermission: 'orders' },
  { id: 'quotes', icon: 'Calculator', label: '報價單', href: '/quotes', requiredPermission: 'quotes' },
  { id: 'finance', icon: 'CreditCard', label: '財務', href: '/finance', requiredPermission: 'payments' },
  { id: 'customers', icon: 'Users', label: '顧客', href: '/customers', requiredPermission: 'customers' },
  { id: 'database', icon: 'Database', label: '資料', href: '/database', requiredPermission: 'database' },
]

// 預設選中的導航項目（前 4 個）
const DEFAULT_SELECTED_IDS = ['home', 'calendar', 'tours', 'orders']

// 從 localStorage 讀取配置
function getStoredNavItems(): string[] {
  if (typeof window === 'undefined') return DEFAULT_SELECTED_IDS

  try {
    const stored = localStorage.getItem('venturo_mobile_nav')
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SELECTED_IDS
    }
  } catch (error) {
    console.error('Failed to parse mobile nav config:', error)
  }

  return DEFAULT_SELECTED_IDS
}

// 儲存配置到 localStorage
function saveNavItems(itemIds: string[]) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('venturo_mobile_nav', JSON.stringify(itemIds))
  } catch (error) {
    console.error('Failed to save mobile nav config:', error)
  }
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(DEFAULT_SELECTED_IDS)
  const [showAllItems, setShowAllItems] = useState(false)

  // 載入儲存的配置
  useEffect(() => {
    setSelectedItemIds(getStoredNavItems())
  }, [])

  // 過濾出選中的項目
  const selectedItems = selectedItemIds
    .map(id => DEFAULT_NAV_ITEMS.find(item => item.id === id))
    .filter((item): item is NavItem => item !== undefined)
    .slice(0, 4) // 最多 4 個

  // 檢查路徑是否匹配
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // 渲染導航項目
  const renderNavItem = (item: NavItem) => {
    const Icon = ICON_MAP[item.icon]
    const active = isActive(item.href)

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
          active
            ? 'text-morandi-gold'
            : 'text-morandi-secondary hover:text-morandi-primary'
        )}
      >
        <Icon size={20} className={active ? 'stroke-[2.5]' : 'stroke-2'} />
        <span className="text-xs mt-1 font-medium">{item.label}</span>
      </Link>
    )
  }

  // 找到當前頁面在導航項目中的索引（用於指示器）
  const currentIndex = selectedItems.findIndex(item => {
    if (item.href === '/') return pathname === '/'
    return pathname.startsWith(item.href)
  })

  return (
    <>
      {/* 底部導航欄 - 只在手機模式顯示 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-[400] safe-area-pb">
        {/* 頁面指示器（小圓點） */}
        {currentIndex !== -1 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {selectedItems.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'w-6 bg-morandi-gold'
                    : 'w-1.5 bg-morandi-secondary/30'
                )}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-around h-16 px-2">
          {/* 顯示選中的 4 個項目 */}
          {selectedItems.map(renderNavItem)}

          {/* 更多按鈕 */}
          <button
            onClick={() => setShowAllItems(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
              'text-morandi-secondary hover:text-morandi-primary'
            )}
          >
            <MoreHorizontal size={20} />
            <span className="text-xs mt-1 font-medium">更多</span>
          </button>
        </div>
      </div>

      {/* 全功能選單 - 點擊「更多」時彈出 */}
      {showAllItems && (
        <MobileNavSettings
          selectedItemIds={selectedItemIds}
          onSave={(newIds) => {
            setSelectedItemIds(newIds)
            saveNavItems(newIds)
            setShowAllItems(false)
          }}
          onClose={() => setShowAllItems(false)}
        />
      )}
    </>
  )
}

// 設定介面組件
interface MobileNavSettingsProps {
  selectedItemIds: string[]
  onSave: (itemIds: string[]) => void
  onClose: () => void
}

function MobileNavSettings({ selectedItemIds, onSave, onClose }: MobileNavSettingsProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedItemIds)

  const toggleItem = (id: string) => {
    if (tempSelected.includes(id)) {
      setTempSelected(tempSelected.filter(itemId => itemId !== id))
    } else {
      if (tempSelected.length < 4) {
        setTempSelected([...tempSelected, id])
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        className="bg-background w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-morandi-primary">自訂底部導航欄</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-morandi-container/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 提示 */}
        <div className="p-4 bg-morandi-gold/5 border-b border-border">
          <p className="text-sm text-morandi-secondary">
            選擇最多 4 個常用功能顯示在底部導航欄 ({tempSelected.length}/4)
          </p>
        </div>

        {/* 功能列表 */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-2">
            {DEFAULT_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon]
              const isSelected = tempSelected.includes(item.id)
              const canSelect = isSelected || tempSelected.length < 4

              return (
                <button
                  key={item.id}
                  onClick={() => canSelect && toggleItem(item.id)}
                  disabled={!canSelect}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                    isSelected
                      ? 'border-morandi-gold bg-morandi-gold/10 text-morandi-gold'
                      : canSelect
                      ? 'border-border hover:border-morandi-gold/50 hover:bg-morandi-container/50'
                      : 'border-border opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {isSelected && (
                    <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-border hover:bg-morandi-container/50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={() => onSave(tempSelected)}
            className="flex-1 px-4 py-3 rounded-lg bg-morandi-gold hover:bg-morandi-gold-hover text-white transition-colors font-medium"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  )
}
