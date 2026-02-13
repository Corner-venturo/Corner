import React from 'react'
import { CalcInput } from '@/components/ui/calc-input'
import {
  getCurrencySymbol,
  formatCurrency,
  formatDate,
} from '../constants/currency'
import { TOUR_CONFIRMATION_SHEET_PAGE_LABELS } from '../constants/labels'
import type { TourConfirmationItem } from '@/types/tour-confirmation-sheet.types'
import type { MutableRefObject } from 'react'

interface CategoryItemRowProps {
  item: TourConfirmationItem
  categoryLabel: string
  rowIndex: number
  destinationCurrency: string | null
  localExpectedCostsRef: MutableRefObject<
    Record<string, { value: number | null; formula?: string; dirty: boolean }>
  >
  localNotesRef: MutableRefObject<Record<string, { value: string; dirty: boolean }>>
  onExpectedCostChange: (itemId: string, value: number | null) => void
  onExpectedCostFormulaChange: (itemId: string, formula: string | undefined) => void
  onExpectedCostBlur: (itemId: string, currentTypeData?: unknown) => void
  onNotesChange: (itemId: string, value: string) => void
  onNotesBlur: (itemId: string) => void
  onCurrencyConvert: (itemId: string) => void
}

export function CategoryItemRow({
  item,
  categoryLabel,
  rowIndex,
  destinationCurrency,
  localExpectedCostsRef,
  localNotesRef,
  onExpectedCostChange,
  onExpectedCostFormulaChange,
  onExpectedCostBlur,
  onNotesChange,
  onNotesBlur,
  onCurrencyConvert,
}: CategoryItemRowProps) {
  const subtotal =
    item.subtotal ?? (item.unit_price || 0) * (item.quantity || 0)
  const typeData = item.type_data as { subtotal_currency?: string; expected_cost_formula?: string } | null

  return (
    <tr
      className={`border-t border-border/50 hover:bg-morandi-container/10 ${
        rowIndex % 2 === 1 ? 'bg-morandi-container/5' : ''
      }`}
    >
      <td className="px-2 py-2 text-morandi-secondary text-xs border-r border-border/30">
        {categoryLabel}
      </td>
      <td className="px-1 py-2 text-xs border-r border-border/30">
        {formatDate(item.service_date)}
      </td>
      <td className="px-2 py-2 text-sm border-r border-border/30">
        {item.supplier_name}
      </td>
      <td className="px-2 py-2 text-sm border-r border-border/30">{item.title}</td>
      <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">
        {item.unit_price ? formatCurrency(item.unit_price) : '-'}
      </td>
      <td className="px-2 py-2 text-center text-sm border-r border-border/30">
        {item.quantity || '-'}
      </td>
      <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">
        {subtotal > 0
          ? typeData?.subtotal_currency
            ? `${getCurrencySymbol(typeData.subtotal_currency)} ${subtotal.toLocaleString()}`
            : formatCurrency(subtotal)
          : '-'}
      </td>
      {/* 預計支出 - 螢幕版（可編輯） */}
      <td className="px-1 py-1 border-r border-border/30 print:hidden">
        <div className="flex items-center">
          {typeData?.subtotal_currency && (
            <span className="text-xs text-muted-foreground pl-1 shrink-0">
              {getCurrencySymbol(typeData.subtotal_currency)}
            </span>
          )}
          <CalcInput
            data-expected-cost-input={item.id}
            value={
              item.id in localExpectedCostsRef.current
                ? localExpectedCostsRef.current[item.id].value
                : item.expected_cost
            }
            onChange={(val) => onExpectedCostChange(item.id, val)}
            formula={
              localExpectedCostsRef.current[item.id]?.formula ??
              typeData?.expected_cost_formula
            }
            onFormulaChange={(f) => onExpectedCostFormulaChange(item.id, f)}
            onBlur={() => onExpectedCostBlur(item.id, item.type_data)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                const inputs = document.querySelectorAll<HTMLInputElement>(
                  '[data-expected-cost-input]'
                )
                const inputsArray = Array.from(inputs)
                const currentIndex = inputsArray.findIndex(
                  (input) => input.dataset.expectedCostInput === item.id
                )
                if (currentIndex === -1) return
                const nextIndex =
                  e.key === 'ArrowDown'
                    ? Math.min(currentIndex + 1, inputsArray.length - 1)
                    : Math.max(currentIndex - 1, 0)
                inputsArray[nextIndex]?.focus()
              }
            }}
            className="flex-1 h-7 px-2 py-1 text-sm text-right font-mono bg-transparent border border-transparent hover:border-border focus:border-morandi-gold focus:ring-1 focus:ring-morandi-gold/30 rounded outline-none"
            placeholder="-"
          />
        </div>
      </td>
      {/* 預計支出 - 列印版 */}
      <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30 hidden print:table-cell">
        {item.expected_cost
          ? typeData?.subtotal_currency
            ? `${getCurrencySymbol(typeData.subtotal_currency)} ${item.expected_cost.toLocaleString()}`
            : formatCurrency(item.expected_cost)
          : '-'}
      </td>
      <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">
        {item.actual_cost ? formatCurrency(item.actual_cost) : '-'}
      </td>
      {/* 備註 - 螢幕版（可編輯） */}
      <td className="px-1 py-1 print:hidden">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={
              item.id in localNotesRef.current
                ? localNotesRef.current[item.id].value
                : item.notes || ''
            }
            onChange={(e) => onNotesChange(item.id, e.target.value)}
            onBlur={() => onNotesBlur(item.id)}
            className="flex-1 h-7 px-2 py-1 text-xs bg-transparent border border-transparent hover:border-border focus:border-morandi-gold focus:ring-1 focus:ring-morandi-gold/30 rounded outline-none"
            placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.備註}
          />
          {destinationCurrency &&
          (item.subtotal || (item.unit_price && item.quantity)) ? (
            <button
              type="button"
              className="h-6 px-1.5 text-xs text-morandi-gold hover:text-morandi-gold-hover hover:bg-morandi-gold/10 rounded shrink-0 print:hidden"
              onClick={() => onCurrencyConvert(item.id)}
            >
              {destinationCurrency}
            </button>
          ) : null}
        </div>
      </td>
      {/* 備註 - 列印版 */}
      <td className="px-2 py-2 text-xs text-morandi-secondary hidden print:table-cell">
        {item.notes || '-'}
      </td>
    </tr>
  )
}
