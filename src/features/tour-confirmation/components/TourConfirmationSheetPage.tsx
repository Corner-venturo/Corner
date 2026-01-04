'use client'

/**
 * TourConfirmationSheetPage - 團確單頁面
 *
 * 正式的出團確認表，類似 Excel 表格風格
 * 用於交接作業
 */

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTourConfirmationSheet } from '../hooks/useTourConfirmationSheet'
import { ItemEditDialog } from './ItemEditDialog'
import type { Tour } from '@/stores/types'
import type {
  TourConfirmationItem,
  ConfirmationItemCategory,
  CreateConfirmationItem,
  CostSummary,
} from '@/types/tour-confirmation-sheet.types'

interface TourConfirmationSheetPageProps {
  tour: Tour
}

// 分類配置
const CATEGORIES: { key: ConfirmationItemCategory; label: string }[] = [
  { key: 'transport', label: '交通' },
  { key: 'meal', label: '餐食' },
  { key: 'accommodation', label: '住宿' },
  { key: 'activity', label: '活動' },
  { key: 'other', label: '其他' },
]

export function TourConfirmationSheetPage({ tour }: TourConfirmationSheetPageProps) {
  const {
    sheet,
    groupedItems,
    costSummary,
    loading,
    saving,
    error,
    createSheet,
    updateSheet,
    addItem,
    updateItem,
    deleteItem,
    reload,
  } = useTourConfirmationSheet({ tourId: tour.id })

  // 編輯對話框狀態
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    category: ConfirmationItemCategory
    item: TourConfirmationItem | null
  }>({
    open: false,
    category: 'transport',
    item: null,
  })

  // 自動建立確認表（如果不存在）
  useEffect(() => {
    if (!loading && !sheet && tour) {
      createSheet({
        tour_code: tour.code,
        tour_name: tour.name,
        departure_date: tour.departure_date || undefined,
        return_date: tour.return_date || undefined,
        workspace_id: tour.workspace_id || '',
      })
    }
  }, [loading, sheet, tour, createSheet])

  // 開啟新增對話框
  const handleAdd = (category: ConfirmationItemCategory) => {
    setEditDialog({ open: true, category, item: null })
  }

  // 開啟編輯對話框
  const handleEdit = (item: TourConfirmationItem) => {
    setEditDialog({
      open: true,
      category: item.category as ConfirmationItemCategory,
      item,
    })
  }

  // 儲存項目
  const handleSave = async (data: CreateConfirmationItem) => {
    if (editDialog.item) {
      await updateItem(editDialog.item.id, data)
    } else {
      await addItem(data)
    }
    setEditDialog({ open: false, category: 'transport', item: null })
  }

  // 刪除項目
  const handleDelete = async (itemId: string) => {
    if (confirm('確定要刪除此項目嗎？')) {
      await deleteItem(itemId)
    }
  }

  // 格式化金額
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('zh-TW').format(value)
  }

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
    })
  }

  // Loading 狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-morandi-secondary" size={32} />
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-red">
        <p>載入失敗：{error}</p>
        <Button variant="outline" onClick={reload} className="mt-4 gap-2">
          <RefreshCw size={16} />
          重新載入
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 統一表格 */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          {/* 表頭 */}
          <thead>
            <tr className="bg-morandi-container/50 border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[70px]">分類</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[80px]">日期</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary">供應商/名稱</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary">項目說明</th>
              <th className="px-3 py-2 text-right font-medium text-morandi-primary w-[80px]">單價</th>
              <th className="px-3 py-2 text-center font-medium text-morandi-primary w-[50px]">數量</th>
              <th className="px-3 py-2 text-right font-medium text-morandi-primary w-[90px]">預計支出</th>
              <th className="px-3 py-2 text-right font-medium text-morandi-primary w-[90px]">實際支出</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[120px]">備註</th>
              <th className="px-2 py-2 w-[70px]"></th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const items = groupedItems[cat.key]
              const categoryTotal = {
                expected: items.reduce((sum, i) => sum + (i.expected_cost || 0), 0),
                actual: items.reduce((sum, i) => sum + (i.actual_cost || 0), 0),
              }

              return (
                <React.Fragment key={cat.key}>
                  {/* 分類標題行 */}
                  <tr className="bg-morandi-container/30 border-t border-border">
                    <td colSpan={9} className="px-3 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-morandi-primary">{cat.label}</span>
                        <span className="text-xs text-morandi-secondary">
                          預計: {formatCurrency(categoryTotal.expected)} / 實際: {formatCurrency(categoryTotal.actual)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAdd(cat.key)}
                        className="h-6 px-2 text-xs text-morandi-gold hover:text-morandi-gold-hover"
                      >
                        <Plus size={12} className="mr-1" />
                        新增
                      </Button>
                    </td>
                  </tr>
                  {/* 項目列表 */}
                  {items.length === 0 ? (
                    <tr className="border-t border-border/50">
                      <td colSpan={10} className="px-3 py-3 text-center text-morandi-secondary text-xs">
                        尚無{cat.label}項目
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-t border-border/50 hover:bg-morandi-container/10 ${
                          idx % 2 === 1 ? 'bg-morandi-container/5' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-morandi-secondary text-xs">{cat.label}</td>
                        <td className="px-3 py-2">{formatDate(item.service_date)}</td>
                        <td className="px-3 py-2">{item.supplier_name}</td>
                        <td className="px-3 py-2">{item.title}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 text-center">{item.quantity || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.expected_cost)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.actual_cost)}</td>
                        <td className="px-3 py-2 text-xs text-morandi-secondary truncate max-w-[120px]">
                          {item.notes || '-'}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                              title="編輯"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-morandi-secondary hover:text-morandi-red rounded"
                              title="刪除"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
          {/* 總計 */}
          <tfoot>
            <tr className="bg-morandi-container/50 border-t-2 border-border font-medium">
              <td colSpan={6} className="px-3 py-2 text-right text-morandi-primary">
                總計
              </td>
              <td className="px-3 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(costSummary.total.expected)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(costSummary.total.actual)}
              </td>
              <td colSpan={2} className="px-3 py-2">
                {costSummary.total.actual > 0 && (
                  <span className={`text-xs ${
                    costSummary.total.actual > costSummary.total.expected
                      ? 'text-morandi-red'
                      : 'text-morandi-green'
                  }`}>
                    差額: {costSummary.total.actual - costSummary.total.expected > 0 ? '+' : ''}
                    {formatCurrency(costSummary.total.actual - costSummary.total.expected)}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 編輯對話框 */}
      <ItemEditDialog
        open={editDialog.open}
        category={editDialog.category}
        item={editDialog.item}
        sheetId={sheet?.id || ''}
        workspaceId={tour.workspace_id || ''}
        onClose={() => setEditDialog({ open: false, category: 'transport', item: null })}
        onSave={handleSave}
      />
    </div>
  )
}

