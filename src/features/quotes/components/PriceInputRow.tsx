'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PriceInputRowProps {
  label: string
  cost: number
  sellingPrice: number
  profit: number
  onPriceChange: (value: string) => void
  isReadOnly: boolean
  indented?: boolean
}

export const PriceInputRow: React.FC<PriceInputRowProps> = ({
  label,
  cost,
  sellingPrice,
  profit,
  onPriceChange,
  isReadOnly,
  indented = false,
}) => {
  return (
    <tr className="border-b border-border">
      <td
        className={cn(
          'py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border',
          indented && 'pl-6'
        )}
      >
        {label}
      </td>
      <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
        {cost.toLocaleString()}
      </td>
      <td className="py-2 px-2 text-center border-r border-border">
        <input
          type="text"
          inputMode="decimal"
          value={sellingPrice || ''}
          onChange={e => onPriceChange(e.target.value)}
          disabled={isReadOnly}
          className={cn(
            'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            isReadOnly && 'cursor-not-allowed opacity-60'
          )}
        />
      </td>
      <td
        className={cn(
          'py-2 px-2 text-center text-xs font-medium',
          profit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
        )}
      >
        {profit.toLocaleString()}
      </td>
    </tr>
  )
}
