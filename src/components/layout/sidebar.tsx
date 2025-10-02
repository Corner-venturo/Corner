'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
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
  Receipt,
  FileText,
  BarChart3,
  Calendar,
  TrendingDown,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useOfflineSync } from '@/lib/offline/sync-manager';
import { Wifi, WifiOff } from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
  requiredPermission?: string;
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
    href: '/todos',
    label: '待辦事項',
    icon: CheckSquare,
    requiredPermission: 'todos',
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
    href: '/visas',
    label: '簽證管理',
    icon: FileCheck,
    requiredPermission: 'visas',
  },
  {
    href: '/finance',
    label: '財務系統',
    icon: CreditCard,
    requiredPermission: 'finance',
    children: [
      { href: '/finance/payments', label: '收款管理', icon: CreditCard, requiredPermission: 'payments' },
      { href: '/finance/requests', label: '請款管理', icon: TrendingDown, requiredPermission: 'requests' },
      { href: '/finance/treasury', label: '出納管理', icon: Wallet, requiredPermission: 'disbursement' },
      { href: '/finance/reports', label: '報表管理', icon: BarChart3, requiredPermission: 'reports' },
    ]
  },
  {
    href: '/database',
    label: '資料管理',
    icon: Database,
    requiredPermission: 'database',
    children: [
      { href: '/customers', label: '顧客管理', icon: Users, requiredPermission: 'customers' },
      { href: '/database/regions', label: '地區管理', icon: MapPin, requiredPermission: 'database' },
      { href: '/database/transport', label: '交通選項', icon: ShoppingCart, requiredPermission: 'database' },
      { href: '/database/activities', label: '活動門票', icon: CheckSquare, requiredPermission: 'database' },
      { href: '/database/pricing', label: '價格管理', icon: Calculator, requiredPermission: 'database' },
      { href: '/database/suppliers', label: '供應商管理', icon: Building2, requiredPermission: 'database' },
    ]
  },
  {
    href: '/hr',
    label: '人資管理',
    icon: UserCog,
    requiredPermission: 'hr',
  },
  {
    href: '/guide',
    label: '系統說明',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, user, logout } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSyncTooltip, setShowSyncTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isOnline, hasPendingChanges, pendingCount } = useOfflineSync();

  // 確保組件已掛載
  useEffect(() => {
    setMounted(true);
  }, []);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (item: MenuItem, element: HTMLElement) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (item.children) {
      const rect = element.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: sidebarCollapsed ? 64 : 180
      });
      setHoveredItem(item.href);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    setHoveredItem(null);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getHoveredItemChildren = () => {
    if (!hoveredItem) return [];
    const item = menuItems.find(item => item.href === hoveredItem);
    return item?.children || [];
  };

  // 使用 useMemo 優化權限過濾
  const visibleMenuItems = useMemo(() => {
    const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
      if (!user) {
        return items.filter(item => !item.requiredPermission);
      }

      const userPermissions = user.permissions || [];
      const isSuperAdmin = userPermissions.includes('super_admin') || userPermissions.includes('system.admin');

      return items
        .filter(item => {
          if (!item.requiredPermission) return true;
          if (isSuperAdmin) return true;
          return userPermissions.includes(item.requiredPermission);
        })
        .map(item => {
          if (item.children) {
            return {
              ...item,
              children: filterMenuByPermissions(item.children)
            };
          }
          return item;
        });
    };

    return filterMenuByPermissions(menuItems);
  }, [user]);

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 h-screen bg-morandi-container border-r border-border z-50 group',
          sidebarCollapsed
            ? 'w-16 hover:w-[180px] transition-[width] duration-300'
            : 'w-[180px]'
        )}
      >
        {/* Logo區域 */}
        <div>
          <div className="h-18 flex items-center relative mx-3">
            <div className="absolute left-5 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] flex items-center justify-center shadow-sm flex-shrink-0 opacity-90">
              <span className="text-white/95 font-semibold text-lg">V</span>
            </div>
            <div className={cn(
              "ml-12 text-xl font-bold text-morandi-primary transition-opacity duration-300",
              sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}>
              CORNER
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="absolute right-3 p-2 hover:bg-morandi-container rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
          <div style={{ marginLeft: '12px', marginRight: '12px', borderTop: '1px solid var(--border)', height: '1px' }}></div>
        </div>

        {/* 導航選單 */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => (
              <li key={item.href}>
                {item.children ? (
                  // 有子選單的項目
                  <div
                    className={cn(
                      'w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer',
                      isActive(item.href) && 'bg-morandi-container text-morandi-primary'
                    )}
                    onMouseEnter={(e) => handleMouseEnter(item, e.currentTarget)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <item.icon size={20} className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <span className={cn(
                      "ml-12 block text-left leading-10 transition-opacity duration-300",
                      sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                    )}>
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
                      'w-full relative block h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors',
                      isActive(item.href) && 'bg-morandi-container text-morandi-primary border-r-2 border-morandi-gold'
                    )}
                  >
                    <item.icon size={20} className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <span className={cn(
                      "ml-12 block text-left leading-10 transition-opacity duration-300",
                      sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 底部功能區 */}
        <div className="py-4">
          <div className="mb-4" style={{ marginLeft: '12px', marginRight: '12px', borderTop: '1px solid var(--border)', height: '1px' }}></div>
          {!sidebarCollapsed && user && (
            <div className="mb-4 mx-4 p-3 bg-morandi-container rounded-lg">
              <div className="text-sm font-medium text-morandi-primary">
                {user.chineseName}
              </div>
              <div className="text-xs text-morandi-secondary">
                {user.employeeNumber}
              </div>
            </div>
          )}

          <ul className="space-y-1">
            <li>
              <Link
                href="/settings"
                prefetch={false}
                className={cn(
                  'w-full relative block h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors',
                  pathname === '/settings' && 'bg-morandi-container text-morandi-primary border-r-2 border-morandi-gold'
                )}
              >
                <Settings size={20} className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <span className={cn(
                  "ml-12 block text-left leading-10 transition-opacity duration-300",
                  sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                )}>
                  設定
                </span>
              </Link>
            </li>

            {/* 網路狀態指示器 - 只在客戶端渲染 */}
            {mounted && (
              <li>
                <div
                  className="w-full relative block h-10 text-sm hover:bg-morandi-container transition-colors group/sync"
                  onMouseEnter={() => setShowSyncTooltip(true)}
                  onMouseLeave={() => setShowSyncTooltip(false)}
                >
                {isOnline ? (
                  <Wifi size={20} className={cn(
                    "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors",
                    hasPendingChanges ? "text-orange-500" : "text-green-500"
                  )} />
                ) : (
                  <WifiOff size={20} className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500" />
                )}
                <span className={cn(
                  "ml-12 block text-left leading-10 transition-opacity duration-300",
                  sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100",
                  isOnline ? (hasPendingChanges ? "text-orange-500" : "text-green-500") : "text-red-500"
                )}>
                  {isOnline ? (hasPendingChanges ? `${pendingCount} 待同步` : '已連線') : '離線'}
                </span>
                </div>

                {/* Hover 顯示詳細資訊 - 移到 li 外面 */}
                {showSyncTooltip && (
                  <div className="fixed left-[196px] bg-card border border-border rounded-lg shadow-lg p-3 min-w-48 z-[70]" style={{ top: `${dropdownPosition.top}px` }}>
                    <div className="flex items-center gap-2 mb-2">
                      {isOnline ? (
                        <Wifi size={16} className="text-green-500" />
                      ) : (
                        <WifiOff size={16} className="text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {isOnline ? '網路已連線' : '離線模式'}
                      </span>
                    </div>
                    {hasPendingChanges && (
                      <div className="text-xs text-morandi-secondary">
                        {pendingCount} 個變更待同步
                      </div>
                    )}
                    {!isOnline && (
                      <div className="text-xs text-morandi-secondary mt-1">
                        您的變更將在恢復連線後同步
                      </div>
                    )}
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 懸浮下拉選單 */}
      {hoveredItem && getHoveredItemChildren().length > 0 && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg py-2 min-w-48 z-[60]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left + 8,
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {getHoveredItemChildren().map((child) => (
            <Link
              key={child.href}
              href={child.href}
              prefetch={false}
              className={cn(
                'flex items-center px-4 py-2 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors',
                isActive(child.href) && 'bg-morandi-container text-morandi-primary'
              )}
            >
              <child.icon size={16} className="mr-3" />
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}