'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  MapPin,
  ShoppingCart,
  Users,
  CheckCircle,
  CreditCard,
  FileText,
  FileCheck,
  Calendar,
  Stamp,
  MessageCircle,
  Hotel,
  Truck,
  MapPinned,
  UserCheck,
  Calculator,
  Wallet,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  {
    title: '常用功能',
    items: [
      { icon: MapPin, label: '旅遊團', href: '/m/tours', color: 'bg-blue-100 text-blue-600' },
      { icon: ShoppingCart, label: '訂單', href: '/m/orders', color: 'bg-green-100 text-green-600' },
      { icon: Users, label: '成員', href: '/m/members', color: 'bg-purple-100 text-purple-600' },
      { icon: CheckCircle, label: '報到', href: '/m/checkin', color: 'bg-orange-100 text-orange-600' },
    ],
  },
  {
    title: '財務相關',
    items: [
      { icon: CreditCard, label: '請款', href: '/m/payments', color: 'bg-emerald-100 text-emerald-600' },
      { icon: Wallet, label: '出納', href: '/m/treasury', color: 'bg-cyan-100 text-cyan-600' },
      { icon: FileCheck, label: '收款', href: '/m/receipts', color: 'bg-teal-100 text-teal-600' },
      { icon: BarChart3, label: '報表', href: '/finance/reports', color: 'bg-indigo-100 text-indigo-600' },
    ],
  },
  {
    title: '報價與合約',
    items: [
      { icon: Calculator, label: '報價單', href: '/quotes', color: 'bg-amber-100 text-amber-600' },
      { icon: FileText, label: '合約', href: '/contracts', color: 'bg-slate-100 text-slate-600' },
      { icon: FileCheck, label: '確認單', href: '/m/confirmations', color: 'bg-lime-100 text-lime-600' },
    ],
  },
  {
    title: '行政作業',
    items: [
      { icon: Calendar, label: '行事曆', href: '/calendar', color: 'bg-red-100 text-red-600' },
      { icon: Stamp, label: '簽證', href: '/m/visas', color: 'bg-yellow-100 text-yellow-600' },
      // 旅伴通訊已整合到工作頻道中
      // { icon: MessageCircle, label: '通訊', href: '/traveler-chat', color: 'bg-pink-100 text-pink-600' },
    ],
  },
  {
    title: '資料庫',
    items: [
      { icon: Hotel, label: '飯店', href: '/database/hotels', color: 'bg-violet-100 text-violet-600' },
      { icon: Truck, label: '供應商', href: '/database/suppliers', color: 'bg-morandi-container text-morandi-secondary' },
      { icon: MapPinned, label: '景點', href: '/database/attractions', color: 'bg-green-100 text-green-600' },
      { icon: UserCheck, label: '領隊', href: '/database/tour-leaders', color: 'bg-rose-100 text-rose-600' },
    ],
  },
]

export default function MobileWorkbenchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/m"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-morandi-container transition-colors -ml-2"
          >
            <ArrowLeft size={20} className="text-morandi-primary" />
          </Link>
          <h1 className="text-lg font-bold text-morandi-primary">工作台</h1>
        </div>
      </div>

      {/* 功能分類 */}
      <div className="p-4 space-y-6">
        {CATEGORIES.map((category) => (
          <section key={category.title}>
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
                    className="flex flex-col items-center p-3 rounded-xl bg-card border border-border
                               hover:border-morandi-gold/50 hover:shadow-sm transition-all"
                  >
                    <div className={cn('p-2.5 rounded-xl', item.color)}>
                      <Icon size={22} />
                    </div>
                    <span className="text-xs mt-2 text-morandi-primary font-medium text-center">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 切換到桌面版 */}
      <div className="p-4 mt-4">
        <Link
          href="/"
          className="block w-full py-3 text-center text-sm text-morandi-secondary
                     bg-morandi-container/50 rounded-xl hover:bg-morandi-container transition-colors"
        >
          切換到桌面版
        </Link>
      </div>
    </div>
  )
}
