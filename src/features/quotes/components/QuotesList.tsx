/**
 * QuotesList - Displays quotes in a table format
 */

'use client'

import React, { useMemo } from 'react'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Quote } from '@/stores/types'
import { Tour } from '@/types/tour.types'
import { Archive, Calculator, Copy, Eye, Pin, Trash2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QUOTE_STATUS_LABELS } from '@/constants/quote-status'
import { STATUS_COLORS } from '../constants'

interface QuotesListProps {
  quotes: Quote[]
  tours: Tour[]
  searchTerm: string
  onQuoteClick: (quoteId: string) => void
  onPreview: (quoteId: string, e: React.MouseEvent) => void
  onDuplicate: (quoteId: string, e: React.MouseEvent) => void
  onTogglePin: (quoteId: string, isPinned: boolean, e: React.MouseEvent) => void
  onDelete: (quoteId: string, e: React.MouseEvent) => void
  onReject?: (quoteId: string, e: React.MouseEvent) => void
}

export const QuotesList: React.FC<QuotesListProps> = ({
  quotes,
  tours,
  searchTerm,
  onQuoteClick,
  onPreview,
  onDuplicate,
  onTogglePin,
  onDelete,
  onReject,
}) => {
  const tableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'quote_number',
        label: '編號',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          // 簡化邏輯：直接顯示報價單自己的編號
          const displayCode = quote.code || '-'
          const codeColor = quote.code ? 'text-morandi-gold' : 'text-morandi-secondary'

          return (
            <div className="flex items-center gap-2">
              {quote.is_pinned && <Pin size={14} className="text-morandi-gold" />}
              <span className={cn('text-sm font-mono', codeColor)}>{displayCode}</span>
            </div>
          )
        },
      },
      {
        key: 'name',
        label: '團體名稱',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          // 快速報價單顯示 customer_name，團體報價單顯示 name
          const displayName = quote.quote_type === 'quick' ? quote.customer_name : quote.name
          return (
            <span className="text-sm font-medium text-morandi-primary">{displayName || '-'}</span>
          )
        },
      },
      {
        key: 'quote_type',
        label: '類型',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          const isQuick = quote.quote_type === 'quick'
          return (
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                isQuick
                  ? 'bg-morandi-green/10 text-morandi-green'
                  : 'bg-morandi-gold/10 text-morandi-gold'
              )}
            >
              {isQuick ? '快速報價單' : '團體報價單'}
            </span>
          )
        },
      },
      {
        key: 'created_by_name',
        label: '作者',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          return (
            <span className="text-sm text-morandi-secondary">
              {quote.created_by_name || quote.handler_name || '-'}
            </span>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          return (
            <span
              className={cn(
                'text-sm font-medium',
                STATUS_COLORS[quote.status || ''] || 'text-morandi-secondary'
              )}
            >
              {QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] || quote.status}
            </span>
          )
        },
      },
      {
        key: 'group_size',
        label: '人數',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          // 快速報價單不顯示人數，顯示 -
          if (quote.quote_type === 'quick') {
            return <span className="text-sm text-morandi-secondary">-</span>
          }
          return (
            <div className="flex items-center text-sm text-morandi-secondary">
              <Users size={14} className="mr-1" />
              {quote.group_size}人
            </div>
          )
        },
      },
      {
        key: 'total_cost',
        label: '總成本',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          return (
            <span className="text-sm text-morandi-secondary">
              NT$ {quote.total_cost?.toLocaleString() || 0}
            </span>
          )
        },
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        render: (value, row) => {
          const quote = row as Quote
          return (
            <span className="text-sm text-morandi-secondary">
              {new Date(quote.created_at).toLocaleDateString()}
            </span>
          )
        },
      },
    ],
    [tours, quotes]
  )

  return (
    <EnhancedTable
      columns={tableColumns}
      data={quotes}
      searchableFields={['name', 'customer_name', 'code']}
      searchTerm={searchTerm}
      onRowClick={row => onQuoteClick((row as Quote).id)}
      bordered={true}
      actions={row => {
        const quote = row as Quote
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={e => onTogglePin(quote.id, quote.is_pinned || false, e)}
              className={cn(
                quote.is_pinned
                  ? 'text-morandi-gold hover:bg-morandi-gold/10'
                  : 'text-morandi-secondary hover:bg-morandi-secondary/10'
              )}
              title={quote.is_pinned ? '取消置頂' : '設為置頂範本'}
            >
              <Pin size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={e => onPreview(quote.id, e)}
              className="text-morandi-green hover:bg-morandi-green/10"
              title="預覽報價單"
            >
              <Eye size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={e => {
                e.stopPropagation()
                onQuoteClick(quote.id)
              }}
              className="text-morandi-gold hover:bg-morandi-gold/10"
              title="編輯報價單"
            >
              <Calculator size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={e => onDuplicate(quote.id, e)}
              className="text-morandi-blue hover:bg-morandi-blue/10"
              title="複製報價單"
            >
              <Copy size={16} />
            </Button>
            {onReject && quote.status !== 'rejected' && (
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                onClick={e => onReject(quote.id, e)}
                className="text-morandi-secondary hover:bg-morandi-secondary/10"
                title="作廢報價單"
              >
                <Archive size={16} />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={e => onDelete(quote.id, e)}
              className="text-morandi-red hover:bg-morandi-red/10"
              title="刪除報價單"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      }}
    />
  )
}
