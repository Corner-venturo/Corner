'use client'

import { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { demoPayments, demoStats, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

export default function DemoFinancePage() {
  const [periodFilter, setPeriodFilter] = useState<string>('month')

  const methodIcon = {
    cash: <Banknote size={16} className="text-green-500" />,
    transfer: <CreditCard size={16} className="text-blue-500" />,
    credit_card: <CreditCard size={16} className="text-purple-500" />,
    check: <Wallet size={16} className="text-amber-500" />
  }

  const methodLabel = {
    cash: '現金',
    transfer: '轉帳',
    credit_card: '信用卡',
    check: '支票'
  }

  const totalReceived = demoPayments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = demoStats.pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-green-500" />
            財務管理
          </h1>
          <p className="text-slate-500 mt-1">收款記錄與財務統計</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="本月" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本週</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季</SelectItem>
              <SelectItem value="year">今年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">已收款總額</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalReceived)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-100 text-sm">
                <TrendingUp size={14} />
                <span>較上月 +12.5%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">待收款金額</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalPending)}</p>
              <div className="flex items-center gap-1 mt-2 text-amber-100 text-sm">
                <Clock size={14} />
                <span>{demoStats.pendingPayments.length} 筆待收</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">本月營收</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(demoStats.monthly.revenue)}</p>
              <div className="flex items-center gap-1 mt-2 text-blue-100 text-sm">
                <TrendingUp size={14} />
                <span>{demoStats.monthly.orders} 筆訂單</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">年度累計</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(demoStats.yearly.revenue)}</p>
              <div className="flex items-center gap-1 mt-2 text-purple-100 text-sm">
                <TrendingUp size={14} />
                <span>{demoStats.yearly.orders} 筆訂單</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">收款記錄</h2>
            <button className="text-sm text-green-600 hover:text-green-700">查看全部</button>
          </div>
          <div className="divide-y divide-slate-100">
            {demoPayments.map((payment) => {
              const status = getStatusDisplay(payment.status)
              return (
                <div key={payment.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      {methodIcon[payment.method]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{payment.customer_name}</p>
                      <p className="text-sm text-slate-500">{payment.order_number} | {payment.note}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-slate-400">{payment.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {methodLabel[payment.method]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">待收款項</h2>
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {demoStats.pendingPayments.length} 筆
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {demoStats.pendingPayments.map((payment, index) => (
              <div key={index} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-800">{payment.customer}</p>
                  <p className="font-bold text-red-600">{formatCurrency(payment.amount)}</p>
                </div>
                <p className="text-xs text-slate-400">{payment.order_number}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-slate-100 bg-red-50/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">待收總額</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(totalPending)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">收款方式統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['cash', 'transfer', 'credit_card', 'check'] as const).map((method) => {
            const methodPayments = demoPayments.filter(p => p.method === method && p.status === 'confirmed')
            const total = methodPayments.reduce((sum, p) => sum + p.amount, 0)
            const count = methodPayments.length
            return (
              <div key={method} className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {methodIcon[method]}
                  <span className="font-medium text-slate-700">{methodLabel[method]}</span>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(total)}</p>
                <p className="text-xs text-slate-400">{count} 筆</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
