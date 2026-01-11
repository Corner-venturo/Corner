import React from 'react'
import { CostItem } from '../types'

interface AccommodationItemRowProps {
  item: CostItem
  categoryId: string
  day: number
  roomIndex: number
  handleUpdateItem: (
    categoryId: string,
    itemId: string,
    field: keyof CostItem,
    value: unknown
  ) => void
  handleRemoveItem: (categoryId: string, itemId: string) => void
}

export const AccommodationItemRow: React.FC<AccommodationItemRowProps> = ({
  item,
  categoryId,
  day,
  roomIndex,
  handleUpdateItem,
  handleRemoveItem,
}) => {
  return (
    <tr className="border-b border-border hover:bg-morandi-container/10 transition-colors">
      {/* 分類欄：第一個房型顯示天數 */}
      <td className="py-3 px-4 text-sm text-morandi-primary text-center table-divider">
        {roomIndex === 0 ? `DAY${day}` : ''}
      </td>

      {/* 項目欄：房型名稱 */}
      <td className="py-3 px-4 text-sm text-morandi-primary text-center table-divider">
        <input
          type="text"
          value={item.name}
          onChange={e => handleUpdateItem(categoryId, item.id, 'name', e.target.value)}
          className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-card"
          placeholder="房型名稱"
        />
      </td>

      {/* 人數欄 */}
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        <input
          type="text"
          inputMode="numeric"
          value={item.quantity && item.quantity !== 1 ? item.quantity : ''}
          onChange={e => {
            const val = e.target.value.trim()
            handleUpdateItem(categoryId, item.id, 'quantity', val === '' ? null : Number(val) || 0)
          }}
          className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-card"
          placeholder="人數"
        />
      </td>

      {/* 單價欄 */}
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        <input
          type="text"
          inputMode="numeric"
          value={item.unit_price ?? ''}
          onChange={e => {
            const val = e.target.value.trim()
            handleUpdateItem(categoryId, item.id, 'unit_price', val === '' ? null : Number(val) || 0)
          }}
          className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-card"
          placeholder="單價"
        />
      </td>

      {/* 小計欄 */}
      <td className="py-3 px-4 text-sm text-morandi-primary text-center font-medium table-divider whitespace-nowrap">
        {item.total.toLocaleString()}
      </td>

      {/* 備註 / 操作合併欄 */}
      <td colSpan={2} className="py-3 px-4 text-sm text-morandi-secondary">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={item.note || ''}
            onChange={e => handleUpdateItem(categoryId, item.id, 'note', e.target.value)}
            className="flex-1 px-1 py-1 text-sm bg-transparent border-0 focus:outline-none focus:bg-card"
            placeholder="備註"
          />
          <button
            onClick={() => handleRemoveItem(categoryId, item.id)}
            className="ml-2 w-4 h-4 flex items-center justify-center text-xs text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-all flex-shrink-0"
            title="刪除"
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  )
}
