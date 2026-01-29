'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Home,
  Search,
  ClipboardList,
  LayoutGrid,
  User,
  MapPin,
  ShoppingCart,
  Users,
  CreditCard,
  FileText,
  Calendar,
  Stamp,
  FileCheck,
  Hotel,
  Truck,
  MapPinned,
  UserCheck,
  X,
  CheckCircle,
} from 'lucide-react'

// 底部導航項目
const NAV_ITEMS = [
  { id: 'home', icon: Home, label: '首頁', href: '/m' },
  { id: 'search', icon: Search, label: '搜尋', href: '/m/search' },
  { id: 'todos', icon: ClipboardList, label: '待辦', href: '/m/todos' },
  { id: 'workbench', icon: LayoutGrid, label: '工作台', href: '/m/workbench' },
  { id: 'profile', icon: User, label: '我的', href: '/m/profile' },
]

// 工作台功能分類
const WORKBENCH_CATEGORIES = [
  {
    title: '常用功能',
    items: [
      { icon: MapPin, label: '旅遊團', href: '/m/tours', color: 'text-blue-600' },
      { icon: ShoppingCart, label: '訂單', href: '/m/orders', color: 'text-green-600' },
      { icon: Users, label: '成員', href: '/m/members', color: 'text-purple-600' },
      { icon: CheckCircle, label: '報到', href: '/m/checkin', color: 'text-orange-600' },
    ],
  },
  {
    title: '財務相關',
    items: [
      { icon: CreditCard, label: '請款', href: '/m/payments', color: 'text-emerald-600' },
      { icon: FileText, label: '出納', href: '/m/treasury', color: 'text-cyan-600' },
      { icon: FileCheck, label: '收款', href: '/m/receipts', color: 'text-teal-600' },
    ],
  },
  {
    title: '行政作業',
    items: [
      { icon: Calendar, label: '行事曆', href: '/calendar', color: 'text-red-600' },
      { icon: Stamp, label: '簽證', href: '/m/visas', color: 'text-amber-600' },
      { icon: FileCheck, label: '確認單', href: '/m/confirmations', color: 'text-indigo-600' },
      // 旅伴通訊已整合到工作頻道中
      // { icon: MessageCircle, label: '通訊', href: '/traveler-chat', color: 'text-pink-600' },
    ],
  },
  {
    title: '資料庫',
    items: [
      { icon: Hotel, label: '飯店', href: '/database/hotels', color: 'text-violet-600' },
      { icon: Truck, label: '供應商', href: '/database/suppliers', color: 'text-slate-600' },
      { icon: MapPinned, label: '景點', href: '/database/attractions', color: 'text-lime-600' },
      { icon: UserCheck, label: '領隊', href: '/database/tour-leaders', color: 'text-rose-600' },
    ],
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const [showWorkbench, setShowWorkbench] = useState(false)

  const isActive = (href: string) => {
    if (href === '/m') return pathname === '/m'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* 底部導航欄 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            if (item.id === 'workbench') {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowWorkbench(true)}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
                    'text-morandi-secondary hover:text-morandi-primary'
                  )}
                >
                  <Icon size={22} className="stroke-[1.5]" />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </button>
              )
            }

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
                <Icon size={22} className={active ? 'stroke-[2]' : 'stroke-[1.5]'} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 工作台彈出面板 - 使用 Dialog 作為底部抽屜 */}
      <Dialog open={showWorkbench} onOpenChange={setShowWorkbench}>
        <DialogContent level={1} className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 max-w-none w-full rounded-t-2xl rounded-b-none max-h-[80vh] overflow-auto p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
          {/* 標題列 */}
          <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-morandi-primary">工作台</h2>
            <button
              onClick={() => setShowWorkbench(false)}
              className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
            >
              <X size={20} className="text-morandi-secondary" />
            </button>
          </div>

          {/* 功能分類 */}
          <div className="p-4 space-y-6">
            {WORKBENCH_CATEGORIES.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-medium text-morandi-secondary mb-3">
                  {category.title}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowWorkbench(false)}
                        className="flex flex-col items-center p-3 rounded-xl hover:bg-morandi-container/50 transition-colors"
                      >
                        <div className={cn('p-2 rounded-xl bg-morandi-container', item.color)}>
                          <Icon size={22} />
                        </div>
                        <span className="text-xs mt-2 text-morandi-primary font-medium">
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 底部安全區域 */}
          <div className="h-6" />
        </DialogContent>
      </Dialog>
    </>
  )
}
