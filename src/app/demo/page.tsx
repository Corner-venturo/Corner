'use client'

import Link from 'next/link'
import {
  Plane,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Wallet,
  Home
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Card } from '@/components/ui/card'
import { demoStats, demoTours, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

export default function DemoDashboard() {
  const stats = demoStats

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="首頁"
        icon={Home}
        breadcrumb={[{ label: '首頁', href: '/demo' }]}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
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
            color="gold"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Departures */}
          <Card className="lg:col-span-2 shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-morandi-gold" />
                <h2 className="font-semibold text-morandi-primary">即將出團</h2>
              </div>
              <Link href="/demo/tours" className="text-sm text-morandi-gold hover:text-morandi-gold-hover flex items-center gap-1">
                查看全部 <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {stats.upcomingDepartures.map((tour, index) => (
                <div key={index} className="px-5 py-4 flex items-center justify-between hover:bg-morandi-container/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-morandi-gold/10 rounded-lg flex items-center justify-center">
                      <Plane size={18} className="text-morandi-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-morandi-primary">{tour.tour_name}</p>
                      <p className="text-sm text-morandi-secondary">{tour.tour_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-morandi-primary">{tour.date}</p>
                    <p className="text-sm text-morandi-secondary">{tour.pax} 人</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Payments */}
          <Card className="shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-morandi-red" />
                <h2 className="font-semibold text-morandi-primary">待收款項</h2>
              </div>
              <span className="text-xs bg-morandi-red/10 text-morandi-red px-2 py-1 rounded-full">
                {stats.pendingPayments.length} 筆
              </span>
            </div>
            <div className="divide-y divide-border">
              {stats.pendingPayments.slice(0, 5).map((payment, index) => (
                <div key={index} className="px-5 py-3 flex items-center justify-between hover:bg-morandi-container/30 transition-colors">
                  <div>
                    <p className="font-medium text-morandi-primary text-sm">{payment.customer}</p>
                    <p className="text-xs text-morandi-secondary">{payment.order_number}</p>
                  </div>
                  <p className="font-semibold text-morandi-red text-sm">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border bg-morandi-container/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-morandi-secondary">待收總額</span>
                <span className="font-bold text-morandi-red">
                  {formatCurrency(stats.pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Tours */}
        <Card className="shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-morandi-blue" />
              <h2 className="font-semibold text-morandi-primary">行程一覽</h2>
            </div>
            <Link href="/demo/tours" className="text-sm text-morandi-gold hover:text-morandi-gold-hover flex items-center gap-1">
              管理行程 <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-morandi-container/30 border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-morandi-secondary uppercase">行程</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-morandi-secondary uppercase">目的地</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-morandi-secondary uppercase">出發日期</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-morandi-secondary uppercase">報名人數</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-morandi-secondary uppercase">狀態</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-morandi-secondary uppercase">團費</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoTours.slice(0, 5).map((tour) => {
                  const status = getStatusDisplay(tour.status)
                  return (
                    <tr key={tour.id} className="hover:bg-morandi-container/30 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-morandi-primary">{tour.tour_name}</p>
                          <p className="text-sm text-morandi-secondary">{tour.tour_code}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-morandi-primary">{tour.destination}</td>
                      <td className="px-5 py-4 text-sm text-morandi-primary">{tour.start_date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-morandi-container rounded-full overflow-hidden">
                            <div
                              className="h-full bg-morandi-gold rounded-full"
                              style={{ width: `${(tour.enrolled / tour.capacity) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-morandi-secondary">{tour.enrolled}/{tour.capacity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-morandi-primary">
                        {formatCurrency(tour.price)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            href="/demo/tours"
            icon={Plane}
            label="新增行程"
            color="gold"
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
  color: 'green' | 'blue' | 'purple' | 'gold'
}) {
  const colorMap = {
    green: 'bg-morandi-green/10 text-morandi-green',
    blue: 'bg-morandi-blue/10 text-morandi-blue',
    purple: 'bg-purple-100 text-purple-600',
    gold: 'bg-morandi-gold/10 text-morandi-gold'
  }

  const iconBgMap = {
    green: 'bg-morandi-green',
    blue: 'bg-morandi-blue',
    purple: 'bg-purple-500',
    gold: 'bg-morandi-gold'
  }

  return (
    <Card className="p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-morandi-secondary">{title}</p>
          <p className="text-2xl font-bold text-morandi-primary mt-1">{value}</p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${colorMap[color]}`}>
            <TrendingUp size={12} />
            {change}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBgMap[color]} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </Card>
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
  color: 'gold' | 'blue' | 'purple' | 'green'
}) {
  const colorMap = {
    gold: 'bg-morandi-gold/10 hover:bg-morandi-gold/20 text-morandi-gold border-morandi-gold/20',
    blue: 'bg-morandi-blue/10 hover:bg-morandi-blue/20 text-morandi-blue border-morandi-blue/20',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200',
    green: 'bg-morandi-green/10 hover:bg-morandi-green/20 text-morandi-green border-morandi-green/20'
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
