'use client'

import { useState } from 'react'
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Eye,
  Edit,
  Star,
  Crown,
  Award
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { demoCustomers, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

export default function DemoCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [vipFilter, setVipFilter] = useState<string>('all')

  const filteredCustomers = demoCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          customer.english_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          customer.phone.includes(searchQuery)
    const matchesVip = vipFilter === 'all' || customer.vip_level === vipFilter
    return matchesSearch && matchesVip
  })

  const totalSpent = demoCustomers.reduce((sum, c) => sum + c.total_spent, 0)
  const totalOrders = demoCustomers.reduce((sum, c) => sum + c.total_orders, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-purple-500" />
            客戶管理
          </h1>
          <p className="text-slate-500 mt-1">管理所有客戶資料</p>
        </div>
        <button className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={18} />
          新增客戶
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">總客戶數</p>
              <p className="text-xl font-bold text-slate-800">{demoCustomers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Crown size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">VIP 客戶</p>
              <p className="text-xl font-bold text-amber-600">
                {demoCustomers.filter(c => c.vip_level !== 'normal').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">總消費額</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">總訂單數</p>
              <p className="text-xl font-bold text-blue-600">{totalOrders}</p>
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
              placeholder="搜尋客戶姓名、英文名、電話..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <Select value={vipFilter} onValueChange={setVipFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部等級" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等級</SelectItem>
              <SelectItem value="platinum">白金卡</SelectItem>
              <SelectItem value="gold">金卡</SelectItem>
              <SelectItem value="silver">銀卡</SelectItem>
              <SelectItem value="normal">一般</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    </div>
  )
}

// Customer Card Component
function CustomerCard({ customer }: { customer: typeof demoCustomers[0] }) {
  const vipStatus = getStatusDisplay(customer.vip_level)

  const vipIcon = {
    platinum: <Crown size={14} className="text-purple-500" />,
    gold: <Star size={14} className="text-amber-500 fill-amber-500" />,
    silver: <Star size={14} className="text-slate-400" />,
    normal: null
  }[customer.vip_level]

  const vipGradient = {
    platinum: 'from-purple-500 to-violet-500',
    gold: 'from-amber-400 to-orange-500',
    silver: 'from-slate-400 to-slate-500',
    normal: 'from-blue-400 to-indigo-500'
  }[customer.vip_level]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${vipGradient} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
            {customer.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-800">{customer.name}</h3>
              {vipIcon}
            </div>
            <p className="text-xs text-slate-400">{customer.english_name}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vipStatus.color}`}>
          {vipStatus.label}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone size={14} className="text-slate-400" />
          {customer.phone}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Mail size={14} className="text-slate-400" />
          <span className="truncate">{customer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CreditCard size={14} className="text-slate-400" />
          {customer.passport_number}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400">訂單數</p>
          <p className="font-bold text-slate-700">{customer.total_orders} 次</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">消費總額</p>
          <p className="font-bold text-green-600">{formatCurrency(customer.total_spent)}</p>
        </div>
      </div>

      {/* Last Trip */}
      {customer.last_trip && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} />
            <span>最近出團：{customer.last_trip}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        <button className="flex-1 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Eye size={14} />
          檢視
        </button>
        <button className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1">
          <Edit size={14} />
          編輯
        </button>
      </div>
    </div>
  )
}
