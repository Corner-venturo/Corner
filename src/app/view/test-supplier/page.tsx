'use client'

/**
 * 供應商 UI 測試頁面（暫時）
 * 用假資料模擬供應商收到需求單的畫面
 * TODO: 上線後刪除此頁面
 */

import React, { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ClipboardList,
  Send,
  Eye,
  Clock,
  CheckCircle2,
  Bus,
  Plus,
  Trash2,
  Save,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// 假資料
// ============================================

interface MockRequest {
  id: string
  response_status: string
  category: string
  tour_name: string
  tour_code: string
  title: string
  service_date: string
  service_date_end: string
  quantity: number
  description: string
  created_at: string
  notes?: string
}

const MOCK_REQUESTS: MockRequest[] = [
  {
    id: '1',
    response_status: 'pending',
    category: 'transport',
    tour_name: '清邁經典五日遊',
    tour_code: 'CNX250315A',
    title: '機場接機',
    service_date: '2025-03-15',
    service_date_end: '2025-03-15',
    quantity: 2,
    description: '清邁機場 → 飯店，預計 30 人，需要 2 台中巴',
    created_at: '2025-02-15T10:00:00Z',
    notes: '需報價',
  },
  {
    id: '2',
    response_status: 'pending',
    category: 'transport',
    tour_name: '清邁經典五日遊',
    tour_code: 'CNX250315A',
    title: '一日包車（清邁市區）',
    service_date: '2025-03-16',
    service_date_end: '2025-03-16',
    quantity: 2,
    description: '飯店出發 → 雙龍寺 → 古城 → 夜市 → 回飯店，全天 08:00-21:00',
    created_at: '2025-02-15T10:00:00Z',
    notes: '需報價',
  },
  {
    id: '3',
    response_status: 'pending',
    category: 'transport',
    tour_name: '清邁經典五日遊',
    tour_code: 'CNX250315A',
    title: '一日包車（清萊）',
    service_date: '2025-03-17',
    service_date_end: '2025-03-17',
    quantity: 2,
    description: '清邁 → 白廟 → 藍廟 → 黑屋 → 清邁，全天 07:00-20:00',
    created_at: '2025-02-15T10:00:00Z',
    notes: '需報價',
  },
  {
    id: '4',
    response_status: 'pending',
    category: 'meal',
    tour_name: '清邁經典五日遊',
    tour_code: 'CNX250315A',
    title: '晚餐 - 帝王餐',
    service_date: '2025-03-15',
    service_date_end: '2025-03-15',
    quantity: 30,
    description: '30 人，帝王餐體驗',
    created_at: '2025-02-15T10:00:00Z',
    notes: '只要訂位，不需報價',
  },
  {
    id: '5',
    response_status: 'pending',
    category: 'activity',
    tour_name: '清邁經典五日遊',
    tour_code: 'CNX250315A',
    title: '大象自然公園半日遊',
    service_date: '2025-03-16',
    service_date_end: '2025-03-16',
    quantity: 30,
    description: '含接送、午餐、英文導覽',
    created_at: '2025-02-15T10:00:00Z',
    notes: '需報價',
  },
  {
    id: '6',
    response_status: 'pending',
    category: 'meal',
    tour_name: '東京秘境三日遊',
    tour_code: 'TYO250320A',
    title: '午餐 - 割烹料理',
    service_date: '2025-03-20',
    service_date_end: '2025-03-20',
    quantity: 6,
    description: '6 人，需訂位，預算 ¥5,000/人',
    created_at: '2025-02-15T11:00:00Z',
    notes: '訂位＋報價',
  },
  {
    id: '7',
    response_status: 'pending',
    category: 'meal',
    tour_name: '東京秘境三日遊',
    tour_code: 'TYO250320A',
    title: '晚餐 - 燒肉店',
    service_date: '2025-03-20',
    service_date_end: '2025-03-20',
    quantity: 6,
    description: '6 人',
    created_at: '2025-02-15T11:00:00Z',
    notes: '只要訂位',
  },
  {
    id: '8',
    response_status: 'pending',
    category: 'meal',
    tour_name: '東京秘境三日遊',
    tour_code: 'TYO250320A',
    title: '午餐 - 拉麵店',
    service_date: '2025-03-21',
    service_date_end: '2025-03-21',
    quantity: 6,
    description: '6 人',
    created_at: '2025-02-15T11:00:00Z',
    notes: '只要訂位',
  },
  {
    id: '9',
    response_status: 'responded',
    category: 'transport',
    tour_name: '北海道冬季六日',
    tour_code: 'CTS250210A',
    title: '新千歲機場接機',
    service_date: '2025-02-10',
    service_date_end: '2025-02-10',
    quantity: 1,
    description: '機場 → 札幌飯店，15 人',
    created_at: '2025-02-01T09:00:00Z',
  },
  {
    id: '10',
    response_status: 'responded',
    category: 'transport',
    tour_name: '北海道冬季六日',
    tour_code: 'CTS250210A',
    title: '六日包車',
    service_date: '2025-02-10',
    service_date_end: '2025-02-15',
    quantity: 1,
    description: '札幌 → 小樽 → 富良野 → 旭川 → 札幌',
    created_at: '2025-02-01T09:00:00Z',
  },
]

// ============================================
// 配置
// ============================================

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: '待回覆', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  responded: { label: '已回覆', variant: 'secondary', icon: <Send className="h-3 w-3" /> },
  accepted: { label: '已確認', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  transport: { label: '交通', emoji: '🚌' },
  guide: { label: '領隊', emoji: '🧑‍✈️' },
  hotel: { label: '住宿', emoji: '🏨' },
  accommodation: { label: '住宿', emoji: '🏨' },
  restaurant: { label: '餐食', emoji: '🍽️' },
  meal: { label: '餐食', emoji: '🍽️' },
  activity: { label: '活動', emoji: '🎯' },
  other: { label: '其他', emoji: '📋' },
}

// ============================================
// 分組
// ============================================

interface TourGroup {
  tour_code: string
  tour_name: string
  requests: MockRequest[]
  pending_count: number
}

// ============================================
// 回覆項目
// ============================================

interface ResponseItem {
  id: string
  resource_name: string
  license_plate: string
  driver_name: string
  driver_phone: string
  unit_price: number
  notes: string
}

// ============================================
// 主頁面
// ============================================

export default function TestSupplierPage() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTourGroup, setSelectedTourGroup] = useState<TourGroup | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<MockRequest | null>(null)
  const [responseItems, setResponseItems] = useState<ResponseItem[]>([])
  const [responseNotes, setResponseNotes] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // 按團分組
  const tourGroups = useMemo(() => {
    const groups: Record<string, TourGroup> = {}
    const filtered = MOCK_REQUESTS.filter(r => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'pending') return r.response_status === 'pending'
      return r.response_status === filterStatus
    })
    for (const r of filtered) {
      if (!groups[r.tour_code]) {
        groups[r.tour_code] = {
          tour_code: r.tour_code,
          tour_name: r.tour_name,
          requests: [],
          pending_count: 0,
        }
      }
      groups[r.tour_code].requests.push(r)
      if (r.response_status === 'pending') {
        groups[r.tour_code].pending_count++
      }
    }
    return Object.values(groups)
  }, [filterStatus])

  const toggleGroup = (code: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  // 預設展開所有
  const isExpanded = (code: string) => !expandedGroups.has(code)

  const openResponse = (request: MockRequest) => {
    setSelectedRequest(request)
    const items: ResponseItem[] = []
    for (let i = 0; i < request.quantity; i++) {
      items.push({
        id: `item-${i}`,
        resource_name: '',
        license_plate: '',
        driver_name: '',
        driver_phone: '',
        unit_price: 0,
        notes: '',
      })
    }
    setResponseItems(items)
    setResponseNotes('')
  }

  const updateItem = (id: string, field: keyof ResponseItem, value: string | number) => {
    setResponseItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setResponseItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      resource_name: '',
      license_plate: '',
      driver_name: '',
      driver_phone: '',
      unit_price: 0,
      notes: '',
    }])
  }

  const removeItem = (id: string) => {
    setResponseItems(prev => prev.filter(item => item.id !== id))
  }

  const isVehicle = selectedRequest?.category === 'transport'
  const resourceLabel = isVehicle ? '車輛' : '資源'

  // ============================================
  // 單筆回覆畫面
  // ============================================
  if (selectedRequest) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <button
            onClick={() => setSelectedRequest(null)}
            className="flex items-center gap-2 text-sm text-[#8a7e72] hover:text-[#6b6159] mb-6"
          >
            <ArrowLeft size={16} />
            返回收件匣
          </button>

          <div className="flex items-center gap-3 mb-6">
            <Bus className="h-6 w-6 text-amber-600" />
            <div>
              <h1 className="text-xl font-semibold text-[#4a4540]">
                回覆需求 - {selectedRequest.title}
              </h1>
              <p className="text-sm text-[#8a7e72]">{selectedRequest.tour_code} {selectedRequest.tour_name}</p>
            </div>
          </div>

          {/* 需求資訊 */}
          <div className="bg-white rounded-xl border border-[#e8e4df] p-5 mb-6">
            <h3 className="font-medium text-[#4a4540] mb-3">需求詳情</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#8a7e72]" />
                <span className="text-[#8a7e72]">日期：</span>
                <span className="font-medium text-[#4a4540]">
                  {selectedRequest.service_date}
                  {selectedRequest.service_date_end !== selectedRequest.service_date && ` ~ ${selectedRequest.service_date_end}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#8a7e72]" />
                <span className="text-[#8a7e72]">數量：</span>
                <span className="font-medium text-[#4a4540]">{selectedRequest.quantity}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#8a7e72]">說明：</span>
                <span className="font-medium text-[#4a4540] ml-1">{selectedRequest.description}</span>
              </div>
              {selectedRequest.notes && (
                <div className="col-span-2">
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                    📌 {selectedRequest.notes}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* 回覆欄位 */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#4a4540]">
                {resourceLabel}資訊 ({responseItems.length})
              </h3>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-4 w-4" />
                新增{resourceLabel}
              </Button>
            </div>

            {responseItems.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl border border-[#e8e4df] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{resourceLabel} #{index + 1}</Badge>
                  {responseItems.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-400 hover:bg-red-50 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isVehicle ? '車輛名稱/車型' : '名稱'}</Label>
                    <Input
                      value={item.resource_name}
                      onChange={(e) => updateItem(item.id, 'resource_name', e.target.value)}
                      placeholder={isVehicle ? '例如：Toyota Coaster 中巴' : ''}
                    />
                  </div>
                  {isVehicle && (
                    <>
                      <div className="space-y-2">
                        <Label>車牌號碼</Label>
                        <Input
                          value={item.license_plate}
                          onChange={(e) => updateItem(item.id, 'license_plate', e.target.value)}
                          placeholder="例如：กข-1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>司機姓名</Label>
                        <Input
                          value={item.driver_name}
                          onChange={(e) => updateItem(item.id, 'driver_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>司機電話</Label>
                        <Input
                          value={item.driver_phone}
                          onChange={(e) => updateItem(item.id, 'driver_phone', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {!isVehicle && (
                    <>
                      <div className="space-y-2">
                        <Label>餐標（每人）</Label>
                        <Input
                          type="number"
                          value={item.unit_price || ''}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>訂位狀態</Label>
                        <Input
                          value={item.notes}
                          onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                          placeholder="已訂位 / 候補中 / 客滿建議替代"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>報價金額</Label>
                    <Input
                      type="number"
                      value={item.unit_price || ''}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>備註</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 整體備註 */}
          <div className="bg-white rounded-xl border border-[#e8e4df] p-5 mb-6">
            <Label className="mb-2 block">整體備註</Label>
            <Textarea
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              placeholder="有任何補充說明可以在這裡填寫..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedRequest(null)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button
              onClick={() => alert('這是測試頁面，不會真的送出！')}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save size={16} />
              送出回覆
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // 收件匣列表（按團分組）
  // ============================================
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* 標題 */}
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-6 w-6 text-amber-600" />
          <h1 className="text-xl font-semibold text-[#4a4540]">需求收件匣</h1>
        </div>
        <p className="text-sm text-[#b0a89e] mb-6">⚠️ 測試頁面，使用假資料模擬</p>

        {/* 篩選 */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: '全部', count: MOCK_REQUESTS.length },
            { value: 'pending', label: '待回覆', count: MOCK_REQUESTS.filter(r => r.response_status === 'pending').length },
            { value: 'responded', label: '已回覆', count: MOCK_REQUESTS.filter(r => r.response_status === 'responded').length },
          ].map(tab => (
            <Button
              key={tab.value}
              variant={filterStatus === tab.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(tab.value)}
              className={cn(
                filterStatus === tab.value && 'bg-amber-600 hover:bg-amber-700 text-white'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                filterStatus === tab.value ? 'bg-white/20' : 'bg-[#f0ece7]'
              )}>
                {tab.count}
              </span>
            </Button>
          ))}
        </div>

        {/* 按團分組 */}
        <div className="space-y-4">
          {tourGroups.map(group => (
            <div key={group.tour_code} className="bg-white rounded-xl border border-[#e8e4df] overflow-hidden">
              {/* 團標題 */}
              <button
                onClick={() => toggleGroup(group.tour_code)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#faf9f7] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded(group.tour_code)
                    ? <ChevronDown className="h-4 w-4 text-[#8a7e72]" />
                    : <ChevronRight className="h-4 w-4 text-[#8a7e72]" />
                  }
                  <div className="text-left">
                    <div className="font-semibold text-[#4a4540]">
                      {group.tour_code} {group.tour_name}
                    </div>
                    <div className="text-xs text-[#8a7e72] mt-0.5">
                      {group.requests.length} 筆需求
                    </div>
                  </div>
                </div>
                {group.pending_count > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    {group.pending_count} 筆待回覆
                  </Badge>
                )}
              </button>

              {/* 需求列表 */}
              {isExpanded(group.tour_code) && (
                <div className="border-t border-[#e8e4df]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#faf9f7]">
                        <th className="px-5 py-2.5 text-left font-medium text-[#8a7e72] w-[90px]">狀態</th>
                        <th className="px-3 py-2.5 text-left font-medium text-[#8a7e72] w-[90px]">類別</th>
                        <th className="px-3 py-2.5 text-left font-medium text-[#8a7e72] w-[120px]">日期</th>
                        <th className="px-3 py-2.5 text-left font-medium text-[#8a7e72]">項目</th>
                        <th className="px-3 py-2.5 text-center font-medium text-[#8a7e72] w-[60px]">數量</th>
                        <th className="px-3 py-2.5 text-left font-medium text-[#8a7e72] w-[140px]">備註指示</th>
                        <th className="px-3 py-2.5 text-center font-medium text-[#8a7e72] w-[70px]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.requests.map(request => {
                        const status = STATUS_CONFIG[request.response_status] || STATUS_CONFIG.pending
                        const cat = CATEGORY_CONFIG[request.category] || { label: request.category, emoji: '📋' }
                        return (
                          <tr key={request.id} className="border-t border-[#f0ece7] hover:bg-[#faf9f7]/50">
                            <td className="px-5 py-3">
                              <Badge variant={status.variant} className="gap-1 text-xs">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-[#4a4540]">
                              <span className="mr-1">{cat.emoji}</span>{cat.label}
                            </td>
                            <td className="px-3 py-3 text-[#4a4540]">
                              {request.service_date}
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-[#4a4540]">{request.title}</div>
                              <div className="text-xs text-[#8a7e72] mt-0.5 line-clamp-1">{request.description}</div>
                            </td>
                            <td className="px-3 py-3 text-center font-medium text-[#4a4540]">{request.quantity}</td>
                            <td className="px-3 py-3">
                              {request.notes && (
                                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50">
                                  {request.notes}
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openResponse(request)}
                                className={cn(
                                  'h-8 w-8 p-0',
                                  request.response_status === 'pending'
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-[#8a7e72] hover:bg-[#f0ece7]'
                                )}
                                title={request.response_status === 'pending' ? '回覆' : '查看'}
                              >
                                {request.response_status === 'pending' ? <Send size={16} /> : <Eye size={16} />}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
