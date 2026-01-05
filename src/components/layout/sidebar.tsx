'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronRight,
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
  FileSignature,
  FileText,
  CircleDot,
  Wifi,
  ImageIcon,
  Bus,
  CheckSquare,
  ClipboardList,
  MessageCircle,
  Archive,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { isMenuItemHidden } from '@/constants/menu-items'
import { isFeatureAvailable, RestrictedFeature } from '@/lib/feature-restrictions'

interface MenuItem {
  href: string
  label: string
  icon: React.ElementType
  children?: MenuItem[]
  requiredPermission?: string
  restrictedFeature?: RestrictedFeature // 受限功能（非 TP/TC 不可見）
}

const menuItems: MenuItem[] = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/calendar', label: '行事曆', icon: Calendar, requiredPermission: 'calendar' },
  { href: '/workspace', label: '工作空間', icon: Building2, requiredPermission: 'workspace' },
  // 旅伴通訊已整合到工作頻道中，此路由暫時隱藏
  // { href: '/traveler-chat', label: '旅伴通訊', icon: MessageCircle, requiredPermission: 'workspace' },
  { href: '/todos', label: '待辦事項', icon: CheckSquare, requiredPermission: 'todos' },
  { href: '/itinerary', label: '行程管理', icon: Flag, requiredPermission: 'itinerary' },
  { href: '/tours', label: '旅遊團', icon: MapPin, requiredPermission: 'tours' },
  { href: '/tour-requests', label: '需求確認單', icon: ClipboardList, requiredPermission: 'tours' },
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
      { href: '/erp-accounting/vouchers', label: '會計傳票', icon: FileText, requiredPermission: 'vouchers' },
      { href: '/finance/travel-invoice', label: '代轉發票', icon: FileText, requiredPermission: 'travel_invoice', restrictedFeature: 'travel_invoices' },
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
      { href: '/database/attractions', label: '旅遊資料庫', icon: MapPin, requiredPermission: 'database' },
      { href: '/database/transportation-rates', label: '車資管理', icon: Bus, requiredPermission: 'database' },
      { href: '/database/suppliers', label: '供應商管理', icon: Building2, requiredPermission: 'database' },
      { href: '/database/tour-leaders', label: '領隊資料', icon: Users, requiredPermission: 'database' },
      { href: '/database/company-assets', label: '公司資源管理', icon: ImageIcon, requiredPermission: 'database' },
      { href: '/database/archive-management', label: '封存管理', icon: Archive, requiredPermission: 'database' },
    ],
  },
  { href: '/hr', label: '人資管理', icon: UserCog, requiredPermission: 'hr' },
  { href: '/esims', label: '網卡管理', icon: Wifi, requiredPermission: 'hr', restrictedFeature: 'esim' },
]

const personalToolItems: MenuItem[] = [
  { href: '/accounting', label: '記帳管理', icon: Wallet, requiredPermission: 'accounting' },
  { href: '/timebox', label: '箱型時間', icon: Clock, requiredPermission: 'timebox' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // 切換側邊欄展開/收起
  const toggleSidebar = () => {
    setIsExpanded(prev => !prev)
    // 收起時也收起所有子選單
    if (isExpanded) {
      setExpandedMenus([])
    }
  }

  // 關閉側邊欄（跳轉時使用）
  const closeSidebar = () => {
    setIsExpanded(false)
    setExpandedMenus([])
  }

  // 切換子選單展開/收起
  const toggleSubmenu = (href: string) => {
    // 如果側邊欄是收起的，先展開側邊欄再展開子選單
    if (!isExpanded) {
      setIsExpanded(true)
      setExpandedMenus([href])
      return
    }
    setExpandedMenus(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    )
  }

  const is_active = (href: string) => {
    if (!mounted) return false
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // 權限過濾
  const userPermissions = user?.permissions || []
  const userRoles = user?.roles || []
  const hiddenMenuItems = user?.hidden_menu_items || []
  const preferredFeatures = user?.preferred_features || []

  const isSuperAdmin =
    userPermissions.includes('super_admin') ||
    userPermissions.includes('admin') ||
    userPermissions.includes('*') ||
    userRoles.includes('super_admin')

  const visibleMenuItems = useMemo(() => {
    const workspaceCode = user?.workspace_code
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) return items.filter(item => !item.requiredPermission)

      return items
        .map(item => {
          if (isMenuItemHidden(item.href, hiddenMenuItems)) return null
          // 檢查功能限制（非 TP/TC 不可見）
          if (item.restrictedFeature && !isFeatureAvailable(item.restrictedFeature, workspaceCode)) {
            return null
          }
          if (!isSuperAdmin && preferredFeatures.length > 0 && item.requiredPermission) {
            if (!preferredFeatures.includes(item.requiredPermission)) return null
          }
          if (item.children) {
            const visibleChildren = filterMenuByPermissions(item.children)
            if (visibleChildren.length > 0 || isSuperAdmin) {
              return { ...item, children: visibleChildren }
            }
            return null
          }
          if (!item.requiredPermission) return item
          if (isSuperAdmin) return item
          return userPermissions.includes(item.requiredPermission) ? item : null
        })
        .filter((item): item is MenuItem => item !== null)
    }
    return filterMenuByPermissions(menuItems)
  }, [user?.id, user?.workspace_code, isSuperAdmin, JSON.stringify(preferredFeatures), JSON.stringify(hiddenMenuItems), JSON.stringify(userPermissions)])

  const visiblePersonalToolItems = useMemo(() => {
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) return items.filter(item => !item.requiredPermission)
      return items
        .map(item => {
          if (isMenuItemHidden(item.href, hiddenMenuItems)) return null
          if (!item.requiredPermission) return item
          if (isSuperAdmin) return item
          return userPermissions.includes(item.requiredPermission) ? item : null
        })
        .filter((item): item is MenuItem => item !== null)
    }
    return filterMenuByPermissions(personalToolItems)
  }, [user?.id, isSuperAdmin, JSON.stringify(hiddenMenuItems), JSON.stringify(userPermissions)])

  // 渲染菜單項目
  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0
    const isSubmenuExpanded = expandedMenus.includes(item.href)
    const active = is_active(item.href)

    if (hasChildren) {
      return (
        <li key={item.href}>
          {/* 父項目 */}
          <div
            className={cn(
              'w-full relative h-9 text-xs text-morandi-secondary transition-all duration-200 cursor-pointer',
              'hover:bg-morandi-gold/5 hover:text-morandi-gold',
              active && 'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold'
            )}
            onClick={() => toggleSubmenu(item.href)}
          >
            <item.icon
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2"
            />
            {isExpanded && (
              <>
                <span className="ml-12 block text-left leading-9">{item.label}</span>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSubmenuExpanded ? (
                    <ChevronDown size={14} className="text-morandi-gold" />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </div>
              </>
            )}
          </div>

          {/* 子項目 - 展開在下方 */}
          {isExpanded && isSubmenuExpanded && item.children && (
            <ul className="bg-morandi-background/30">
              {item.children.map(child => renderMenuItem(child, true))}
            </ul>
          )}
        </li>
      )
    }

    // 沒有子項目的菜單項
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          prefetch={false}
          onClick={closeSidebar}
          className={cn(
            'w-full relative block h-9 text-xs text-morandi-secondary transition-all duration-200',
            'hover:bg-morandi-gold/5 hover:text-morandi-gold',
            active && 'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold',
            isChild && 'pl-4'
          )}
        >
          <item.icon
            size={isChild ? 14 : 18}
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              isChild ? 'left-8' : 'left-5'
            )}
          />
          {isExpanded && (
            <span className={cn('block text-left leading-9', isChild ? 'ml-14' : 'ml-12')}>
              {item.label}
            </span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-morandi-container border-r-2 border-morandi-gold/20 z-30 transition-[width] duration-300 flex flex-col',
        'hidden lg:flex',
        isExpanded ? 'w-[180px]' : 'w-16'
      )}
    >
      {/* 展開/收起三角箭頭按鈕 */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 z-50 w-5 h-10 flex items-center justify-center',
          'transition-all duration-300',
          isExpanded ? 'right-0' : '-right-2.5'
        )}
        aria-label={isExpanded ? '收起側邊欄' : '展開側邊欄'}
      >
        <div
          className={cn(
            'w-0 h-0 transition-transform duration-300',
            'border-t-[10px] border-t-transparent',
            'border-b-[10px] border-b-transparent',
            isExpanded
              ? 'border-r-[10px] border-r-morandi-gold/60'
              : 'border-l-[10px] border-l-morandi-gold/60'
          )}
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          }}
        />
      </button>

      {/* Logo區域 */}
      <div className="shrink-0 border-b border-border mx-3">
        <div className="h-18 flex items-center relative">
          <div className="absolute left-5 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-morandi-gold flex items-center justify-center shadow-sm flex-shrink-0 opacity-90">
            <span className="text-white font-semibold text-lg">V</span>
          </div>
          {isExpanded && (
            <div className="ml-[58px] text-xl font-bold text-morandi-primary">
              CORNER
            </div>
          )}
        </div>
      </div>

      {/* 統一導航選單 */}
      <nav className="flex-1 py-4 overflow-y-auto min-h-0">
        <ul className="space-y-px">
          {visibleMenuItems.map(item => renderMenuItem(item))}
          {visiblePersonalToolItems.map(item => renderMenuItem(item))}

          {/* 設定 */}
          <li>
            <Link
              href="/settings"
              prefetch={false}
              onClick={closeSidebar}
              className={cn(
                'w-full relative block h-9 text-xs text-morandi-secondary transition-all duration-200',
                'hover:bg-morandi-gold/5 hover:text-morandi-gold',
                mounted && pathname === '/settings' && 'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold'
              )}
            >
              <Settings size={18} className="absolute left-5 top-1/2 -translate-y-1/2" />
              {isExpanded && (
                <span className="ml-12 block text-left leading-9">設定</span>
              )}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
