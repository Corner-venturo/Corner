'use client'

/**
 * 供應商 UI 測試頁面（暫時）
 * 模擬供應商收到整張需求單並一次回覆
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
  Save,
  Calendar,
  Users,
  Plane,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEST_SUPPLIER_LABELS } from './constants/labels'

// ============================================
// 型別
// ============================================

interface RequestItem {
  id: string
  category: string
  title: string
  service_date: string
  quantity: number
  description: string
  instruction: string // 需報價 / 只訂位 / 報價+訂位
  // 供應商回覆欄位
  reply_status: string
  reply_price: number
  reply_note: string
  // 交通專用
  vehicle_type: string
  driver_name: string
  driver_phone: string
  license_plate: string
  // 餐飲專用
  price_per_person: number
  booking_status: string
}

interface RequestSheet {
  id: string
  code: string
  tour_code: string
  tour_name: string
  departure_date: string
  pax: number
  sender_company: string
  sender_contact: string
  sender_phone: string
  status: 'pending' | 'responded' | 'accepted'
  items: RequestItem[]
  created_at: string
  total_price_mode: 'per_item' | 'package'
  package_prices: PackagePrice[]
  package_note: string
}

interface PackagePrice {
  id: string
  min_pax: number
  price_per_person: number
  note: string
}

// ============================================
// 假資料
// ============================================

const createDefaultItem = (overrides: Partial<RequestItem>): RequestItem => ({
  id: '',
  category: 'transport',
  title: '',
  service_date: '',
  quantity: 1,
  description: '',
  instruction: '需報價',
  reply_status: '',
  reply_price: 0,
  reply_note: '',
  vehicle_type: '',
  driver_name: '',
  driver_phone: '',
  license_plate: '',
  price_per_person: 0,
  booking_status: '',
  ...overrides,
})

const MOCK_SHEETS: RequestSheet[] = [
  {
    id: 'sheet-1',
    code: 'CNX250315A-RQ01',
    tour_code: 'CNX250315A',
    tour_name: '清邁經典五日遊',
    departure_date: '2025-03-15',
    pax: 30,
    sender_company: '角落旅行社',
    sender_contact: '王小明',
    sender_phone: '02-2345-6789',
    status: 'pending',
    created_at: '2025-02-15T10:00:00Z',
    total_price_mode: 'per_item',
    package_prices: [],
    package_note: '',
    items: [
      createDefaultItem({ id: 'i1', category: 'transport', title: '機場接機', service_date: '2025-03-15', quantity: 2, description: '清邁機場 → 飯店，30 人，需 2 台中巴', instruction: '需報價' }),
      createDefaultItem({ id: 'i2', category: 'transport', title: '一日包車（清邁市區）', service_date: '2025-03-16', quantity: 2, description: '飯店 → 雙龍寺 → 古城 → 夜市 → 回飯店，08:00-21:00', instruction: '需報價' }),
      createDefaultItem({ id: 'i3', category: 'transport', title: '一日包車（清萊）', service_date: '2025-03-17', quantity: 2, description: '清邁 → 白廟 → 藍廟 → 黑屋 → 清邁，07:00-20:00', instruction: '需報價' }),
      createDefaultItem({ id: 'i4', category: 'meal', title: '晚餐 - 帝王餐', service_date: '2025-03-15', quantity: 30, description: '30 人帝王餐體驗', instruction: '只要訂位，不需報價' }),
      createDefaultItem({ id: 'i5', category: 'activity', title: '大象自然公園半日遊', service_date: '2025-03-16', quantity: 30, description: '含接送、午餐、英文導覽', instruction: '需報價' }),
      createDefaultItem({ id: 'i6', category: 'meal', title: '午餐 - 河邊餐廳', service_date: '2025-03-17', quantity: 30, description: '河邊景觀餐廳', instruction: '訂位＋報價' }),
    ],
  },
  {
    id: 'sheet-2',
    code: 'TYO250320A-RQ01',
    tour_code: 'TYO250320A',
    tour_name: '東京秘境三日遊',
    departure_date: '2025-03-20',
    pax: 6,
    sender_company: '角落旅行社',
    sender_contact: '王小明',
    sender_phone: '02-2345-6789',
    status: 'pending',
    created_at: '2025-02-15T11:00:00Z',
    total_price_mode: 'package',
    package_prices: [],
    package_note: '',
    items: [
      createDefaultItem({ id: 'i7', category: 'meal', title: '午餐 - 割烹料理', service_date: '2025-03-20', quantity: 6, description: '6 人，預算 ¥5,000/人', instruction: '訂位＋報價' }),
      createDefaultItem({ id: 'i8', category: 'meal', title: '晚餐 - 燒肉店', service_date: '2025-03-20', quantity: 6, description: '6 人', instruction: '只要訂位' }),
      createDefaultItem({ id: 'i9', category: 'meal', title: '午餐 - 拉麵店', service_date: '2025-03-21', quantity: 6, description: '6 人', instruction: '只要訂位' }),
      createDefaultItem({ id: 'i10', category: 'transport', title: '三日包車', service_date: '2025-03-20', quantity: 1, description: '6 人，小車即可，含司機', instruction: '需報價' }),
    ],
  },
  {
    id: 'sheet-3',
    code: 'CTS250210A-RQ01',
    tour_code: 'CTS250210A',
    tour_name: '北海道冬季六日',
    departure_date: '2025-02-10',
    pax: 15,
    sender_company: '角落旅行社',
    sender_contact: '李大華',
    sender_phone: '02-2345-6789',
    status: 'responded',
    created_at: '2025-02-01T09:00:00Z',
    total_price_mode: 'per_item',
    package_prices: [],
    package_note: '',
    items: [
      createDefaultItem({ id: 'i11', category: 'transport', title: '機場接機', service_date: '2025-02-10', quantity: 1, description: '新千歲 → 札幌飯店，15 人', instruction: '需報價', reply_price: 45000 }),
      createDefaultItem({ id: 'i12', category: 'transport', title: '六日包車', service_date: '2025-02-10', quantity: 1, description: '札幌 → 小樽 → 富良野 → 旭川 → 札幌', instruction: '需報價', reply_price: 480000 }),
    ],
  },
]

// ============================================
// 配置
// ============================================

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待回覆', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  responded: { label: '已回覆', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  accepted: { label: '已確認', color: 'bg-green-100 text-green-700 border-green-200' },
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  transport: { label: '交通', emoji: '🚌' },
  meal: { label: '餐食', emoji: '🍽️' },
  activity: { label: '活動', emoji: '🎯' },
  accommodation: { label: '住宿', emoji: '🏨' },
  other: { label: '其他', emoji: '📋' },
}

// ============================================
// 主頁面
// ============================================

export default function TestSupplierPage() {
  const [selectedSheet, setSelectedSheet] = useState<RequestSheet | null>(null)
  const [editingItems, setEditingItems] = useState<RequestItem[]>([])
  const [priceMode, setPriceMode] = useState<'per_item' | 'package'>('per_item')
  const [packagePrices, setPackagePrices] = useState<PackagePrice[]>([])
  const [packageNote, setPackageNote] = useState('')
  const [overallNote, setOverallNote] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredSheets = MOCK_SHEETS.filter(s => {
    if (filterStatus === 'all') return true
    return s.status === filterStatus
  })

  const openSheet = (sheet: RequestSheet) => {
    setSelectedSheet(sheet)
    setEditingItems(sheet.items.map(i => ({ ...i })))
    setPriceMode(sheet.total_price_mode)
    setPackagePrices(sheet.package_prices.length > 0 ? sheet.package_prices : [
      { id: 'p1', min_pax: 3, price_per_person: 0, note: '' },
      { id: 'p2', min_pax: 6, price_per_person: 0, note: '' },
      { id: 'p3', min_pax: 10, price_per_person: 0, note: '' },
    ])
    setPackageNote(sheet.package_note)
    setOverallNote('')
  }

  const updateItemField = (itemId: string, field: keyof RequestItem, value: string | number) => {
    setEditingItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const updatePackagePrice = (id: string, field: keyof PackagePrice, value: string | number) => {
    setPackagePrices(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const addPackagePrice = () => {
    setPackagePrices(prev => [...prev, { id: `p-${Date.now()}`, min_pax: 0, price_per_person: 0, note: '' }])
  }

  const isReadOnly = selectedSheet?.status !== 'pending'

  // ============================================
  // 整張需求單回覆畫面
  // ============================================
  if (selectedSheet) {
    const totalPerItem = editingItems.reduce((sum, item) => sum + (item.reply_price || 0), 0)

    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {/* 返回 */}
          <button
            onClick={() => setSelectedSheet(null)}
            className="flex items-center gap-2 text-sm text-[#8a7e72] hover:text-[#6b6159] mb-6"
          >
            <ArrowLeft size={16} />
            {TEST_SUPPLIER_LABELS.LABEL_2180}
          </button>

          {/* 需求單標題 */}
          <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <h1 className="text-xl font-semibold text-[#4a4540]">
                    需求單 {selectedSheet.code}
                  </h1>
                  <Badge className={STATUS_CONFIG[selectedSheet.status].color}>
                    {STATUS_CONFIG[selectedSheet.status].label}
                  </Badge>
                </div>
                <p className="text-[#8a7e72] text-sm ml-8">
                  {selectedSheet.tour_code} {selectedSheet.tour_name}
                </p>
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-[#faf9f7] rounded-lg p-4">
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.SENDING_5443}</span>
                <div className="font-medium text-[#4a4540]">{selectedSheet.sender_company}</div>
              </div>
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_4863}</span>
                <div className="font-medium text-[#4a4540]">{selectedSheet.sender_contact}</div>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-[#8a7e72]" />
                <div>
                  <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_9113}</span>
                  <div className="font-medium text-[#4a4540]">{selectedSheet.departure_date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#8a7e72]" />
                <div>
                  <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_1251}</span>
                  <div className="font-medium text-[#4a4540]">{selectedSheet.pax} 人</div>
                </div>
              </div>
            </div>
          </div>

          {/* 需求項目列表 + 回覆 */}
          <div className="bg-white rounded-xl border border-[#e8e4df] overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#e8e4df]">
              <h2 className="font-semibold text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_8730}</h2>
              <p className="text-xs text-[#8a7e72] mt-1">{TEST_SUPPLIER_LABELS.LABEL_4435}</p>
            </div>

            <div className="divide-y divide-[#f0ece7]">
              {editingItems.map((item, index) => {
                const cat = CATEGORY_CONFIG[item.category] || { label: item.category, emoji: '📋' }
                const needsPrice = item.instruction.includes('報價')
                const needsBooking = item.instruction.includes('訂位')

                return (
                  <div key={item.id} className="p-5">
                    {/* 項目標題行 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.emoji}</span>
                        <div>
                          <div className="font-medium text-[#4a4540]">
                            <span className="text-[#8a7e72] text-sm mr-2">{item.service_date}</span>
                            {item.title}
                          </div>
                          <div className="text-xs text-[#8a7e72] mt-0.5">{item.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          數量：{item.quantity}
                        </Badge>
                        <Badge className={cn(
                          'text-xs',
                          item.instruction.includes('不需報價')
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          📌 {item.instruction}
                        </Badge>
                      </div>
                    </div>

                    {/* 回覆欄位 */}
                    {!isReadOnly && (
                      <div className="ml-9 bg-[#faf9f7] rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* 交通類：車型、司機、車牌 */}
                          {item.category === 'transport' && (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_3737}</Label>
                                <Input
                                  value={item.vehicle_type}
                                  onChange={(e) => updateItemField(item.id, 'vehicle_type', e.target.value)}
                                  placeholder={TEST_SUPPLIER_LABELS.LABEL_4184}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_3628}</Label>
                                <Input
                                  value={item.driver_name}
                                  onChange={(e) => updateItemField(item.id, 'driver_name', e.target.value)}
                                  placeholder={TEST_SUPPLIER_LABELS.LABEL_579}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_50}</Label>
                                <Input
                                  value={item.driver_phone}
                                  onChange={(e) => updateItemField(item.id, 'driver_phone', e.target.value)}
                                  placeholder={TEST_SUPPLIER_LABELS.LABEL_1544}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_6580}</Label>
                                <Input
                                  value={item.license_plate}
                                  onChange={(e) => updateItemField(item.id, 'license_plate', e.target.value)}
                                  placeholder={TEST_SUPPLIER_LABELS.LABEL_9596}
                                  className="h-9 text-sm"
                                />
                              </div>
                            </>
                          )}

                          {/* 餐飲類：訂位狀態、餐標 */}
                          {item.category === 'meal' && (
                            <>
                              {needsBooking && (
                                <div className="space-y-1">
                                  <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_386}</Label>
                                  <Input
                                    value={item.booking_status}
                                    onChange={(e) => updateItemField(item.id, 'booking_status', e.target.value)}
                                    placeholder={TEST_SUPPLIER_LABELS.LABEL_468}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              )}
                              {needsPrice && (
                                <div className="space-y-1">
                                  <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_8589}</Label>
                                  <Input
                                    type="number"
                                    value={item.price_per_person || ''}
                                    onChange={(e) => updateItemField(item.id, 'price_per_person', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    className="h-9 text-sm"
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {/* 活動類 */}
                          {item.category === 'activity' && needsBooking && (
                            <div className="space-y-1">
                              <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_266}</Label>
                              <Input
                                value={item.booking_status}
                                onChange={(e) => updateItemField(item.id, 'booking_status', e.target.value)}
                                placeholder={TEST_SUPPLIER_LABELS.LABEL_9901}
                                className="h-9 text-sm"
                              />
                            </div>
                          )}

                          {/* 通用：報價、備註 */}
                          {needsPrice && priceMode === 'per_item' && (
                            <div className="space-y-1">
                              <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_7411}</Label>
                              <Input
                                type="number"
                                value={item.reply_price || ''}
                                onChange={(e) => updateItemField(item.id, 'reply_price', parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="h-9 text-sm"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs">{TEST_SUPPLIER_LABELS.REMARKS}</Label>
                            <Input
                              value={item.reply_note}
                              onChange={(e) => updateItemField(item.id, 'reply_note', e.target.value)}
                              placeholder={TEST_SUPPLIER_LABELS.LABEL_6086}
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 唯讀模式：顯示已回覆的內容 */}
                    {isReadOnly && item.reply_price > 0 && (
                      <div className="ml-9 text-sm text-[#4a4540]">
                        <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_9734}</span>
                        <span className="font-medium">¥{item.reply_price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 報價模式切換 + 整包報價 */}
          {!isReadOnly && (
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-6">
              <h2 className="font-semibold text-[#4a4540] mb-4">{TEST_SUPPLIER_LABELS.LABEL_1538}</h2>

              <div className="flex gap-3 mb-4">
                <Button
                  variant={priceMode === 'per_item' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriceMode('per_item')}
                  className={cn(priceMode === 'per_item' && 'bg-amber-600 hover:bg-amber-700 text-white')}
                >
                  <ClipboardList className="h-4 w-4 mr-1" />
                  {TEST_SUPPLIER_LABELS.LABEL_8184}
                </Button>
                <Button
                  variant={priceMode === 'package' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriceMode('package')}
                  className={cn(priceMode === 'package' && 'bg-amber-600 hover:bg-amber-700 text-white')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {TEST_SUPPLIER_LABELS.LABEL_7427}
                </Button>
              </div>

              {priceMode === 'per_item' && (
                <div className="bg-[#faf9f7] rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.TOTAL_9243}</span>
                    <span className="text-xl font-semibold text-[#4a4540]">
                      ¥{totalPerItem.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {priceMode === 'package' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_723}</p>
                  {packagePrices.map((pp, idx) => (
                    <div key={pp.id} className="flex items-center gap-3 bg-[#faf9f7] rounded-lg p-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Users className="h-4 w-4 text-[#8a7e72]" />
                        <Input
                          type="number"
                          value={pp.min_pax || ''}
                          onChange={(e) => updatePackagePrice(pp.id, 'min_pax', parseInt(e.target.value) || 0)}
                          className="h-9 text-sm w-20"
                          placeholder="人數"
                        />
                        <span className="text-sm text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_9104}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_6356}</span>
                        <Input
                          type="number"
                          value={pp.price_per_person || ''}
                          onChange={(e) => updatePackagePrice(pp.id, 'price_per_person', parseInt(e.target.value) || 0)}
                          className="h-9 text-sm w-32"
                          placeholder="0"
                        />
                      </div>
                      <Input
                        value={pp.note}
                        onChange={(e) => updatePackagePrice(pp.id, 'note', e.target.value)}
                        className="h-9 text-sm flex-1"
                        placeholder="備註"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPackagePrice} className="gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {TEST_SUPPLIER_LABELS.ADD_8787}
                  </Button>
                  <div className="mt-3">
                    <Label className="text-xs">{TEST_SUPPLIER_LABELS.LABEL_52}</Label>
                    <Textarea
                      value={packageNote}
                      onChange={(e) => setPackageNote(e.target.value)}
                      placeholder={TEST_SUPPLIER_LABELS.EXAMPLE_9702}
                      rows={2}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 整體備註 */}
          {!isReadOnly && (
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 mb-6">
              <Label className="mb-2 block font-medium text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_1920}</Label>
              <Textarea
                value={overallNote}
                onChange={(e) => setOverallNote(e.target.value)}
                placeholder={TEST_SUPPLIER_LABELS.LABEL_2542}
                rows={3}
              />
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedSheet(null)} className="gap-2">
              <X size={16} />
              {isReadOnly ? '返回' : '取消'}
            </Button>
            {!isReadOnly && (
              <Button
                onClick={() => alert('這是測試頁面，不會真的送出！')}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Save size={16} />
                {TEST_SUPPLIER_LABELS.LABEL_8347}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // 收件匣
  // ============================================
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-6 w-6 text-amber-600" />
          <h1 className="text-xl font-semibold text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_6359}</h1>
        </div>
        <p className="text-sm text-[#b0a89e] mb-6">⚠️ 測試頁面，使用假資料模擬</p>

        {/* 篩選 */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: '全部', count: MOCK_SHEETS.length },
            { value: 'pending', label: '待回覆', count: MOCK_SHEETS.filter(s => s.status === 'pending').length },
            { value: 'responded', label: '已回覆', count: MOCK_SHEETS.filter(s => s.status === 'responded').length },
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

        {/* 需求單卡片 */}
        <div className="space-y-4">
          {filteredSheets.map(sheet => {
            const statusConfig = STATUS_CONFIG[sheet.status]
            const categories = [...new Set(sheet.items.map(i => i.category))]

            return (
              <div
                key={sheet.id}
                onClick={() => openSheet(sheet)}
                className="bg-white rounded-xl border border-[#e8e4df] p-5 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-[#4a4540]">{sheet.code}</span>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-[#8a7e72]">
                      {sheet.tour_name}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-[#8a7e72]">
                      <Calendar className="h-3.5 w-3.5 inline mr-1" />
                      {sheet.departure_date}
                    </div>
                    <div className="text-[#8a7e72]">
                      <Users className="h-3.5 w-3.5 inline mr-1" />
                      {sheet.pax} 人
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {categories.map(cat => {
                      const config = CATEGORY_CONFIG[cat] || { emoji: '📋', label: cat }
                      const count = sheet.items.filter(i => i.category === cat).length
                      return (
                        <span key={cat} className="text-xs text-[#8a7e72] bg-[#faf9f7] px-2 py-1 rounded">
                          {config.emoji} {config.label} ×{count}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[#8a7e72]">
                    共 {sheet.items.length} 個項目
                    {sheet.status === 'pending' ? (
                      <Send className="h-4 w-4 text-amber-600 ml-2" />
                    ) : (
                      <Eye className="h-4 w-4 ml-2" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
