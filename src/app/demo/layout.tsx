'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Plane,
  ShoppingCart,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: '儀表板', icon: LayoutDashboard, href: '/demo' },
  { id: 'tours', label: '行程管理', icon: Plane, href: '/demo/tours' },
  { id: 'orders', label: '訂單管理', icon: ShoppingCart, href: '/demo/orders' },
  { id: 'customers', label: '客戶管理', icon: Users, href: '/demo/customers' },
  { id: 'finance', label: '財務管理', icon: DollarSign, href: '/demo/finance' },
  { id: 'calendar', label: '行事曆', icon: Calendar, href: '/demo/calendar' },
  { id: 'itinerary', label: '行程表預覽', icon: FileText, href: '/demo/itinerary' },
]

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm`}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Plane size={18} className="text-white" />
                </div>
                <span className="font-bold text-slate-800">Venturo</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/demo' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-amber-600' : ''} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={16} className="text-amber-400" />}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t border-slate-100">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3">
                <p className="text-xs text-slate-500 text-center">
                  Venturo 旅遊團管理系統
                </p>
                <p className="text-xs text-slate-400 text-center mt-1">
                  Demo v1.0
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
