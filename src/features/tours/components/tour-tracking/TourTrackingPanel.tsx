'use client'

/**
 * TourTrackingPanel — 核心表追蹤總覽
 *
 * 一眼看完所有項目的全生命週期：
 * 日期 | 項目名稱 | 分類 | 報價金額 | 需求狀態 | 確認狀態 | 實際金額 | 領隊狀態
 */

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tour } from '@/stores/types'
import { useTourItineraryItemsByTour } from '@/features/tours/hooks/useTourItineraryItems'
import type { TourItineraryItem } from '@/features/tours/types/tour-itinerary-item.types'
import { TOUR_TRACKING_LABELS } from './constants/labels'

// === Category 對照 ===
const CATEGORY_LABEL_MAP: Record<string, string> = {
  transport: TOUR_TRACKING_LABELS.CATEGORY_TRANSPORT,
  'group-transport': TOUR_TRACKING_LABELS.CATEGORY_GROUP_TRANSPORT,
  accommodation: TOUR_TRACKING_LABELS.CATEGORY_ACCOMMODATION,
  meals: TOUR_TRACKING_LABELS.CATEGORY_MEALS,
  activities: TOUR_TRACKING_LABELS.CATEGORY_ACTIVITIES,
  others: TOUR_TRACKING_LABELS.CATEGORY_OTHERS,
  guide: TOUR_TRACKING_LABELS.CATEGORY_GUIDE,
}

// === Status display config ===
interface StatusDisplay {
  label: string
  color: string
  icon: string
}

function getQuoteStatusDisplay(status: string): StatusDisplay {
  switch (status) {
    case 'confirmed':
      return { label: TOUR_TRACKING_LABELS.QUOTE_CONFIRMED, color: 'text-emerald-600 bg-emerald-50', icon: '✅' }
    case 'drafted':
      return { label: TOUR_TRACKING_LABELS.QUOTE_DRAFTED, color: 'text-amber-600 bg-amber-50', icon: '⏳' }
    default:
      return { label: TOUR_TRACKING_LABELS.QUOTE_NONE, color: 'text-gray-400 bg-gray-50', icon: '⬜' }
  }
}

function getRequestStatusDisplay(status: string): StatusDisplay {
  switch (status) {
    case 'confirmed':
      return { label: TOUR_TRACKING_LABELS.REQUEST_CONFIRMED, color: 'text-emerald-600 bg-emerald-50', icon: '✅' }
    case 'replied':
      return { label: TOUR_TRACKING_LABELS.REQUEST_REPLIED, color: 'text-blue-600 bg-blue-50', icon: '💬' }
    case 'sent':
      return { label: TOUR_TRACKING_LABELS.REQUEST_SENT, color: 'text-amber-600 bg-amber-50', icon: '⏳' }
    case 'cancelled':
      return { label: TOUR_TRACKING_LABELS.REQUEST_CANCELLED, color: 'text-red-600 bg-red-50', icon: '❌' }
    default:
      return { label: TOUR_TRACKING_LABELS.REQUEST_NONE, color: 'text-gray-400 bg-gray-50', icon: '⬜' }
  }
}

function getConfirmationStatusDisplay(status: string): StatusDisplay {
  switch (status) {
    case 'confirmed':
      return { label: TOUR_TRACKING_LABELS.CONFIRM_CONFIRMED, color: 'text-emerald-600 bg-emerald-50', icon: '✅' }
    case 'pending':
      return { label: TOUR_TRACKING_LABELS.CONFIRM_PENDING, color: 'text-amber-600 bg-amber-50', icon: '⏳' }
    default:
      return { label: TOUR_TRACKING_LABELS.CONFIRM_NONE, color: 'text-gray-400 bg-gray-50', icon: '⬜' }
  }
}

function getLeaderStatusDisplay(status: string): StatusDisplay {
  switch (status) {
    case 'reviewed':
      return { label: TOUR_TRACKING_LABELS.LEADER_REVIEWED, color: 'text-emerald-600 bg-emerald-50', icon: '✅' }
    case 'filled':
      return { label: TOUR_TRACKING_LABELS.LEADER_FILLED, color: 'text-blue-600 bg-blue-50', icon: '📝' }
    default:
      return { label: TOUR_TRACKING_LABELS.LEADER_NONE, color: 'text-gray-400 bg-gray-50', icon: '⬜' }
  }
}

// === Status Badge Component ===
function StatusBadge({ display }: { display: StatusDisplay }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', display.color)}>
      <span>{display.icon}</span>
      <span>{display.label}</span>
    </span>
  )
}

// === Amount display ===
function AmountCell({ amount, currency }: { amount: number | null; currency?: string }) {
  if (amount === null || amount === undefined) {
    return <span className="text-gray-300">-</span>
  }
  return (
    <span className="font-mono text-sm">
      {currency && currency !== 'TWD' ? `${currency} ` : ''}
      {amount.toLocaleString()}
    </span>
  )
}

// === Main Component ===
interface TourTrackingPanelProps {
  tour: Tour
}

export function TourTrackingPanel({ tour }: TourTrackingPanelProps) {
  const { items, loading } = useTourItineraryItemsByTour(tour.id)

  // Group by day
  const grouped_items = useMemo(() => {
    const groups = new Map<number, TourItineraryItem[]>()
    for (const item of items) {
      const day = item.day_number ?? 0
      if (!groups.has(day)) groups.set(day, [])
      groups.get(day)!.push(item)
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0])
  }, [items])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
        <span className="ml-2 text-muted-foreground">{TOUR_TRACKING_LABELS.LOADING}</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {TOUR_TRACKING_LABELS.NO_ITEMS}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{TOUR_TRACKING_LABELS.PANEL_TITLE}</h3>
          <p className="text-sm text-muted-foreground">{TOUR_TRACKING_LABELS.PANEL_DESCRIPTION}</p>
        </div>
        <span className="text-sm text-muted-foreground">
          {TOUR_TRACKING_LABELS.TOTAL_ITEMS}: {items.length}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_DATE}</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_TITLE}</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_CATEGORY}</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_QUOTE_AMOUNT}</th>
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_REQUEST_STATUS}</th>
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_CONFIRMATION_STATUS}</th>
                <th className="text-right px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_ACTUAL_AMOUNT}</th>
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">{TOUR_TRACKING_LABELS.COL_LEADER_STATUS}</th>
              </tr>
            </thead>
            <tbody>
              {grouped_items.map(([day_number, day_items]) => (
                day_items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b last:border-b-0 hover:bg-muted/30 transition-colors',
                      idx === 0 && day_number > 0 && 'border-t-2 border-t-muted'
                    )}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {idx === 0 && day_number > 0 ? (
                        <span className="font-medium text-foreground">Day {day_number}</span>
                      ) : (
                        item.service_date || ''
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium">{item.title || '-'}</span>
                      {item.sub_category && (
                        <span className="ml-1 text-xs text-muted-foreground">({item.sub_category})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                        {CATEGORY_LABEL_MAP[item.category || ''] || item.category || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <AmountCell amount={item.total_cost} currency={item.currency} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge display={getRequestStatusDisplay(item.request_status)} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge display={getConfirmationStatusDisplay(item.confirmation_status)} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <AmountCell amount={item.actual_expense} currency={item.currency} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge display={getLeaderStatusDisplay(item.leader_status)} />
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
