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

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-morandi-primary">收費明細表</h2>
        {isEditing && (
          <Button onClick={onAddItem} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            新增項目
          </Button>
        )}
      </div>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-morandi-container/20">
            <tr>
              <th className="px-3 py-2 text-left">摘要</th>
              <th className="px-3 py-2 text-center w-20">數量</th>
              {isEditing && <th className="px-3 py-2 text-center w-24">成本</th>}
              <th className="px-3 py-2 text-center w-28">單價</th>
              <th className="px-3 py-2 text-center w-28">金額</th>
              {isEditing && <th className="px-3 py-2 text-center w-24">利潤</th>}
              <th className="px-3 py-2 text-left w-32">備註</th>
              {isEditing && <th className="px-3 py-2 text-center w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Input
                    value={item.description}
                    onChange={e => onUpdateItem(item.id, 'description', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="項目說明"
                    disabled={!isEditing}
                    className="h-8"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
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
                    className="h-8 text-center"
                    placeholder=""
                  />
                </td>
                {isEditing && (
                  <td className="px-3 py-2">
                    <Input
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
                      className="h-8 text-right"
                      placeholder=""
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <Input
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
                    className="h-8 text-right"
                    placeholder=""
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {item.amount.toLocaleString()}
                </td>
                {isEditing && (
                  <td className="px-3 py-2 text-right font-medium">
                    <span className={((item.unit_price - (item.cost || 0)) * item.quantity) >= 0 ? 'text-morandi-green' : 'text-morandi-red'}>
                      {((item.unit_price - (item.cost || 0)) * item.quantity).toLocaleString()}
                    </span>
                  </td>
                )}
                <td className="px-3 py-2">
                  <Input
                    value={item.notes}
                    onChange={e => onUpdateItem(item.id, 'notes', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="備註"
                    disabled={!isEditing}
                    className="h-8"
                  />
                </td>
                {isEditing && (
                  <td className="px-3 py-2 text-center">
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
                  className="px-3 py-8 text-center text-morandi-secondary"
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
