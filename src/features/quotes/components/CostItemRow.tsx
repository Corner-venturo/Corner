import React from 'react'
import { CostItem } from '../types'

interface CostItemRowProps {
  item: CostItem
  categoryId: string
  handleUpdateItem: (
    categoryId: string,
    itemId: string,
    field: keyof CostItem,
    value: unknown
  ) => void
  handleRemoveItem: (categoryId: string, itemId: string) => void
}

export const CostItemRow: React.FC<CostItemRowProps> = ({
  item,
  categoryId,
  handleUpdateItem,
  handleRemoveItem,
}) => {
  // 判斷是否為兒童或嬰兒（顯示為灰色）
  const isChildOrInfantTicket = item.name === '兒童' || item.name === '嬰兒'
  // 判斷是否為餐飲類別（顯示自理選項）
  const isMealItem = categoryId === 'meals'
  // 判斷是否為自理餐（顯示為淡色）
  const isSelfArranged = item.is_self_arranged

  return (
    <tr
      className={`border-b border-border hover:bg-morandi-container/10 transition-colors ${isChildOrInfantTicket || isSelfArranged ? 'opacity-60' : ''}`}
    >
      <td
        colSpan={2}
        className={`py-3 px-4 text-sm text-morandi-primary text-center ${item.quantity && item.quantity !== 1 ? 'table-divider' : ''}`}
      >
        <div className="flex items-center gap-2">
          {/* 餐飲類別：顯示自理 checkbox */}
          {isMealItem && (
            <label className="flex items-center gap-1 text-xs text-morandi-secondary cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={item.is_self_arranged || false}
                onChange={e => handleUpdateItem(categoryId, item.id, 'is_self_arranged', e.target.checked)}
                className="w-3 h-3 accent-morandi-gold cursor-pointer"
              />
              <span>自理</span>
            </label>
          )}
          <input
            type="text"
            value={item.name}
            onChange={e => handleUpdateItem(categoryId, item.id, 'name', e.target.value)}
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
            placeholder="輸入項目名稱"
          />
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        <input
          type="text"
          inputMode="numeric"
          value={item.quantity && item.quantity !== 1 ? item.quantity : ''}
          onChange={e => {
            const val = e.target.value.trim()
            handleUpdateItem(categoryId, item.id, 'quantity', val === '' ? null : Number(val) || 0)
          }}
          className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
        />
      </td>
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        {item.name === '成人' ? (
          <input
            type="text"
            inputMode="numeric"
            value={item.adult_price ?? ''}
            onChange={e => {
              const val = e.target.value.trim()
              handleUpdateItem(categoryId, item.id, 'adult_price', val === '' ? null : Number(val) || 0)
            }}
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
            placeholder="成人票價"
          />
        ) : item.name === '兒童' ? (
          <input
            type="text"
            inputMode="numeric"
            value={item.child_price ?? ''}
            onChange={e => {
              const val = e.target.value.trim()
              handleUpdateItem(categoryId, item.id, 'child_price', val === '' ? null : Number(val) || 0)
            }}
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
            placeholder="兒童票價"
          />
        ) : item.name === '嬰兒' ? (
          <input
            type="text"
            inputMode="numeric"
            value={item.infant_price ?? ''}
            onChange={e => {
              const val = e.target.value.trim()
              handleUpdateItem(categoryId, item.id, 'infant_price', val === '' ? null : Number(val) || 0)
            }}
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
            placeholder="嬰兒票價"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={item.unit_price ?? ''}
            onChange={e => {
              const val = e.target.value.trim()
              handleUpdateItem(categoryId, item.id, 'unit_price', val === '' ? null : Number(val) || 0)
            }}
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
          />
        )}
      </td>
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
            className="flex-1 px-1 py-1 text-sm bg-transparent border-0 focus:outline-none focus:bg-white"
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
