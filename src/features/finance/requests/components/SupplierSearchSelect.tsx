'use client'

import { Input } from '@/components/ui/input'
import { UI_DELAYS } from '@/lib/constants/timeouts'

interface SupplierOption {
  id: string
  name: string
  type: 'supplier' | 'employee'
  group: string
}

interface SupplierSearchSelectProps {
  value: string
  onChange: (value: string) => void
  onSelect: (supplier: SupplierOption) => void
  suppliers: SupplierOption[]
  showDropdown: boolean
  onShowDropdown: (show: boolean) => void
  placeholder?: string
  label?: string
}

export function SupplierSearchSelect({
  value,
  onChange,
  onSelect,
  suppliers,
  showDropdown,
  onShowDropdown,
  placeholder = '搜尋供應商或員工...',
  label = '供應商',
}: SupplierSearchSelectProps) {
  // Group suppliers by type
  const groupedSuppliers = suppliers.reduce(
    (acc, supplier) => {
      const group = supplier.group
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(supplier)
      return acc
    },
    {} as Record<string, SupplierOption[]>
  )

  return (
    <div>
      {label && <label className="text-sm font-medium text-morandi-secondary">{label}</label>}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onClick={() => onShowDropdown(true)}
          onBlur={() => setTimeout(() => onShowDropdown(false), UI_DELAYS.SHORT_DELAY)}
          className="mt-2 bg-background"
        />
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
            {suppliers.length > 0 ? (
              <>
                {Object.entries(groupedSuppliers).map(([groupName, items]) => (
                  <div key={groupName}>
                    <div className="px-3 py-2 text-xs font-semibold text-morandi-secondary bg-card sticky top-0">
                      {groupName}
                    </div>
                    {items.map(supplier => (
                      <div
                        key={supplier.id}
                        onClick={() => {
                          onSelect(supplier)
                          onShowDropdown(false)
                        }}
                        className="px-3 py-2 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                      >
                        <div className="font-medium text-morandi-primary">{supplier.name}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <div className="p-3 text-sm text-morandi-secondary">找不到相符的供應商或員工</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
