/**
 * QuotesList - Displays quotes in a table format
 */

'use client'

import React, { useMemo } from 'react'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Quote } from '@/stores/types'
import { Calculator, Copy, Pin, Trash2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QUOTE_STATUS_LABELS } from '@/constants/quote-status'
import { STATUS_COLORS } from '../constants'

interface QuotesListProps {
  quotes: Quote[]
  tours: any[]
  searchTerm: string
  onQuoteClick: (quoteId: string) => void
  onDuplicate: (quoteId: string, e: React.MouseEvent) => void
  onTogglePin: (quoteId: string, isPinned: boolean, e: React.MouseEvent) => void
  onDelete: (quoteId: string, e: React.MouseEvent) => void
}

export const QuotesList: React.FC<QuotesListProps> = ({
  quotes,
  tours,
  searchTerm,
  onQuoteClick,
  onDuplicate,
  onTogglePin,
  onDelete,
}) => {
  const tableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'quote_number',
        label: '編號',
        sortable: true,
        render: (value, quote) => {
          let displayCode = '-'
          let codeColor = 'text-morandi-secondary'

          if (quote.tour_id) {
            const relatedTour = tours.find(t => t.id === quote.tour_id)
            if (relatedTour?.code) {
              if (quote.converted_to_tour) {
                const tourQuotes = quotes
                  .filter(q => q.tour_id === quote.tour_id && q.converted_to_tour)
                  .sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  )
                const version = tourQuotes.findIndex(q => q.id === quote.id) + 1
                displayCode = `${relatedTour.code}-V${version}`
              } else {
                displayCode = relatedTour.code
              }
              codeColor = 'text-morandi-gold'
            }
          } else if (quote.is_pinned && quote.code) {
            displayCode = quote.code
            codeColor = 'text-morandi-gold'
          } else {
            displayCode = quote.code || '-'
          }

          return (
            <div className="flex items-center gap-2">
              {quote.is_pinned && <Pin size={14} className="text-morandi-gold" title="置頂範本" />}
              <span className={cn('text-sm font-mono', codeColor)}>{displayCode}</span>
            </div>
          )
        },
      },
      {
        key: 'name',
        label: '團體名稱',
        sortable: true,
        render: (value, quote) => (
          <span className="text-sm font-medium text-morandi-primary">{quote.name}</span>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (value, quote) => (
          <span
            className={cn(
              'text-sm font-medium',
              STATUS_COLORS[quote.status || ''] || 'text-morandi-secondary'
            )}
          >
            {QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] || quote.status}
          </span>
        ),
      },
      {
        key: 'group_size',
        label: '人數',
        sortable: true,
        render: (value, quote) => (
          <div className="flex items-center text-sm text-morandi-secondary">
            <Users size={14} className="mr-1" />
            {quote.group_size}人
          </div>
        ),
      },
      {
        key: 'total_cost',
        label: '總成本',
        sortable: true,
        render: (value, quote) => (
          <span className="text-sm text-morandi-secondary">
            NT$ {quote.total_cost?.toLocaleString() || 0}
          </span>
        ),
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        render: (value, quote) => (
          <span className="text-sm text-morandi-secondary">
            {new Date(quote.created_at).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [tours, quotes]
  )

  return (
    <EnhancedTable
      className="min-h-full"
      columns={tableColumns}
      data={quotes}
      searchableFields={['name']}
      searchTerm={searchTerm}
      onRowClick={quote => onQuoteClick(quote.id)}
      bordered={true}
      actions={quote => (
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
      )}
    />
  )
}
