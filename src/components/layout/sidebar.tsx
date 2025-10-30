'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronRight,
  Home,
  MapPin,
  ShoppingCart,
  Users,
  CreditCard,
  CheckSquare,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { SyncStatusIndicator } from './sync-status-indicator'

interface MenuItem {
  href: string
  label: string
  icon: React.ElementType
  children?: MenuItem[]
  requiredPermission?: string
}

const menuItems: MenuItem[] = [
  {
    href: '/',
    label: '首頁',
    icon: Home,
  },
  {
    href: '/calendar',
    label: '行事曆',
    icon: Calendar,
    requiredPermission: 'calendar',
  },
  {
    href: '/workspace',
    label: '工作空間',
    icon: Building2,
    requiredPermission: 'workspace',
  },
  {
    href: '/todos',
    label: '待辦事項',
    icon: CheckSquare,
    requiredPermission: 'todos',
  },
  {
    href: '/itinerary',
    label: '行程管理',
    icon: Flag,
    requiredPermission: 'business',
  },
  {
    href: '/tours',
    label: '旅遊團',
    icon: MapPin,
    requiredPermission: 'tours',
  },
  {
    href: '/orders',
    label: '訂單',
    icon: ShoppingCart,
    requiredPermission: 'orders',
  },
  {
    href: '/quotes',
    label: '報價單',
    icon: Calculator,
    requiredPermission: 'quotes',
  },
  {
    href: '/finance',
    label: '財務系統',
    icon: CreditCard,
    children: [
      {
        href: '/finance/payments',
        label: '收款管理',
        icon: CreditCard,
        requiredPermission: 'payments',
      },
      {
        href: '/finance/requests',
        label: '請款管理',
        icon: TrendingDown,
        requiredPermission: 'requests',
      },
      {
        href: '/finance/treasury',
        label: '出納管理',
        icon: Wallet,
        requiredPermission: 'disbursement',
      },
      {
        href: '/finance/travel-invoice',
        label: '代轉發票',
        icon: FileText,
        requiredPermission: 'travel_invoice',
      },
      {
        href: '/finance/reports',
        label: '報表管理',
        icon: BarChart3,
        requiredPermission: 'reports',
      },
    ],
  },
  {
    href: '/visas',
    label: '簽證管理',
    icon: FileCheck,
    requiredPermission: 'visas',
  },
  {
    href: '/contracts',
    label: '合約管理',
    icon: FileSignature,
    requiredPermission: 'contracts',
  },
  {
    href: '/database',
    label: '資料管理',
    icon: Database,
    requiredPermission: 'database',
    children: [
      { href: '/customers', label: '顧客管理', icon: Users, requiredPermission: 'customers' },
      {
        href: '/database/regions',
        label: '地區管理',
        icon: MapPin,
        requiredPermission: 'database',
      },
      {
        href: '/database/activities',
        label: '活動門票',
        icon: CheckSquare,
        requiredPermission: 'database',
      },
      {
        href: '/database/attractions',
        label: '景點管理',
        icon: MapPin,
        requiredPermission: 'database',
      },
      {
        href: '/database/suppliers',
        label: '供應商管理',
        icon: Building2,
        requiredPermission: 'database',
      },
    ],
  },
  {
    href: '/hr',
    label: '人資管理',
    icon: UserCog,
    requiredPermission: 'hr',
  },
]

// 底部個人工具選單
const personalToolItems: MenuItem[] = [
  {
    href: '/accounting',
    label: '記帳管理',
    icon: Wallet,
    requiredPermission: 'accounting',
  },
  {
    href: '/timebox',
    label: '箱型時間',
    icon: Clock,
    requiredPermission: 'timebox',
  },
  {
    href: '/manifestation',
    label: '顯化魔法',
    icon: Sparkles,
    requiredPermission: 'manifestation',
  },
  {
    href: '/heroic-summon',
    label: '英靈招喚',
    icon: CircleDot,
    requiredPermission: 'heroic-summon',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, user } = useAuthStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const sidebarRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isDropdownHovered, setIsDropdownHovered] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  // 確保組件已掛載
  useEffect(() => {
    setMounted(true)
  }, [])

  // 清理定時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = (item: MenuItem, element: HTMLElement) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 方案 B：側邊欄收起時不顯示子選單，必須先展開側邊欄
    if (item.children && (isSidebarHovered || !sidebarCollapsed)) {
      const rect = element.getBoundingClientRect()
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 10, // 直接使用元素的右邊界 + 10px 間距
      })
      setHoveredItem(item.href)
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      if (!isDropdownHovered) {
        setHoveredItem(null)
      }
    }, 100) // 縮短延遲時間
  }

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsDropdownHovered(true)
  }

  const handleDropdownMouseLeave = () => {
    setIsDropdownHovered(false)
    setHoveredItem(null)
    // 同時收起側邊欄（如果是摺疊模式）
    if (sidebarCollapsed) {
      setIsSidebarHovered(false)
    }
  }

  const is_active = (href: string) => {
    if (!mounted) return false // 避免 hydration error
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const getHoveredItemChildren = () => {
    if (!hoveredItem) return []
    const item = menuItems.find(item => item.href === hoveredItem)
    return item?.children || []
  }

  // 使用 useMemo 優化權限過濾
  const visibleMenuItems = useMemo(() => {
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) {
        return items.filter(item => !item.requiredPermission)
      }

      const userPermissions = user.permissions || []
      const isSuperAdmin = userPermissions.includes('admin') // admin 就是管理員

      return items
        .map(item => {
          // 如果有子選單，先過濾子選單
          if (item.children) {
            const visibleChildren = filterMenuByPermissions(item.children)

            // 如果有任何子項目可見，就顯示父項目
            if (visibleChildren.length > 0 || isSuperAdmin) {
              return {
                ...item,
                children: visibleChildren,
              }
            }
            // 如果沒有可見的子項目，隱藏整個父項目
            return null
          }

          // 沒有子選單的項目，檢查權限
          if (!item.requiredPermission) return item
          if (isSuperAdmin) return item
          return userPermissions.includes(item.requiredPermission) ? item : null
        })
        .filter((item): item is MenuItem => item !== null)
    }

    return filterMenuByPermissions(menuItems)
  }, [user])

  const visiblePersonalToolItems = useMemo(() => {
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) {
        return items.filter(item => !item.requiredPermission)
      }

      const userPermissions = user.permissions || []
      const isSuperAdmin = userPermissions.includes('admin')

      return items
        .map(item => {
          if (!item.requiredPermission) return item
          if (isSuperAdmin) return item
          return userPermissions.includes(item.requiredPermission) ? item : null
        })
        .filter((item): item is MenuItem => item !== null)
    }

    return filterMenuByPermissions(personalToolItems)
  }, [user])

  return (
    <>
      <div
        ref={sidebarRef}
        onMouseEnter={e => {
          // 只有當滑鼠真的在側邊欄範圍內才觸發（x < 80）
          if (e.clientX < 80) {
            setIsSidebarHovered(true)
          }
        }}
        onMouseMove={e => {
          // 動態判斷容忍範圍：展開時允許到 190px，收起時只允許到 80px
          const toleranceWidth = isSidebarHovered || hoveredItem ? 190 : 80

          // 持續檢查滑鼠位置
          if (
            e.clientX >= toleranceWidth &&
            isSidebarHovered &&
            !isDropdownHovered &&
            !hoveredItem
          ) {
            setIsSidebarHovered(false)
          } else if (e.clientX < 80 && !isSidebarHovered) {
            setIsSidebarHovered(true)
          }
        }}
        onMouseLeave={() => {
          // 只有當沒有下拉選單時才收起
          if (!hoveredItem && !isDropdownHovered) {
            setIsSidebarHovered(false)
          }
        }}
        className={cn(
          'fixed left-0 top-0 h-screen bg-morandi-container border-r border-border z-40 group transition-[width] duration-300 flex flex-col',
          sidebarCollapsed
            ? isSidebarHovered || isDropdownHovered
              ? 'w-[190px]'
              : 'w-16'
            : 'w-[190px]'
        )}
      >
        {/* Logo區域 */}
        <div className="shrink-0">
          <div className="h-18 flex items-center relative mx-3">
            <div className="absolute left-5 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-morandi-gold flex items-center justify-center shadow-sm flex-shrink-0 opacity-90">
              <span className="text-white font-semibold text-lg">V</span>
            </div>
            <div
              className={cn(
                'ml-[58px] text-xl font-bold text-morandi-primary transition-opacity duration-300',
                sidebarCollapsed
                  ? isSidebarHovered || isDropdownHovered
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                  : 'opacity-100 pointer-events-auto'
              )}
            >
              CORNER
            </div>
            {/* 移除收合按鈕，使用純 hover 控制 */}
          </div>
          <div
            style={{
              marginLeft: '12px',
              marginRight: '12px',
              borderTop: '1px solid var(--border)',
              height: '1px',
            }}
          ></div>
        </div>

        {/* 導航選單 */}
        <nav className="flex-1 py-4 overflow-y-auto min-h-0">
          <ul className="space-y-1">
            {visibleMenuItems.map(item => (
              <li key={item.href}>
                {item.children ? (
                  // 有子選單的項目
                  <div
                    className={cn(
                      'w-full relative h-10 text-sm text-morandi-secondary transition-all duration-200 cursor-pointer',
                      'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                      is_active(item.href) &&
                        'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold'
                    )}
                    onMouseEnter={e => handleMouseEnter(item, e.currentTarget)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <item.icon
                      size={20}
                      className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                    <span
                      className={cn(
                        'ml-[58px] block text-left leading-10 transition-opacity duration-300',
                        sidebarCollapsed
                          ? isSidebarHovered || isDropdownHovered
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none'
                          : 'opacity-100 pointer-events-auto'
                      )}
                    >
                      {item.label}
                    </span>
                    {!sidebarCollapsed && (
                      <ChevronRight
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300"
                      />
                    )}
                  </div>
                ) : (
                  // 沒有子選單的項目
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      'w-full relative block h-10 text-sm text-morandi-secondary transition-all duration-200',
                      'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                      is_active(item.href) &&
                        'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold shadow-sm'
                    )}
                  >
                    <item.icon
                      size={20}
                      className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                    <span
                      className={cn(
                        'ml-[58px] block text-left leading-10 transition-opacity duration-300',
                        sidebarCollapsed
                          ? isSidebarHovered || isDropdownHovered
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none'
                          : 'opacity-100 pointer-events-auto'
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 底部功能區 */}
        <div className="py-4 shrink-0">
          <div
            className="mb-4"
            style={{
              marginLeft: '12px',
              marginRight: '12px',
              borderTop: '1px solid var(--border)',
              height: '1px',
            }}
          ></div>

          {!sidebarCollapsed && user && (
            <div className="mb-4 mx-4 p-3 bg-morandi-container rounded-lg">
              <div className="text-sm font-medium text-morandi-primary">{user.display_name}</div>
              <div className="text-xs text-morandi-secondary">{user.employee_number}</div>
            </div>
          )}

          <ul className="space-y-1">
            {/* 個人工具選單 */}
            {visiblePersonalToolItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    'w-full relative block h-10 text-sm text-morandi-secondary transition-all duration-200',
                    'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                    is_active(item.href) &&
                      'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold shadow-sm'
                  )}
                >
                  <item.icon
                    size={20}
                    className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                  <span
                    className={cn(
                      'ml-[58px] block text-left leading-10 transition-opacity duration-300',
                      sidebarCollapsed
                        ? isSidebarHovered || isDropdownHovered
                          ? 'opacity-100'
                          : 'opacity-0'
                        : 'opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}

            {/* 分隔線（如果有個人工具項目的話） */}
            {visiblePersonalToolItems.length > 0 && (
              <li className="my-2">
                <div
                  style={{
                    marginLeft: '12px',
                    marginRight: '12px',
                    borderTop: '1px solid var(--border)',
                    height: '1px',
                  }}
                ></div>
              </li>
            )}

            {/* 設定 */}
            <li>
              <Link
                href="/settings"
                prefetch={false}
                className={cn(
                  'w-full relative block h-10 text-sm text-morandi-secondary transition-all duration-200',
                  'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                  mounted &&
                    pathname === '/settings' &&
                    'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold shadow-sm'
                )}
              >
                <Settings
                  size={20}
                  className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <span
                  className={cn(
                    'ml-[58px] block text-left leading-10 transition-opacity duration-300',
                    sidebarCollapsed
                      ? isSidebarHovered || isDropdownHovered
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                      : 'opacity-100 pointer-events-auto'
                  )}
                >
                  設定
                </span>
              </Link>
            </li>

            {/* 同步狀態指示器 */}
            <li>
              <SyncStatusIndicator isDropdownHovered={isSidebarHovered || isDropdownHovered} />
            </li>
          </ul>
        </div>
      </div>

      {/* 懸浮下拉選單 */}
      {hoveredItem && getHoveredItemChildren().length > 0 && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg py-2 min-w-48 z-[60]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {getHoveredItemChildren().map(child => (
            <Link
              key={child.href}
              href={child.href}
              prefetch={false}
              className={cn(
                'flex items-center px-4 py-2 text-sm text-morandi-secondary transition-all duration-200',
                'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold',
                is_active(child.href) &&
                  'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold'
              )}
            >
              <child.icon size={16} className="mr-3" />
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
