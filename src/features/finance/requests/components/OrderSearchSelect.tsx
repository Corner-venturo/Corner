'use client'

import { Input } from '@/components/ui/input'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { Order } from '@/types/order.types'

interface OrderSearchSelectProps {
  value: string
  onChange: (value: string) => void
  onSelect: (order: Order) => void
  orders: Order[]
  showDropdown: boolean
  onShowDropdown: (show: boolean) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

export function OrderSearchSelect({
  value,
  onChange,
  onSelect,
  orders,
  showDropdown,
  onShowDropdown,
  disabled = false,
  placeholder = '請先選擇旅遊團',
  label = '選擇訂單（可選）',
}: OrderSearchSelectProps) {
  return (
    <div>
      {label && <label className="text-sm font-medium text-morandi-primary">{label}</label>}
      <div className="relative">
        <Input
          placeholder={disabled ? placeholder : '搜尋訂單號或聯絡人...'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onClick={() => !disabled && onShowDropdown(true)}
          onBlur={() => setTimeout(() => onShowDropdown(false), UI_DELAYS.SHORT_DELAY)}
          className="mt-1 bg-background"
          disabled={disabled}
        />
        {showDropdown && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
            {orders.length > 0 ? (
              orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelect(order)
                    onShowDropdown(false)
                  }}
                  className="p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                >
                  <div className="font-medium">{order.order_number}</div>
                  <div className="text-sm text-morandi-secondary">
                    聯絡人: {order.contact_person}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-morandi-secondary">找不到相符的訂單</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
