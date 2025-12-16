'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X,
  ChevronDown,
  Home,
  MapPin,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  Calculator,
  Database,
  Building2,
  Wallet,
  Clock,
  UserCog,
  BarChart3,
  Calendar,
  TrendingDown,
  FileCheck,
  Flag,
  Sparkles,
  FileSignature,
  FileText,
  CircleDot,
  Wifi,
  ImageIcon,
  Bus,
  CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { isMenuItemHidden } from '@/constants/menu-items'

interface MenuItem {
  href: string
  label: string
  icon: React.ElementType
  children?: MenuItem[]
  requiredPermission?: string
}

// 主選單項目
const menuItems: MenuItem[] = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/calendar', label: '行事曆', icon: Calendar, requiredPermission: 'calendar' },
  { href: '/todos', label: '待辦事項', icon: CheckSquare, requiredPermission: 'todos' },
  { href: '/itinerary', label: '行程管理', icon: Flag, requiredPermission: 'itinerary' },
  { href: '/tours', label: '旅遊團', icon: MapPin, requiredPermission: 'tours' },
  { href: '/orders', label: '訂單', icon: ShoppingCart, requiredPermission: 'orders' },
  { href: '/quotes', label: '報價單', icon: Calculator, requiredPermission: 'quotes' },
  {
    href: '/finance',
    label: '財務系統',
    icon: CreditCard,
    children: [
      { href: '/finance/payments', label: '收款管理', icon: CreditCard, requiredPermission: 'payments' },
      { href: '/finance/requests', label: '請款管理', icon: TrendingDown, requiredPermission: 'requests' },
      { href: '/finance/treasury', label: '出納管理', icon: Wallet, requiredPermission: 'disbursement' },
      { href: '/finance/vouchers', label: '會計傳票', icon: FileText, requiredPermission: 'vouchers' },
      { href: '/finance/travel-invoice', label: '代轉發票', icon: FileText, requiredPermission: 'travel_invoice' },
      { href: '/finance/reports', label: '報表管理', icon: BarChart3, requiredPermission: 'reports' },
    ],
  },
  { href: '/visas', label: '簽證管理', icon: FileCheck, requiredPermission: 'visas' },
  { href: '/contracts', label: '合約管理', icon: FileSignature, requiredPermission: 'contracts' },
  { href: '/confirmations', label: '確認單管理', icon: CircleDot, requiredPermission: 'confirmations' },
  {
    href: '/database',
    label: '資料管理',
    icon: Database,
    requiredPermission: 'database',
    children: [
      { href: '/customers', label: '顧客管理', icon: Users, requiredPermission: 'customers' },
      { href: '/database/regions', label: '地區管理', icon: MapPin, requiredPermission: 'database' },
      { href: '/database/attractions', label: '景點管理', icon: MapPin, requiredPermission: 'database' },
      { href: '/database/transportation-rates', label: '車資管理', icon: Bus, requiredPermission: 'database' },
      { href: '/database/suppliers', label: '供應商管理', icon: Building2, requiredPermission: 'database' },
      { href: '/database/tour-leaders', label: '領隊資料', icon: Users, requiredPermission: 'database' },
      { href: '/database/company-assets', label: '公司資源管理', icon: ImageIcon, requiredPermission: 'database' },
    ],
  },
  { href: '/hr', label: '人資管理', icon: UserCog, requiredPermission: 'hr' },
  { href: '/esims', label: '網卡管理', icon: Wifi, requiredPermission: 'hr' },
]

// 個人工具
const personalToolItems: MenuItem[] = [
  { href: '/accounting', label: '記帳管理', icon: Wallet, requiredPermission: 'accounting' },
  { href: '/timebox', label: '箱型時間', icon: Clock, requiredPermission: 'timebox' },
  { href: '/manifestation', label: '顯化魔法', icon: Sparkles, requiredPermission: 'manifestation' },
]

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // 取得使用者隱藏的選單項目
  const hiddenMenuItems = user?.hidden_menu_items || []

  // 關閉側邊欄時重置展開狀態
  useEffect(() => {
    if (!isOpen) {
      setExpandedItems([])
    }
  }, [isOpen])

  // 點擊連結後關閉側邊欄
  const handleLinkClick = () => {
    onClose()
  }

  // 切換子選單展開
  const toggleExpand = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    )
  }

  // 檢查是否有權限
  const hasPermission = (permission?: string) => {
    if (!permission) return true
    // 暫時都返回 true，實際權限邏輯可以之後加
    return true
  }

  // 過濾可見項目
  const visibleMenuItems = menuItems.filter(
    item => !isMenuItemHidden(item.href, hiddenMenuItems) && hasPermission(item.requiredPermission)
  )

  const visiblePersonalItems = personalToolItems.filter(
    item => !isMenuItemHidden(item.href, hiddenMenuItems) && hasPermission(item.requiredPermission)
  )

  // 渲染選單項目
  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.href)

    if (hasChildren) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleExpand(item.href)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
              isActive ? 'bg-morandi-gold/10 text-morandi-gold' : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </span>
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
            />
          </button>
          {isExpanded && (
            <div className="bg-gray-50 py-1">
              {item.children!.filter(child => hasPermission(child.requiredPermission)).map(child =>
                renderMenuItem(child, true)
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleLinkClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3 transition-colors',
          isChild && 'pl-12',
          isActive
            ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* 側邊欄 */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 頂部標題 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <span className="text-lg font-bold text-morandi-gold">Venturo</span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 選單內容 */}
        <div className="h-[calc(100%-65px)] overflow-y-auto">
          {/* 主選單 */}
          <nav className="py-2">
            {visibleMenuItems.map(item => renderMenuItem(item))}
          </nav>

          {/* 分隔線 */}
          {visiblePersonalItems.length > 0 && (
            <>
              <div className="mx-4 my-2 border-t border-gray-200" />
              <div className="px-4 py-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  個人工具
                </span>
              </div>
              <nav className="pb-4">
                {visiblePersonalItems.map(item => renderMenuItem(item))}
              </nav>
            </>
          )}

          {/* 設定 */}
          <div className="mx-4 my-2 border-t border-gray-200" />
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 transition-colors',
              pathname === '/settings'
                ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <Settings className="w-5 h-5" />
            <span>設定</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
