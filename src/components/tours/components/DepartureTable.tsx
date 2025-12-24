'use client'

import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface TableItem {
  id: string
  date: string
  item_name?: string | null
  restaurant_name?: string | null
  hotel_name?: string | null
  venue_name?: string | null
  unit_price?: number | null
  quantity?: number | null
  subtotal?: number | null
  expected_amount?: number | null
  actual_amount?: number | null
  notes?: string | null
}

interface DepartureTableProps {
  title: string
  items: TableItem[]
  nameField: 'restaurant_name' | 'hotel_name' | 'venue_name' | 'item_name'
  nameLabel: string
  isEditing: boolean
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  } catch {
    return dateStr
  }
}

const formatMoney = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-'
  return amount.toLocaleString('zh-TW')
}

export function DepartureTable({ title, items, nameField, nameLabel, isEditing }: DepartureTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-morandi-primary">{title}</h2>
        {isEditing && (
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            新增
          </Button>
        )}
      </div>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-morandi-container/20">
            <tr>
              <th className="px-3 py-2 text-left text-morandi-secondary font-medium w-20">日期</th>
              <th className="px-3 py-2 text-left text-morandi-secondary font-medium">{nameLabel}</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-24">單價</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-16">數量</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-28">預計支出</th>
              <th className="px-3 py-2 text-right text-morandi-secondary font-medium w-28">實際支出</th>
              <th className="px-3 py-2 text-left text-morandi-secondary font-medium">備註</th>
              {isEditing && <th className="px-3 py-2 w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? 8 : 7} className="px-3 py-8 text-center text-morandi-secondary">
                  尚無資料{isEditing && '，點擊「新增」開始'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2 text-morandi-secondary">{formatDate(item.date)}</td>
                  <td className="px-3 py-2 text-morandi-primary font-medium">{item[nameField] || '-'}</td>
                  <td className="px-3 py-2 text-right text-morandi-secondary">{formatMoney(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right text-morandi-secondary">{item.quantity || '-'}</td>
                  <td className="px-3 py-2 text-right font-medium text-morandi-primary">{formatMoney(item.expected_amount)}</td>
                  <td className="px-3 py-2 text-right font-medium text-morandi-green">{formatMoney(item.actual_amount)}</td>
                  <td className="px-3 py-2 text-morandi-muted text-xs">{item.notes || '-'}</td>
                  {isEditing && (
                    <td className="px-3 py-2 text-center">
                      <button className="text-morandi-red hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
            {items.length > 0 && (
              <tr className="border-t-2 border-morandi-gold/30 bg-morandi-container/10">
                <td colSpan={4} className="px-3 py-2 text-right text-morandi-secondary font-medium">小計</td>
                <td className="px-3 py-2 text-right font-semibold text-morandi-primary">
                  {formatMoney(items.reduce((sum, item) => sum + (item.expected_amount || 0), 0))}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-morandi-green">
                  {formatMoney(items.reduce((sum, item) => sum + (item.actual_amount || 0), 0))}
                </td>
                <td colSpan={isEditing ? 2 : 1}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
