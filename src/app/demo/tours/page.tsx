'use client'

import { useState } from 'react'
import {
  Plane,
  Search,
  Filter,
  Plus,
  Calendar,
  Users,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2
} from 'lucide-react'
import { demoTours, formatCurrency, getStatusDisplay } from '@/lib/demo/demo-data'

export default function DemoToursPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredTours = demoTours.filter(tour => {
    const matchesSearch = tour.tour_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tour.tour_code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Plane className="text-amber-500" />
            行程管理
          </h1>
          <p className="text-slate-500 mt-1">管理所有旅遊行程</p>
        </div>
        <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={18} />
          新增行程
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋行程名稱或代碼..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
          >
            <option value="all">全部狀態</option>
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
            <option value="confirmed">已成團</option>
            <option value="departed">出團中</option>
            <option value="completed">已結束</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
              }`}
            >
              卡片
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
              }`}
            >
              列表
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">行程資訊</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">目的地</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">出發日期</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">報名狀況</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">狀態</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">團費</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTours.map((tour) => {
                const status = getStatusDisplay(tour.status)
                return (
                  <tr key={tour.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tour.cover_image}
                          alt={tour.tour_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-slate-800">{tour.tour_name}</p>
                          <p className="text-sm text-slate-500">{tour.tour_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        {tour.destination}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {tour.start_date}
                      </div>
                    </td>
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
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">總行程數</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{demoTours.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">已成團</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {demoTours.filter(t => t.status === 'confirmed' || t.status === 'departed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">招募中</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {demoTours.filter(t => t.status === 'published').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">總報名人數</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {demoTours.reduce((sum, t) => sum + t.enrolled, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

// Tour Card Component
function TourCard({ tour }: { tour: typeof demoTours[0] }) {
  const status = getStatusDisplay(tour.status)
  const enrollmentRate = (tour.enrolled / tour.capacity) * 100

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={tour.cover_image}
          alt={tour.tour_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status Badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>

        {/* Tour Code */}
        <span className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono">
          {tour.tour_code}
        </span>

        {/* Tour Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg leading-tight">{tour.tour_name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-white/80 text-sm">
            <MapPin size={14} />
            {tour.country}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date & Days */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar size={14} className="text-slate-400" />
            {tour.start_date}
          </div>
          <span className="text-slate-500">{tour.days} 天</span>
        </div>

        {/* Enrollment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">報名進度</span>
            <span className="text-slate-700 font-medium">{tour.enrolled}/{tour.capacity} 人</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                enrollmentRate >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                enrollmentRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                'bg-gradient-to-r from-blue-400 to-indigo-500'
              }`}
              style={{ width: `${enrollmentRate}%` }}
            />
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400">團費</span>
            <p className="font-bold text-lg text-slate-800">{formatCurrency(tour.price)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <Eye size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <Edit size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
