'use client'

/**
 * 供應商 UI 測試頁面（暫時）
 * Excel 風格的需求單回覆介面
 * TODO: 上線後刪除此頁面
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ClipboardList,
  Send,
  Eye,
  Clock,
  Save,
  ArrowLeft,
  FileText,
  Users,
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
  quantity: string
  instruction: string
  // 回覆欄位
  reply_price: string
  reply_detail: string
  reply_note: string
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
  status: 'pending' | 'responded'
  items: RequestItem[]
  received_at: string
}

// ============================================
// 假資料
// ============================================

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
    received_at: '2025-02-15',
    items: [
      { id: 'i1', category: '交通', title: '機場接機（清邁機場→飯店）', service_date: '03/15', quantity: '2台', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i2', category: '交通', title: '一日包車（清邁市區）08:00-21:00', service_date: '03/16', quantity: '2台', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i3', category: '交通', title: '一日包車（清萊白廟藍廟）07:00-20:00', service_date: '03/17', quantity: '2台', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i4', category: '交通', title: '半日包車（素帖山）08:00-13:00', service_date: '03/18', quantity: '2台', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i5', category: '交通', title: '飯店→機場送機', service_date: '03/19', quantity: '2台', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i6', category: '餐食', title: '晚餐 帝王餐', service_date: '03/15', quantity: '30人', instruction: '只要訂位', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i7', category: '餐食', title: '午餐 河邊餐廳', service_date: '03/17', quantity: '30人', instruction: '訂位＋報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i8', category: '活動', title: '大象自然公園半日遊（含接送、午餐）', service_date: '03/16', quantity: '30人', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
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
    received_at: '2025-02-15',
    items: [
      { id: 'i9', category: '交通', title: '三日包車（含司機）', service_date: '03/20-22', quantity: '1台', instruction: '需報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i10', category: '餐食', title: '午餐 割烹料理', service_date: '03/20', quantity: '6人', instruction: '訂位＋報價', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i11', category: '餐食', title: '晚餐 燒肉店', service_date: '03/20', quantity: '6人', instruction: '只要訂位', reply_price: '', reply_detail: '', reply_note: '' },
      { id: 'i12', category: '餐食', title: '午餐 拉麵店', service_date: '03/21', quantity: '6人', instruction: '只要訂位', reply_price: '', reply_detail: '', reply_note: '' },
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
    received_at: '2025-02-01',
    items: [
      { id: 'i13', category: '交通', title: '新千歲機場接機', service_date: '02/10', quantity: '1台', instruction: '需報價', reply_price: '45,000', reply_detail: 'Toyota Coaster / 鈴木', reply_note: '' },
      { id: 'i14', category: '交通', title: '六日包車', service_date: '02/10-15', quantity: '1台', instruction: '需報價', reply_price: '480,000', reply_detail: 'Toyota Coaster / 田中', reply_note: '含高速費' },
    ],
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  '交通': 'bg-blue-50 text-blue-700',
  '餐食': 'bg-orange-50 text-orange-700',
  '活動': 'bg-green-50 text-green-700',
  '住宿': 'bg-purple-50 text-purple-700',
  '其他': 'bg-slate-50 text-slate-600',
}

// ============================================
// 主頁面
// ============================================

export default function TestSupplierPage() {
  const [selectedSheet, setSelectedSheet] = useState<RequestSheet | null>(null)
  const [editingItems, setEditingItems] = useState<RequestItem[]>([])
  const [overallNote, setOverallNote] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredSheets = MOCK_SHEETS.filter(s => {
    if (filterStatus === 'all') return true
    return s.status === filterStatus
  })

  const openSheet = (sheet: RequestSheet) => {
    setSelectedSheet(sheet)
    setEditingItems(sheet.items.map(i => ({ ...i })))
    setOverallNote('')
  }

  const updateItem = (id: string, field: keyof RequestItem, value: string) => {
    setEditingItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const isReadOnly = selectedSheet?.status !== 'pending'

  // ============================================
  // 需求單回覆畫面（Excel 風格）
  // ============================================
  if (selectedSheet) {
    return (
      <div className="min-h-screen bg-white">
        {/* 頂部列 */}
        <div className="border-b border-[#e0dcd7] px-6 py-3 flex items-center justify-between bg-[#faf9f7]">
          <button
            onClick={() => setSelectedSheet(null)}
            className="flex items-center gap-1.5 text-sm text-[#8a7e72] hover:text-[#4a4540]"
          >
            <ArrowLeft size={16} />
            {TEST_SUPPLIER_LABELS.BACK}
          </button>
          {!isReadOnly && (
            <Button
              onClick={() => alert('測試頁面，不會真的送出')}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              <Save size={14} />
              {TEST_SUPPLIER_LABELS.LABEL_8347}
            </Button>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* 需求單標頭 */}
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[#4a4540] mb-3">
              需求單 {selectedSheet.code}
            </h1>
            <div className="grid grid-cols-4 gap-x-8 gap-y-1 text-sm border border-[#e0dcd7] rounded p-4 bg-[#faf9f7]">
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.SENDING_6731}</span>
                <span className="text-[#4a4540] font-medium">{selectedSheet.sender_company}</span>
              </div>
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_8976}</span>
                <span className="text-[#4a4540]">{selectedSheet.sender_contact}</span>
              </div>
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_1613}</span>
                <span className="text-[#4a4540] font-medium">{selectedSheet.departure_date}</span>
              </div>
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_7494}</span>
                <span className="text-[#4a4540] font-medium">{selectedSheet.pax} 人</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_5719}</span>
                <span className="text-[#4a4540]">{selectedSheet.tour_name}</span>
              </div>
              <div>
                <span className="text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_6786}</span>
                <span className="text-[#4a4540]">{selectedSheet.sender_phone}</span>
              </div>
            </div>
          </div>

          {/* Excel 表格 */}
          <div className="border border-[#d5d0ca] rounded overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0ece7]">
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-left font-semibold text-[#4a4540] w-[70px]">{TEST_SUPPLIER_LABELS.DATE}</th>
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-left font-semibold text-[#4a4540] w-[60px]">{TEST_SUPPLIER_LABELS.LABEL_8047}</th>
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-left font-semibold text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_2283}</th>
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-center font-semibold text-[#4a4540] w-[60px]">{TEST_SUPPLIER_LABELS.QUANTITY}</th>
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-center font-semibold text-[#4a4540] w-[90px]">{TEST_SUPPLIER_LABELS.LABEL_3532}</th>
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-left font-semibold text-amber-700 w-[100px] bg-amber-50/50">{TEST_SUPPLIER_LABELS.LABEL_9228}</th>
                  <th className="border-b border-r border-[#d5d0ca] px-3 py-2.5 text-left font-semibold text-amber-700 w-[180px] bg-amber-50/50">{TEST_SUPPLIER_LABELS.LABEL_375}</th>
                  <th className="border-b border-[#d5d0ca] px-3 py-2.5 text-left font-semibold text-amber-700 w-[140px] bg-amber-50/50">{TEST_SUPPLIER_LABELS.REMARKS}</th>
                </tr>
              </thead>
              <tbody>
                {editingItems.map((item, idx) => {
                  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['其他']
                  const needsPrice = item.instruction.includes('報價')

                  return (
                    <tr key={item.id} className={cn(
                      'hover:bg-[#faf9f7]/50',
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#fdfcfb]'
                    )}>
                      <td className="border-b border-r border-[#e8e4df] px-3 py-2 text-[#4a4540] whitespace-nowrap">
                        {item.service_date}
                      </td>
                      <td className="border-b border-r border-[#e8e4df] px-2 py-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', catColor)}>
                          {item.category}
                        </span>
                      </td>
                      <td className="border-b border-r border-[#e8e4df] px-3 py-2 text-[#4a4540]">
                        {item.title}
                      </td>
                      <td className="border-b border-r border-[#e8e4df] px-3 py-2 text-center text-[#4a4540]">
                        {item.quantity}
                      </td>
                      <td className="border-b border-r border-[#e8e4df] px-2 py-2 text-center">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          item.instruction.includes('不需報價')
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-50 text-amber-700'
                        )}>
                          {item.instruction}
                        </span>
                      </td>
                      {/* 回覆區域（淡黃色背景） */}
                      <td className="border-b border-r border-[#e8e4df] px-1.5 py-1.5 bg-amber-50/30">
                        {needsPrice ? (
                          isReadOnly ? (
                            <span className="px-1.5 text-[#4a4540] font-medium">{item.reply_price}</span>
                          ) : (
                            <Input
                              value={item.reply_price}
                              onChange={(e) => updateItem(item.id, 'reply_price', e.target.value)}
                              className="h-7 text-sm border-[#d5d0ca] bg-white"
                              placeholder={TEST_SUPPLIER_LABELS.AMOUNT}
                            />
                          )
                        ) : (
                          <span className="text-[#b0a89e] text-xs px-1.5">—</span>
                        )}
                      </td>
                      <td className="border-b border-r border-[#e8e4df] px-1.5 py-1.5 bg-amber-50/30">
                        {isReadOnly ? (
                          <span className="px-1.5 text-[#4a4540]">{item.reply_detail}</span>
                        ) : (
                          <Input
                            value={item.reply_detail}
                            onChange={(e) => updateItem(item.id, 'reply_detail', e.target.value)}
                            className="h-7 text-sm border-[#d5d0ca] bg-white"
                            placeholder={item.category === '交通' ? '車型/司機' : item.category === '餐食' ? '訂位狀態' : '確認狀態'}
                          />
                        )}
                      </td>
                      <td className="border-b border-[#e8e4df] px-1.5 py-1.5 bg-amber-50/30">
                        {isReadOnly ? (
                          <span className="px-1.5 text-[#4a4540]">{item.reply_note}</span>
                        ) : (
                          <Input
                            value={item.reply_note}
                            onChange={(e) => updateItem(item.id, 'reply_note', e.target.value)}
                            className="h-7 text-sm border-[#d5d0ca] bg-white"
                            placeholder="備註"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 底部備註 + 整包報價 */}
          {!isReadOnly && (
            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-[#8a7e72] mb-1 block">{TEST_SUPPLIER_LABELS.LABEL_1920}</label>
                <textarea
                  value={overallNote}
                  onChange={(e) => setOverallNote(e.target.value)}
                  className="w-full border border-[#d5d0ca] rounded px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-amber-400"
                  placeholder={TEST_SUPPLIER_LABELS.LABEL_7916}
                />
              </div>
              <div className="w-[280px]">
                <label className="text-xs text-[#8a7e72] mb-1 block">{TEST_SUPPLIER_LABELS.LABEL_3563}</label>
                <div className="border border-[#d5d0ca] rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0ece7]">
                        <th className="border-b border-r border-[#d5d0ca] px-2 py-1.5 text-left text-xs font-medium text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_1251}</th>
                        <th className="border-b border-[#d5d0ca] px-2 py-1.5 text-left text-xs font-medium text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_2541}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[3, 6, 10, 15].map((pax, idx) => (
                        <tr key={pax} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fdfcfb]'}>
                          <td className="border-b border-r border-[#e8e4df] px-2 py-1.5 text-[#4a4540]">{pax} 人</td>
                          <td className="border-b border-[#e8e4df] px-1.5 py-1">
                            <Input className="h-7 text-sm border-[#d5d0ca] bg-white" placeholder="金額" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // 收件匣
  // ============================================
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="h-5 w-5 text-amber-600" />
          <h1 className="text-lg font-semibold text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_6359}</h1>
        </div>
        <p className="text-xs text-[#b0a89e] mb-6">⚠️ 測試頁面</p>

        {/* 篩選 */}
        <div className="flex gap-2 mb-5">
          {[
            { value: 'all', label: '全部', count: MOCK_SHEETS.length },
            { value: 'pending', label: '待回覆', count: MOCK_SHEETS.filter(s => s.status === 'pending').length },
            { value: 'responded', label: '已回覆', count: MOCK_SHEETS.filter(s => s.status === 'responded').length },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded transition-colors',
                filterStatus === tab.value
                  ? 'bg-amber-600 text-white'
                  : 'text-[#8a7e72] hover:bg-[#f0ece7]'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* 表格式列表 */}
        <div className="border border-[#d5d0ca] rounded overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f0ece7]">
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-left font-semibold text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_7885}</th>
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-left font-semibold text-[#4a4540]">{TEST_SUPPLIER_LABELS.LABEL_1594}</th>
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-center font-semibold text-[#4a4540] w-[70px]">人數</th>
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-center font-semibold text-[#4a4540] w-[70px]">項目</th>
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-center font-semibold text-[#4a4540] w-[80px]">{TEST_SUPPLIER_LABELS.STATUS}</th>
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-center font-semibold text-[#4a4540] w-[80px]">{TEST_SUPPLIER_LABELS.LABEL_5510}</th>
                <th className="border-b border-[#d5d0ca] px-4 py-2.5 text-center font-semibold text-[#4a4540] w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSheets.map((sheet, idx) => (
                <tr
                  key={sheet.id}
                  onClick={() => openSheet(sheet)}
                  className={cn(
                    'cursor-pointer hover:bg-amber-50/50 transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#fdfcfb]'
                  )}
                >
                  <td className="border-b border-[#e8e4df] px-4 py-3 font-medium text-[#4a4540]">
                    {sheet.code}
                  </td>
                  <td className="border-b border-[#e8e4df] px-4 py-3 text-[#4a4540]">
                    <div>{sheet.tour_name}</div>
                    <div className="text-xs text-[#8a7e72]">{TEST_SUPPLIER_LABELS.LABEL_5892} {sheet.departure_date}</div>
                  </td>
                  <td className="border-b border-[#e8e4df] px-4 py-3 text-center text-[#4a4540]">
                    {sheet.pax}
                  </td>
                  <td className="border-b border-[#e8e4df] px-4 py-3 text-center text-[#4a4540]">
                    {sheet.items.length}
                  </td>
                  <td className="border-b border-[#e8e4df] px-4 py-3 text-center">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      sheet.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    )}>
                      {sheet.status === 'pending' ? '待回覆' : '已回覆'}
                    </span>
                  </td>
                  <td className="border-b border-[#e8e4df] px-4 py-3 text-center text-[#8a7e72]">
                    {sheet.received_at}
                  </td>
                  <td className="border-b border-[#e8e4df] px-4 py-3 text-center">
                    {sheet.status === 'pending' ? (
                      <Send size={14} className="text-amber-600 mx-auto" />
                    ) : (
                      <Eye size={14} className="text-[#8a7e72] mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
