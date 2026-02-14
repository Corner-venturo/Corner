import React from 'react'
import { CostItem } from '../types'
import { ResourceSelectButton } from './ResourceSelectButton'
import { CalcInput } from '@/components/ui/calc-input'
import { ACCOMMODATION_ITEM_ROW_LABELS, CATEGORY_SECTION_LABELS, COST_ITEM_ROW_LABELS } from '../constants/labels';

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
  const isChildOrInfantTicket = item.name === COST_ITEM_ROW_LABELS.兒童 || item.name === COST_ITEM_ROW_LABELS.嬰兒
  // 判斷是否為餐飲類別（顯示自理選項）
  const isMealItem = categoryId === 'meals'
  // 判斷是否為自理餐（顯示為淡色）
  const isSelfArranged = item.is_self_arranged

  // 簡潔輸入框樣式（右側多留空間避免被 table-divider 遮到）
  const inputClass = 'input-no-focus w-full pl-1 pr-3 py-1 text-sm bg-transparent'

  return (
    <tr
      className={`border-b border-morandi-container/60 hover:bg-morandi-container/5 transition-colors ${isChildOrInfantTicket || isSelfArranged ? 'opacity-60' : ''}`}
    >
      <td
        colSpan={2}
        className={`py-3 px-4 text-sm text-morandi-primary text-center ${item.quantity && item.quantity !== 1 ? 'table-divider' : ''}`}
      >
        <input
          type="text"
          value={item.name}
          onChange={e => handleUpdateItem(categoryId, item.id, 'name', e.target.value)}
          className={`${inputClass} text-center`}
          placeholder={COST_ITEM_ROW_LABELS.輸入項目名稱}
        />
      </td>
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        <CalcInput
          value={item.quantity}
          onChange={val => handleUpdateItem(categoryId, item.id, 'quantity', val)}
          formula={item.quantity_formula}
          onFormulaChange={f => handleUpdateItem(categoryId, item.id, 'quantity_formula', f)}
          className={`${inputClass} text-center`}
        />
      </td>
      <td className="py-3 px-4 text-sm text-morandi-secondary text-center table-divider">
        {item.name === CATEGORY_SECTION_LABELS.成人 ? (
          <CalcInput
            value={item.adult_price}
            onChange={val => handleUpdateItem(categoryId, item.id, 'adult_price', val)}
            formula={item.adult_price_formula}
            onFormulaChange={f => handleUpdateItem(categoryId, item.id, 'adult_price_formula', f)}
            className={`${inputClass} text-center`}
            placeholder={COST_ITEM_ROW_LABELS.成人票價}
          />
        ) : item.name === '兒童' ? (
          <CalcInput
            value={item.child_price}
            onChange={val => handleUpdateItem(categoryId, item.id, 'child_price', val)}
            formula={item.child_price_formula}
            onFormulaChange={f => handleUpdateItem(categoryId, item.id, 'child_price_formula', f)}
            className={`${inputClass} text-center`}
            placeholder={COST_ITEM_ROW_LABELS.兒童票價}
          />
        ) : item.name === '嬰兒' ? (
          <CalcInput
            value={item.infant_price}
            onChange={val => handleUpdateItem(categoryId, item.id, 'infant_price', val)}
            formula={item.infant_price_formula}
            onFormulaChange={f => handleUpdateItem(categoryId, item.id, 'infant_price_formula', f)}
            className={`${inputClass} text-center`}
            placeholder={COST_ITEM_ROW_LABELS.嬰兒票價}
          />
        ) : (
          <CalcInput
            value={item.unit_price}
            onChange={val => handleUpdateItem(categoryId, item.id, 'unit_price', val)}
            formula={item.unit_price_formula}
            onFormulaChange={f => handleUpdateItem(categoryId, item.id, 'unit_price_formula', f)}
            className={`${inputClass} text-center`}
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
            className={`${inputClass} flex-1`}
            placeholder={ACCOMMODATION_ITEM_ROW_LABELS.備註}
          />
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* 資源選擇按鈕（餐廳/飯店/景點） */}
            <ResourceSelectButton
              categoryId={categoryId}
              item={item}
              onUpdateItem={handleUpdateItem}
            />
            {/* 餐飲類別：自理按鈕 */}
            {isMealItem && (
              <button
                onClick={() => handleUpdateItem(categoryId, item.id, 'is_self_arranged', !item.is_self_arranged)}
                className={`px-2 py-0.5 text-xs rounded transition-all ${
                  item.is_self_arranged
                    ? 'bg-morandi-gold text-white'
                    : 'bg-morandi-container/50 text-morandi-secondary hover:bg-morandi-container'
                }`}
                title={item.is_self_arranged ? COST_ITEM_ROW_LABELS.取消自理 : COST_ITEM_ROW_LABELS.設為自理}
              >
                {COST_ITEM_ROW_LABELS.LABEL_2796}
              </button>
            )}
            <button
              onClick={() => handleRemoveItem(categoryId, item.id)}
              className="w-4 h-4 flex items-center justify-center text-xs text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-all"
              title={ACCOMMODATION_ITEM_ROW_LABELS.刪除}
            >
              ×
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}
