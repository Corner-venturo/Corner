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
  Plane,
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
        href: '/finance/vouchers',
        label: '會計傳票',
        icon: FileText,
        requiredPermission: 'vouchers',
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
    href: '/confirmations',
    label: '確認單管理',
    icon: CircleDot,
    requiredPermission: 'confirmations',
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
        href: '/database/attractions',
        label: '景點管理',
        icon: MapPin,
        requiredPermission: 'database',
      },
      {
        href: '/database/transportation-rates',
        label: '車資管理',
        icon: Bus,
        requiredPermission: 'database',
      },
      {
        href: '/database/suppliers',
        label: '供應商管理',
        icon: Building2,
        requiredPermission: 'database',
      },
      {
        href: '/database/company-assets',
        label: '公司資源管理',
        icon: ImageIcon,
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
  {
    href: '/esims',
    label: '網卡管理',
    icon: Wifi,
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
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, user } = useAuthStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [clickedItem, setClickedItem] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const sidebarRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        clickedItem &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        sidebarRef.current &&
        !sidebarRef.current.contains(target)
      ) {
        setClickedItem(null)
        setHoveredItem(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [clickedItem])

  const handleMouseEnter = (item: MenuItem, element: HTMLElement) => {
    // 如果已經有點擊固定的項目，不要用 hover 覆蓋它
    if (clickedItem) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Hover 預覽：側邊欄展開或 hover 時才顯示
    if (item.children && (isSidebarHovered || !sidebarCollapsed)) {
      const rect = element.getBoundingClientRect()
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 10,
      })
      setHoveredItem(item.href)
    }
  }

  const handleMouseLeave = () => {
    // 如果已經有點擊固定的項目，不要關閉下拉選單
    if (clickedItem) return

    timeoutRef.current = setTimeout(() => {
      if (!isDropdownHovered) {
        setHoveredItem(null)
      }
    }, 150) // 增加延遲時間，讓滑鼠有足夠時間移到子選單
  }

  const handleClick = (item: MenuItem, element: HTMLElement) => {
    if (!item.children) return

    // 如果點擊的是同一個項目，關閉下拉選單
    if (clickedItem === item.href) {
      setClickedItem(null)
      setHoveredItem(null)
      return
    }

    // 計算下拉選單位置
    const rect = element.getBoundingClientRect()
    setDropdownPosition({
      top: rect.top,
      left: rect.right + 10,
    })

    // 固定展開
    setClickedItem(item.href)
    setHoveredItem(item.href)
  }

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsDropdownHovered(true)
  }

  const handleDropdownMouseLeave = () => {
    setIsDropdownHovered(false)

    // 如果是點擊固定的項目，不要關閉
    if (clickedItem) return

    // 延遲關閉，讓使用者有機會移回側邊欄
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null)
      // 同時收起側邊欄（如果是摺疊模式）
      if (sidebarCollapsed) {
        setIsSidebarHovered(false)
      }
    }, 150)
  }

  const is_active = (href: string) => {
    if (!mounted) return false // 避免 hydration error
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const getActiveDropdownItem = () => {
    // 優先顯示點擊固定的項目，其次是 hover 的項目
    const activeHref = clickedItem || hoveredItem
    if (!activeHref) return null
    return menuItems.find(item => item.href === activeHref) || null
  }

  const getActiveDropdownChildren = () => {
    const item = getActiveDropdownItem()
    return item?.children || []
  }

  // 提取需要的屬性，避免 user 物件變化時不必要的重新渲染
  const userPermissions = user?.permissions || []
  const userRoles = user?.roles || []
  const hiddenMenuItems = user?.hidden_menu_items || []
  const preferredFeatures = user?.preferred_features || []

  // 檢查是否為超級管理員
  // 支援：permissions 包含 'super_admin', 'admin', '*' 或 roles 包含 'super_admin'
  const isSuperAdmin =
    userPermissions.includes('super_admin') ||
    userPermissions.includes('admin') ||
    userPermissions.includes('*') ||
    userRoles.includes('super_admin')

  // 使用 useMemo 優化權限過濾和個人化隱藏
  const visibleMenuItems = useMemo(() => {
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) {
        return items.filter(item => !item.requiredPermission)
      }

      return items
        .map(item => {
          // 檢查是否被使用者隱藏
          if (isMenuItemHidden(item.href, hiddenMenuItems)) {
            return null
          }

          // ⭐ 檢查是否在常用功能列表中
          // 超級管理員不受 preferred_features 限制
          // 如果使用者有設定 preferred_features，且該功能不在列表中，則隱藏
          if (!isSuperAdmin && preferredFeatures.length > 0 && item.requiredPermission) {
            if (!preferredFeatures.includes(item.requiredPermission)) {
              return null
            }
          }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isSuperAdmin, JSON.stringify(preferredFeatures), JSON.stringify(hiddenMenuItems), JSON.stringify(userPermissions)])

  const visiblePersonalToolItems = useMemo(() => {
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) {
        return items.filter(item => !item.requiredPermission)
      }

      return items
        .map(item => {
          // 檢查是否被使用者隱藏
          if (isMenuItemHidden(item.href, hiddenMenuItems)) {
            return null
          }

          if (!item.requiredPermission) return item
          if (isSuperAdmin) return item
          return userPermissions.includes(item.requiredPermission) ? item : null
        })
        .filter((item): item is MenuItem => item !== null)
    }

    return filterMenuByPermissions(personalToolItems)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isSuperAdmin, JSON.stringify(hiddenMenuItems), JSON.stringify(userPermissions)])

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
          // 如果有點擊固定的項目，不要收起
          if (clickedItem) return

          // 延遲收起，讓使用者有機會移到子選單
          timeoutRef.current = setTimeout(() => {
            if (!isDropdownHovered) {
              setIsSidebarHovered(false)
              setHoveredItem(null)
            }
          }, 150)
        }}
        className={cn(
          'fixed left-0 top-0 h-screen bg-morandi-container border-r border-border z-30 group transition-[width] duration-300 flex flex-col',
          'hidden lg:flex',
          sidebarCollapsed
            ? isSidebarHovered || isDropdownHovered
              ? 'w-[170px]'
              : 'w-16'
            : 'w-[170px]'
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
          <ul className="space-y-px">
            {visibleMenuItems.map(item => (
              <li key={item.href}>
                {item.children ? (
                  // 有子選單的項目
                  <div
                    className={cn(
                      'w-full relative h-9 text-xs text-morandi-secondary transition-all duration-200 cursor-pointer',
                      'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                      (is_active(item.href) || clickedItem === item.href) &&
                        'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold'
                    )}
                    onMouseEnter={e => handleMouseEnter(item, e.currentTarget)}
                    onMouseLeave={handleMouseLeave}
                    onClick={e => handleClick(item, e.currentTarget)}
                  >
                    <item.icon
                      size={18}
                      className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                    <span
                      className={cn(
                        'ml-[58px] block text-left leading-9 transition-opacity duration-300',
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
                        className={cn(
                          'absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300',
                          clickedItem === item.href && 'rotate-90'
                        )}
                      />
                    )}
                  </div>
                ) : (
                  // 沒有子選單的項目
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      'w-full relative block h-9 text-xs text-morandi-secondary transition-all duration-200',
                      'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                      is_active(item.href) &&
                        'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold shadow-sm'
                    )}
                  >
                    <item.icon
                      size={18}
                      className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                    <span
                      className={cn(
                        'ml-[58px] block text-left leading-9 transition-opacity duration-300',
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

          <ul className="space-y-px">
            {/* 個人工具選單 */}
            {visiblePersonalToolItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    'w-full relative block h-9 text-xs text-morandi-secondary transition-all duration-200',
                    'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                    is_active(item.href) &&
                      'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold shadow-sm'
                  )}
                >
                  <item.icon
                    size={18}
                    className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                  <span
                    className={cn(
                      'ml-[58px] block text-left leading-9 transition-opacity duration-300',
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
                  'w-full relative block h-9 text-xs text-morandi-secondary transition-all duration-200',
                  'hover:bg-morandi-gold/5 hover:text-morandi-gold hover:border-l-3 hover:border-morandi-gold hover:shadow-sm',
                  mounted &&
                    pathname === '/settings' &&
                    'bg-morandi-gold/10 text-morandi-gold border-l-3 border-morandi-gold shadow-sm'
                )}
              >
                <Settings
                  size={18}
                  className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <span
                  className={cn(
                    'ml-[58px] block text-left leading-9 transition-opacity duration-300',
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

          </ul>
        </div>
      </div>

      {/* 懸浮下拉選單 */}
      {(hoveredItem || clickedItem) && getActiveDropdownChildren().length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-card border border-border rounded-lg shadow-lg py-2 min-w-48 z-40"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {getActiveDropdownChildren().map(child => (
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
              onClick={() => {
                // 點擊子項目後關閉下拉選單
                setClickedItem(null)
                setHoveredItem(null)
              }}
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
