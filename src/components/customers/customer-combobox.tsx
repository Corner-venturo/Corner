'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Customer } from '@/types/customer.types'

interface CustomerComboboxProps {
  customers: Customer[]
  value?: string // customer id
  onSelect: (customer: Customer | null) => void
  placeholder?: string
  className?: string
}

export function CustomerCombobox({
  customers,
  value,
  onSelect,
  placeholder = '搜尋顧客（姓名/身分證/護照）',
  className = '',
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCustomer = customers.find(c => c.id === value)

  // 搜尋過濾
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(query) ||
      c.national_id?.toLowerCase().includes(query) ||
      c.passport_number?.toLowerCase().includes(query)
    )
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedCustomer ? (
            <span className="truncate">
              {selectedCustomer.name}
              {selectedCustomer.national_id && ` (${selectedCustomer.national_id})`}
            </span>
          ) : (
            <span className="text-morandi-secondary">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <p className="text-morandi-secondary mb-2">找不到符合的顧客</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelect(null)
                    setOpen(false)
                  }}
                >
                  建立新顧客
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map(customer => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    onSelect(customer.id === value ? null : customer)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === customer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-morandi-secondary">
                      {customer.national_id && `身分證：${customer.national_id}`}
                      {customer.national_id && customer.passport_number && ' | '}
                      {customer.passport_number && `護照：${customer.passport_number}`}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
