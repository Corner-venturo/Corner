'use client'

import { useState } from 'react'
import {
  ShoppingCart,
  Search,
  Plus,
  Calendar,
  User,
  Phone,
  CreditCard,
  Eye,
  Edit,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Filter
} from 'lucide-react'
import { demoOrders, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

export default function DemoOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = demoOrders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.tour_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = demoOrders.reduce((sum, o) => sum + o.paid_amount, 0)
  const totalPending = demoOrders.reduce((sum, o) => sum + (o.total_amount - o.paid_amount), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-500" />
            訂單管理
          </h1>
          <p className="text-slate-500 mt-1">管理所有客戶訂單</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={18} />
          新增訂單
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">總訂單</p>
              <p className="text-xl font-bold text-slate-800">{demoOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已收款</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">待收款</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">總人數</p>
              <p className="text-xl font-bold text-purple-600">{demoOrders.reduce((sum, o) => sum + o.pax, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋訂單編號、客戶名稱、行程..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option value="all">全部狀態</option>
            <option value="pending">待確認</option>
            <option value="confirmed">已確認</option>
            <option value="paid">已付清</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">訂單編號</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">客戶</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">行程</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase">人數</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">訂單金額</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">已付金額</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase">狀態</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const status = getStatusDisplay(order.status)
              const paymentProgress = (order.paid_amount / order.total_amount) * 100
              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-800 font-mono">{order.order_number}</p>
                      <p className="text-xs text-slate-400">{order.created_at}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                        {order.customer_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{order.customer_name}</p>
                        <p className="text-xs text-slate-400">{order.customer_phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-slate-700">{order.tour_name}</p>
                      <p className="text-xs text-slate-400">{order.tour_code} | {order.departure_date}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-sm font-medium">
                      {order.pax} 人
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-slate-800">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="space-y-1">
                      <p className={`font-medium ${paymentProgress >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                        {formatCurrency(order.paid_amount)}
                      </p>
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-auto">
                        <div
                          className={`h-full rounded-full ${paymentProgress >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700">
                        <CreditCard size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
