'use client'

/**
 * 供應商 UI 測試頁面（暫時）
 * 用假資料模擬供應商收到需求單的畫面
 * TODO: 上線後刪除此頁面
 */

import React, { useState } from 'react'
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
  Users,
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
  },
  {
    id: '4',
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
  },
  {
    id: '5',
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
]

// ============================================
// 狀態配置
// ============================================

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: '待回覆', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  responded: { label: '已回覆', variant: 'secondary', icon: <Send className="h-3 w-3" /> },
  accepted: { label: '已確認', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
}

const CATEGORY_CONFIG: Record<string, string> = {
  transport: '交通（派車）',
  guide: '領隊',
  hotel: '住宿',
  restaurant: '餐食',
  meal: '餐食',
  activity: '門票/活動',
  other: '其他',
}

// ============================================
// 回覆項目型別
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
  const [selectedRequest, setSelectedRequest] = useState<MockRequest | null>(null)
  const [responseItems, setResponseItems] = useState<ResponseItem[]>([])
  const [responseNotes, setResponseNotes] = useState('')

  const filteredRequests = MOCK_REQUESTS.filter(r => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pending') return r.response_status === 'pending'
    return r.response_status === filterStatus
  })

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
  // 回覆畫面
  // ============================================
  if (selectedRequest) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* 返回 */}
          <button
            onClick={() => setSelectedRequest(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={16} />
            返回收件匣
          </button>

          {/* 標題 */}
          <div className="flex items-center gap-3 mb-6">
            <Bus className="h-6 w-6 text-amber-600" />
            <h1 className="text-xl font-semibold text-gray-800">
              回覆需求 - {selectedRequest.tour_name}
            </h1>
          </div>

          {/* 需求資訊 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">需求詳情</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">日期：</span>
                <span className="font-medium">{selectedRequest.service_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">數量：</span>
                <span className="font-medium">{selectedRequest.quantity}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">說明：</span>
                <span className="font-medium ml-1">{selectedRequest.description}</span>
              </div>
            </div>
          </div>

          {/* 回覆欄位 */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">
                {resourceLabel}資訊 ({responseItems.length})
              </h3>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-4 w-4" />
                新增{resourceLabel}
              </Button>
            </div>

            {responseItems.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
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
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <Label className="mb-2 block">整體備註</Label>
            <Textarea
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              placeholder="有任何補充說明可以在這裡填寫..."
              rows={3}
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedRequest(null)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button
              onClick={() => {
                alert('這是測試頁面，不會真的送出！\n\n你填的資料：\n' + JSON.stringify(responseItems, null, 2))
              }}
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
  // 收件匣列表
  // ============================================
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* 標題 */}
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-6 w-6 text-amber-600" />
          <h1 className="text-xl font-semibold text-gray-800">需求收件匣</h1>
        </div>
        <p className="text-sm text-gray-400 mb-6">⚠️ 這是測試頁面，使用假資料模擬供應商收到需求單的畫面</p>

        {/* 篩選 */}
        <div className="flex gap-2 mb-4">
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
                filterStatus === tab.value ? 'bg-white/20' : 'bg-gray-100'
              )}>
                {tab.count}
              </span>
            </Button>
          ))}
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-[100px]">狀態</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-[120px]">類別</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">團名/項目</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-[120px]">服務日期</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-[80px]">數量</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-[100px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => {
                const status = STATUS_CONFIG[request.response_status] || STATUS_CONFIG.pending
                return (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <Badge variant={status.variant} className="gap-1">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {CATEGORY_CONFIG[request.category] || request.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{request.tour_name}</div>
                      <div className="text-xs text-gray-500">{request.title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{request.service_date}</td>
                    <td className="px-4 py-3 text-center font-medium">{request.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResponse(request)}
                        className={cn(
                          'h-8 w-8 p-0',
                          request.response_status === 'pending'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:bg-gray-50'
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
      </div>
    </div>
  )
}
