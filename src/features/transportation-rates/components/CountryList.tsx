'use client'
/**
 * CountryList - 國家列表（按國家分組顯示車資統計）
 */


import React, { useMemo } from 'react'
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Bus, Edit2 } from 'lucide-react'
import { TransportationRate } from '@/types/transportation-rates.types'
import { TRANSPORTATION_RATES_LABELS } from '../constants/labels'

interface CountryListProps {
  rates: TransportationRate[]
  loading?: boolean
  onOpenCountry: (countryName: string, isEditMode: boolean) => void
}

interface CountryGroup {
  country: string
  count: number
}

export const CountryList: React.FC<CountryListProps> = ({ rates, loading = false, onOpenCountry }) => {
  // 按國家分組統計
  const countryGroups = useMemo(() => {
    const groups = new Map<string, number>()

    rates.forEach(rate => {
      const country = rate.country_name || TRANSPORTATION_RATES_LABELS.未分類
      groups.set(country, (groups.get(country) || 0) + 1)
    })

    return Array.from(groups.entries()).map(([country, count]) => ({
      country,
      count,
    }))
  }, [rates])

  const columns: TableColumn[] = [
    {
      key: 'country',
      label: TRANSPORTATION_RATES_LABELS.國家,
      sortable: true,
      render: (_value, rowData) => {
        const row = rowData as CountryGroup
        return (
          <div
            className="flex items-center cursor-pointer hover:text-morandi-gold transition-colors"
            onClick={() => onOpenCountry(row.country, false)}
          >
            <Bus size={18} className="mr-3 text-morandi-gold" />
            <span className="font-medium text-morandi-primary text-base">{row.country}</span>
          </div>
        )
      },
    },
    {
      key: 'count',
      label: TRANSPORTATION_RATES_LABELS.車資筆數,
      sortable: true,
      render: (_value, rowData) => {
        const row = rowData as CountryGroup
        return <span className="text-morandi-secondary text-sm">{row.count} {TRANSPORTATION_RATES_LABELS.COUNT_UNIT}</span>
      },
    },
  ]

  return (
    <EnhancedTable
      className="min-h-full"
      columns={columns}
      data={countryGroups}
      loading={loading}
      emptyMessage={TRANSPORTATION_RATES_LABELS.尚無車資資料}
      onRowClick={(rowData) => {
        const row = rowData as CountryGroup
        onOpenCountry(row.country, false)
      }}
      actions={(rowData) => {
        const row = rowData as CountryGroup
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onOpenCountry(row.country, true)
            }}
            className="h-8 w-8 p-0 text-morandi-blue hover:bg-morandi-blue/10"
            title={TRANSPORTATION_RATES_LABELS.編輯車資}
          >
            <Edit2 size={16} />
          </Button>
        )
      }}
    />
  )
}
