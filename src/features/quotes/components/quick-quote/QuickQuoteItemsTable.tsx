'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { QuickQuoteItem } from '@/stores/types'

interface QuickQuoteItemsTableProps {
  items: QuickQuoteItem[]
  isEditing: boolean
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onUpdateItem: <K extends keyof QuickQuoteItem>(id: string, field: K, value: QuickQuoteItem[K]) => void
}

export const QuickQuoteItemsTable: React.FC<QuickQuoteItemsTableProps> = ({
  items,
  isEditing,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const normalizeNumber = (val: string): string => {
    // 全形轉半形
    val = val.replace(/[０-９]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    val = val.replace(/[．]/g, '.')
    val = val.replace(/[－]/g, '-')
    return val
  }

  // 儲存格樣式
  const cellClass = "px-2 py-1.5 border border-morandi-gold/20"
  const headerCellClass = "px-2 py-2 text-left font-medium text-morandi-secondary text-xs border border-morandi-gold/20 bg-morandi-container/30"
  const inputClass = "w-full h-7 bg-transparent border-0 outline-none focus:ring-0 text-sm"

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-morandi-primary">收費明細表</h2>
        {isEditing && (
          <Button onClick={onAddItem} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            新增項目
          </Button>
        )}
      </div>
      <div className="bg-white rounded-lg border border-morandi-gold/20 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className={headerCellClass}>摘要</th>
              <th className={`${headerCellClass} text-center w-20`}>數量</th>
              {isEditing && <th className={`${headerCellClass} text-center w-24`}>成本</th>}
              <th className={`${headerCellClass} text-center w-28`}>單價</th>
              <th className={`${headerCellClass} text-center w-28`}>金額</th>
              {isEditing && <th className={`${headerCellClass} text-center w-24`}>利潤</th>}
              <th className={`${headerCellClass} w-32`}>備註</th>
              {isEditing && <th className={`${headerCellClass} text-center w-12`}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-morandi-container/10">
                <td className={cellClass}>
                  <input
                    value={item.description}
                    onChange={e => onUpdateItem(item.id, 'description', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="項目說明"
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </td>
                <td className={cellClass}>
                  <input
                    type="text"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={e => {
                      const val = normalizeNumber(e.target.value)
                      if (val === '' || val === '-') {
                        onUpdateItem(item.id, 'quantity', 0)
                      } else {
                        const num = parseFloat(val)
                        if (!isNaN(num)) {
                          onUpdateItem(item.id, 'quantity', num)
                        }
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={!isEditing}
                    className={`${inputClass} text-center`}
                  />
                </td>
                {isEditing && (
                  <td className={cellClass}>
                    <input
                      type="text"
                      value={item.cost === 0 || item.cost === undefined ? '' : item.cost}
                      onChange={e => {
                        const val = normalizeNumber(e.target.value)
                        if (val === '' || val === '-') {
                          onUpdateItem(item.id, 'cost', 0)
                        } else {
                          const num = parseFloat(val)
                          if (!isNaN(num)) {
                            onUpdateItem(item.id, 'cost', num)
                          }
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      className={`${inputClass} text-right`}
                    />
                  </td>
                )}
                <td className={cellClass}>
                  <input
                    type="text"
                    value={item.unit_price === 0 ? '' : item.unit_price}
                    onChange={e => {
                      const val = normalizeNumber(e.target.value)
                      if (val === '' || val === '-') {
                        onUpdateItem(item.id, 'unit_price', 0)
                      } else {
                        const num = parseFloat(val)
                        if (!isNaN(num)) {
                          onUpdateItem(item.id, 'unit_price', num)
                        }
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={!isEditing}
                    className={`${inputClass} text-right`}
                  />
                </td>
                <td className={`${cellClass} text-right font-medium`}>
                  {item.amount.toLocaleString()}
                </td>
                {isEditing && (
                  <td className={`${cellClass} text-right font-medium`}>
                    <span className={((item.unit_price - (item.cost || 0)) * item.quantity) >= 0 ? 'text-morandi-green' : 'text-morandi-red'}>
                      {((item.unit_price - (item.cost || 0)) * item.quantity).toLocaleString()}
                    </span>
                  </td>
                )}
                <td className={cellClass}>
                  <input
                    value={item.notes}
                    onChange={e => onUpdateItem(item.id, 'notes', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="備註"
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </td>
                {isEditing && (
                  <td className={`${cellClass} text-center`}>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-morandi-red hover:text-status-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={isEditing ? 8 : 5}
                  className="px-3 py-8 text-center text-morandi-secondary border border-morandi-gold/20"
                >
                  尚無項目
                  {isEditing && '，點擊「新增項目」開始'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
