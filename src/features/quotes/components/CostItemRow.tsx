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
  // 判斷是否為小孩或嬰兒機票（顯示為灰色）
  const isChildOrInfantTicket = item.name === '小孩機票' || item.name === '嬰兒機票'

  return (
    <tr
      className={`border-b border-border hover:bg-morandi-container/10 transition-colors ${isChildOrInfantTicket ? 'opacity-60' : ''}`}
    >
      <td
        colSpan={2}
        className={`py-3 px-4 text-sm text-morandi-primary text-center ${item.quantity && item.quantity !== 1 ? 'table-divider' : ''}`}
      >
        <input
          type="text"
          value={item.name}
          onChange={e => handleUpdateItem(categoryId, item.id, 'name', e.target.value)}
          className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
          placeholder="輸入項目名稱"
        />
      </td>
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        <input
          type="number"
          value={item.quantity && item.quantity !== 1 ? item.quantity : ''}
          onChange={e =>
            handleUpdateItem(categoryId, item.id, 'quantity', Number(e.target.value) || 0)
          }
          className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </td>
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        {item.name === '成人機票' ? (
          <input
            type="number"
            value={item.adult_price || ''}
            onChange={e =>
              handleUpdateItem(categoryId, item.id, 'adult_price', Number(e.target.value) || 0)
            }
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="成人票價"
          />
        ) : item.name === '小孩機票' ? (
          <input
            type="number"
            value={item.child_price || ''}
            onChange={e =>
              handleUpdateItem(categoryId, item.id, 'child_price', Number(e.target.value) || 0)
            }
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="小孩票價"
          />
        ) : item.name === '嬰兒機票' ? (
          <input
            type="number"
            value={item.infant_price || ''}
            onChange={e =>
              handleUpdateItem(categoryId, item.id, 'infant_price', Number(e.target.value) || 0)
            }
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="嬰兒票價"
          />
        ) : (
          <input
            type="number"
            value={item.unit_price || ''}
            onChange={e =>
              handleUpdateItem(categoryId, item.id, 'unit_price', Number(e.target.value) || 0)
            }
            className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
