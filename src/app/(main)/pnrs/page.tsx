'use client'

import { LABELS } from './constants/labels'

import { usePNRs } from '@/data'
import { useState } from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { DateCell, TextCell } from '@/components/table-cells'
import { Plane, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { formatSegment, FlightSegment } from '@/lib/pnr-parser'

// PNR 類型
interface PNR {
  id: string
  record_locator: string
  passenger_names?: string[]
  status: string
  ticketing_deadline?: string
  segments?: FlightSegment[]
  created_at: string
}

export default function PNRsPage() {
  const { items: pnrs, loading } = usePNRs()
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  // 切換展開狀態
  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // 表格欄位定義
  const columns = [
    {
      key: 'expand' as const,
      label: '',
      width: '40px',
      render: (_: unknown, row: PNR) => row.segments && row.segments.length > 0 ? (
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(row.id) }}
          className="p-1 hover:bg-morandi-container/20 rounded"
        >
          {expandedIds.includes(row.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ) : null,
    },
    {
      key: 'record_locator' as const,
      label: '訂位代號',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Plane size={14} className="text-morandi-sky" />
          <span className="font-semibold">{String(value || '')}</span>
        </div>
      ),
    },
    {
      key: 'passenger_names' as const,
      label: '旅客姓名',
      render: (value: unknown) => <TextCell text={Array.isArray(value) ? value.join(', ') : '-'} maxLength={40} />,
    },
    {
      key: 'status' as const,
      label: '狀態',
      width: '100px',
      render: (value: unknown) => (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          value === 'active'
            ? 'bg-morandi-success/10 text-morandi-success'
            : 'bg-morandi-secondary/10 text-morandi-secondary'
        }`}>
          {value === 'active' ? '有效' : '已取消'}
        </span>
      ),
    },
    {
      key: 'ticketing_deadline' as const,
      label: '出票期限',
      sortable: true,
      render: (value: unknown) => {
        const dateStr = value as string | undefined
        if (!dateStr) return <span>-</span>
        return (
          <div className="flex items-center gap-1">
            {new Date(dateStr) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
              <AlertCircle size={14} className="text-morandi-alert" />
            )}
            <DateCell date={dateStr} />
          </div>
        )
      },
    },
    {
      key: 'created_at' as const,
      label: '建立時間',
      sortable: true,
      render: (value: unknown) => <DateCell date={value as string | null} format="long" />,
    },
  ]

  return (
    <ListPageLayout<PNR>
      title={LABELS.MANAGE_9673}
      icon={Plane}
      data={pnrs as PNR[]}
      loading={loading}
      columns={columns}
      searchFields={['record_locator', 'passenger_names']}
      searchPlaceholder={LABELS.SEARCH_8637}
      defaultSort={{ key: 'created_at', direction: 'desc' }}
      expandedRows={expandedIds}
      onToggleExpand={toggleExpand}
      renderExpanded={(row: PNR) => row.segments && row.segments.length > 0 ? (
        <div className="bg-morandi-container/5 px-6 py-3">
          <h4 className="text-xs font-medium text-morandi-secondary mb-2">{LABELS.FLIGHT_INFO}</h4>
          <div className="space-y-1">
            {row.segments.map((seg: FlightSegment, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm text-morandi-primary bg-card px-3 py-2 rounded-lg border border-border"
              >
                <Plane size={12} className="text-morandi-sky" />
                {formatSegment(seg)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    />
  )
}
