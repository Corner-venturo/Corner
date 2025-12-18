'use client'

import Link from 'next/link'
import {
  Plane,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Wallet
} from 'lucide-react'
import { demoStats, demoTours, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

export default function DemoDashboard() {
  const stats = demoStats

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">儀表板</h1>
        <p className="text-slate-500 mt-1">歡迎使用 Venturo 旅遊團管理系統</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本月營收"
          value={formatCurrency(stats.monthly.revenue)}
          change="+12.5%"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="本月訂單"
          value={stats.monthly.orders.toString()}
          change="+8 筆"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="新增客戶"
          value={stats.monthly.newCustomers.toString()}
          change="+3 位"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="已出團數"
          value={stats.monthly.departedTours.toString()}
          change="本月"
          icon={Plane}
          color="amber"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Departures */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-amber-500" />
              <h2 className="font-semibold text-slate-800">即將出團</h2>
            </div>
            <Link href="/demo/tours" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              查看全部 <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.upcomingDepartures.map((tour, index) => (
              <div key={index} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                    <Plane size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{tour.tour_name}</p>
                    <p className="text-sm text-slate-500">{tour.tour_code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{tour.date}</p>
                  <p className="text-sm text-slate-500">{tour.pax} 人</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-red-500" />
              <h2 className="font-semibold text-slate-800">待收款項</h2>
            </div>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {stats.pendingPayments.length} 筆
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.pendingPayments.slice(0, 5).map((payment, index) => (
              <div key={index} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{payment.customer}</p>
                  <p className="text-xs text-slate-400">{payment.order_number}</p>
                </div>
                <p className="font-semibold text-red-600 text-sm">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">待收總額</span>
              <span className="font-bold text-red-600">
                {formatCurrency(stats.pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tours */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            <h2 className="font-semibold text-slate-800">行程一覽</h2>
          </div>
          <Link href="/demo/tours" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
            管理行程 <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">行程</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">目的地</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">出發日期</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">報名人數</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">狀態</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">團費</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demoTours.slice(0, 5).map((tour) => {
                const status = getStatusDisplay(tour.status)
                return (
                  <tr key={tour.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{tour.tour_name}</p>
                        <p className="text-sm text-slate-500">{tour.tour_code}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{tour.destination}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{tour.start_date}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                            style={{ width: `${(tour.enrolled / tour.capacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600">{tour.enrolled}/{tour.capacity}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      {formatCurrency(tour.price)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction
          href="/demo/tours"
          icon={Plane}
          label="新增行程"
          color="amber"
        />
        <QuickAction
          href="/demo/orders"
          icon={ShoppingCart}
          label="建立訂單"
          color="blue"
        />
        <QuickAction
          href="/demo/customers"
          icon={Users}
          label="新增客戶"
          color="purple"
        />
        <QuickAction
          href="/demo/calendar"
          icon={Calendar}
          label="查看行事曆"
          color="green"
        />
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color
}: {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: 'green' | 'blue' | 'purple' | 'amber'
}) {
  const colorMap = {
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-indigo-500',
    purple: 'from-purple-500 to-violet-500',
    amber: 'from-amber-500 to-orange-500'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            {change}
          </p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

// Quick Action Component
function QuickAction({
  href,
  icon: Icon,
  label,
  color
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: 'amber' | 'blue' | 'purple' | 'green'
}) {
  const colorMap = {
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
  }

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${colorMap[color]}`}
    >
      <Icon size={24} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
