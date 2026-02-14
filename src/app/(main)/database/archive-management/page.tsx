'use client'

import { useState, useEffect, useCallback } from 'react'
import { Archive, RotateCcw, Trash2, Plane, FileText, FileQuestion, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { DateCell, CurrencyCell, ActionCell } from '@/components/table-cells'
import { confirm } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { deleteTour as deleteTourEntity } from '@/data'
import { checkTourDependencies, deleteTourEmptyOrders } from '@/features/tours/services/tour_dependency.service'
import { ARCHIVE_LABELS } from './constants/labels'

interface ArchivedTour {
  id: string
  code: string
  name: string | null
  location: string | null
  departure_date: string | null
  return_date: string | null
  archived: boolean | null
  updated_at: string | null
}

interface ArchivedItinerary {
  id: string
  title: string | null
  tour_code: string | null
  country: string | null
  city: string | null
  departure_date: string | null
  archived_at: string | null
  status: string | null
}

// 未關聯旅遊團的報價單
interface OrphanedQuote {
  id: string
  code: string | null
  name: string | null
  customer_name: string | null
  total_amount: number | null
  status: string | null
  created_at: string | null
}

// 結案旅遊團
interface ClosedTour {
  id: string
  code: string
  name: string | null
  location: string | null
  departure_date: string | null
  return_date: string | null
  closing_date: string | null
  closing_status: string | null
}

export default function ArchiveManagementPage() {
  const [activeTab, setActiveTab] = useState('orphaned-quotes')
  const [archivedTours, setArchivedTours] = useState<ArchivedTour[]>([])
  const [archivedItineraries, setArchivedItineraries] = useState<ArchivedItinerary[]>([])
  const [orphanedQuotes, setOrphanedQuotes] = useState<OrphanedQuote[]>([])
  const [closedTours, setClosedTours] = useState<ClosedTour[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 載入封存資料
  const loadArchivedData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 載入封存的旅遊團
      const { data: tours, error: toursError } = await supabase
        .from('tours')
        .select('id, code, name, location, departure_date, return_date, archived, updated_at')
        .eq('archived', true)
        .order('updated_at', { ascending: false })

      if (toursError) throw toursError
      setArchivedTours(tours || [])

      // 載入封存的行程表
      const { data: itineraries, error: itinerariesError } = await supabase
        .from('itineraries')
        .select('id, title, tour_code, country, city, departure_date, archived_at, status')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (itinerariesError) throw itinerariesError
      setArchivedItineraries(itineraries || [])

      // 載入未關聯旅遊團的報價單
      const { data: orphaned, error: orphanedError } = await supabase
        .from('quotes')
        .select('id, code, name, customer_name, total_amount, status, created_at')
        .is('tour_id', null)
        .order('created_at', { ascending: false })

      if (orphanedError) throw orphanedError
      setOrphanedQuotes(orphaned || [])

      // 載入結案的旅遊團（未封存的）
      const { data: closed, error: closedError } = await supabase
        .from('tours')
        .select('id, code, name, location, departure_date, return_date, closing_date, closing_status')
        .eq('closing_status', 'closed')
        .or('archived.is.null,archived.eq.false')
        .order('closing_date', { ascending: false })

      if (closedError) throw closedError
      setClosedTours(closed || [])
    } catch (error) {
      logger.error('載入封存資料失敗:', error)
      toast.error('載入封存資料失敗')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArchivedData()
  }, [loadArchivedData])

  // 還原旅遊團
  const handleRestoreTour = async (tour: ArchivedTour) => {
    const confirmed = await confirm(`確定要還原旅遊團「${tour.code}」嗎？`, {
      title: '還原旅遊團',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('tours')
        .update({ archived: false })
        .eq('id', tour.id)

      if (error) throw error
      toast.success(`已還原旅遊團 ${tour.code}`)
      loadArchivedData()
    } catch (error) {
      logger.error('還原失敗:', error)
      toast.error('還原失敗，請稍後再試')
    }
  }

  // 永久刪除旅遊團
  const handleDeleteTour = async (tour: ArchivedTour) => {
    // 先檢查是否有關聯資料（團員、收款單、請款單、PNR 不能刪，訂單可以連帶刪）
    const { blockers, hasBlockers } = await checkTourDependencies(tour.id)

    if (hasBlockers) {
      toast.error(`無法刪除：此旅遊團有 ${blockers.join('、')}，請先刪除相關資料`)
      return
    }

    const confirmed = await confirm(
      `確定要永久刪除旅遊團「${tour.code}」嗎？\n\n⚠️ 此操作無法復原！`,
      {
        title: '永久刪除',
        type: 'warning',
      }
    )
    if (!confirmed) return

    try {
      // 先刪除空訂單（沒有團員的）
      await deleteTourEmptyOrders(tour.id)

      await deleteTourEntity(tour.id)
      toast.success(`已永久刪除旅遊團 ${tour.code}`)
      loadArchivedData()
    } catch (error) {
      logger.error('刪除失敗:', error)
      toast.error('刪除失敗')
    }
  }

  // 還原行程表
  const handleRestoreItinerary = async (itinerary: ArchivedItinerary) => {
    const confirmed = await confirm(
      `確定要還原行程表「${itinerary.title || itinerary.tour_code || '未命名'}」嗎？`,
      {
        title: '還原行程表',
        type: 'warning',
      }
    )
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ archived_at: null })
        .eq('id', itinerary.id)

      if (error) throw error
      toast.success('已還原行程表')
      loadArchivedData()
    } catch (error) {
      logger.error('還原失敗:', error)
      toast.error('還原失敗，請稍後再試')
    }
  }

  // 永久刪除行程表
  const handleDeleteItinerary = async (itinerary: ArchivedItinerary) => {
    const confirmed = await confirm(
      `確定要永久刪除行程表「${itinerary.title || itinerary.tour_code || '未命名'}」嗎？\n\n⚠️ 此操作無法復原！`,
      {
        title: '永久刪除',
        type: 'warning',
      }
    )
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', itinerary.id)

      if (error) throw error
      toast.success('已永久刪除行程表')
      loadArchivedData()
    } catch (error) {
      logger.error('刪除失敗:', error)
      toast.error('刪除失敗，請稍後再試')
    }
  }

  // 刪除未關聯的報價單
  const handleDeleteOrphanedQuote = async (quote: OrphanedQuote) => {
    const confirmed = await confirm(
      `確定要刪除報價單「${quote.code}」嗎？\n\n此報價單未關聯任何旅遊團，刪除後無法復原。`,
      {
        title: '刪除報價單',
        type: 'warning',
      }
    )
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quote.id)

      if (error) throw error
      toast.success(`已刪除報價單 ${quote.code}`)
      loadArchivedData()
    } catch (error) {
      logger.error('刪除失敗:', error)
      toast.error('刪除失敗，請稍後再試')
    }
  }

  // 封存結案的旅遊團
  const handleArchiveClosedTour = async (tour: ClosedTour) => {
    const confirmed = await confirm(
      `確定要將結案旅遊團「${tour.code}」封存嗎？\n\n封存後可在「封存旅遊團」標籤頁還原。`,
      {
        title: '封存旅遊團',
        type: 'warning',
      }
    )
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('tours')
        .update({ archived: true, archive_reason: 'closed' })
        .eq('id', tour.id)

      if (error) throw error
      toast.success(`已封存旅遊團 ${tour.code}`)
      loadArchivedData()
    } catch (error) {
      logger.error('封存失敗:', error)
      toast.error('封存失敗，請稍後再試')
    }
  }

  // 旅遊團表格欄位
  const tourColumns = [
    {
      key: 'code',
      label: ARCHIVE_LABELS.COL_CODE,
      width: '140px',
      render: (_: unknown, row: ArchivedTour) => (
        <span className="font-medium text-morandi-primary">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: ARCHIVE_LABELS.COL_NAME,
      render: (_: unknown, row: ArchivedTour) => (
        <span className="text-morandi-secondary">{row.name || row.location || '-'}</span>
      ),
    },
    {
      key: 'departure_date',
      label: ARCHIVE_LABELS.COL_DEPARTURE_DATE,
      width: '120px',
      render: (_: unknown, row: ArchivedTour) => <DateCell date={row.departure_date} />,
    },
    {
      key: 'updated_at',
      label: ARCHIVE_LABELS.COL_ARCHIVED_TIME,
      width: '120px',
      render: (_: unknown, row: ArchivedTour) => (
        <span className="text-sm text-morandi-secondary">
          {row.updated_at ? formatDate(row.updated_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (_: unknown, row: ArchivedTour) => (
        <ActionCell
          actions={[
            {
              icon: RotateCcw,
              label: ARCHIVE_LABELS.ACTION_RESTORE,
              onClick: () => handleRestoreTour(row),
            },
            {
              icon: Trash2,
              label: ARCHIVE_LABELS.ACTION_DELETE_PERMANENT,
              onClick: () => handleDeleteTour(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  // 未關聯報價單表格欄位
  const orphanedQuotesColumns = [
    {
      key: 'code',
      label: ARCHIVE_LABELS.COL_QUOTE_CODE,
      width: '140px',
      render: (_: unknown, row: OrphanedQuote) => (
        <span className="font-medium text-morandi-primary">{row.code}</span>
      ),
    },
    {
      key: 'customer_name',
      label: ARCHIVE_LABELS.COL_CUSTOMER_NAME,
      render: (_: unknown, row: OrphanedQuote) => (
        <span className="text-morandi-secondary">{row.customer_name || row.name || '-'}</span>
      ),
    },
    {
      key: 'total_amount',
      label: ARCHIVE_LABELS.COL_AMOUNT,
      width: '120px',
      render: (_: unknown, row: OrphanedQuote) => (
        row.total_amount ? (
          <CurrencyCell amount={row.total_amount} className="text-sm text-morandi-secondary" />
        ) : (
          <span className="text-sm text-morandi-secondary">-</span>
        )
      ),
    },
    {
      key: 'created_at',
      label: ARCHIVE_LABELS.COL_CREATED_TIME,
      width: '120px',
      render: (_: unknown, row: OrphanedQuote) => (
        <span className="text-sm text-morandi-secondary">
          {row.created_at ? formatDate(row.created_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (_: unknown, row: OrphanedQuote) => (
        <ActionCell
          actions={[
            {
              icon: Trash2,
              label: ARCHIVE_LABELS.ACTION_DELETE,
              onClick: () => handleDeleteOrphanedQuote(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  // 結案旅遊團表格欄位
  const closedToursColumns = [
    {
      key: 'code',
      label: ARCHIVE_LABELS.COL_CODE,
      width: '140px',
      render: (_: unknown, row: ClosedTour) => (
        <span className="font-medium text-morandi-primary">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: ARCHIVE_LABELS.COL_NAME,
      render: (_: unknown, row: ClosedTour) => (
        <span className="text-morandi-secondary">{row.name || row.location || '-'}</span>
      ),
    },
    {
      key: 'departure_date',
      label: ARCHIVE_LABELS.COL_DEPARTURE_DATE,
      width: '120px',
      render: (_: unknown, row: ClosedTour) => <DateCell date={row.departure_date} />,
    },
    {
      key: 'closing_date',
      label: ARCHIVE_LABELS.COL_CLOSING_DATE,
      width: '120px',
      render: (_: unknown, row: ClosedTour) => (
        <span className="text-sm text-morandi-secondary">
          {row.closing_date ? formatDate(row.closing_date) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (_: unknown, row: ClosedTour) => (
        <ActionCell
          actions={[
            {
              icon: Archive,
              label: ARCHIVE_LABELS.ACTION_ARCHIVE,
              onClick: () => handleArchiveClosedTour(row),
            },
          ]}
        />
      ),
    },
  ]

  // 行程表表格欄位
  const itineraryColumns = [
    {
      key: 'tour_code',
      label: ARCHIVE_LABELS.COL_CODE,
      width: '140px',
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="font-medium text-morandi-primary">{row.tour_code || '-'}</span>
      ),
    },
    {
      key: 'title',
      label: ARCHIVE_LABELS.COL_TITLE,
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="text-morandi-secondary">{row.title || '-'}</span>
      ),
    },
    {
      key: 'location',
      label: ARCHIVE_LABELS.COL_LOCATION,
      width: '150px',
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="text-morandi-secondary">
          {[row.country, row.city].filter(Boolean).join(' / ') || '-'}
        </span>
      ),
    },
    {
      key: 'archived_at',
      label: ARCHIVE_LABELS.COL_ARCHIVED_TIME,
      width: '120px',
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="text-sm text-morandi-secondary">
          {row.archived_at ? formatDate(row.archived_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (_: unknown, row: ArchivedItinerary) => (
        <ActionCell
          actions={[
            {
              icon: RotateCcw,
              label: ARCHIVE_LABELS.ACTION_RESTORE,
              onClick: () => handleRestoreItinerary(row),
            },
            {
              icon: Trash2,
              label: ARCHIVE_LABELS.ACTION_DELETE_PERMANENT,
              onClick: () => handleDeleteItinerary(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  // 標籤頁定義
  const STATUS_TABS = [
    { value: 'orphaned-quotes', label: `${ARCHIVE_LABELS.TAB_ORPHANED_QUOTES} (${orphanedQuotes.length})`, icon: FileQuestion },
    { value: 'closed', label: `${ARCHIVE_LABELS.TAB_CLOSED_TOURS} (${closedTours.length})`, icon: CheckCircle },
    { value: 'tours', label: `${ARCHIVE_LABELS.TAB_ARCHIVED_TOURS} (${archivedTours.length})`, icon: Plane },
    { value: 'itineraries', label: `${ARCHIVE_LABELS.TAB_ARCHIVED_ITINERARIES} (${archivedItineraries.length})`, icon: FileText },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={ARCHIVE_LABELS.PAGE_TITLE}
        icon={Archive}
        breadcrumb={[
          { label: ARCHIVE_LABELS.BREADCRUMB_HOME, href: '/' },
          { label: ARCHIVE_LABELS.BREADCRUMB_DATABASE, href: '/database' },
          { label: ARCHIVE_LABELS.BREADCRUMB_ARCHIVE, href: '/database/archive-management' },
        ]}
        tabs={STATUS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
          </div>
        ) : (
          <>
            {/* 未關聯報價單 */}
            {activeTab === 'orphaned-quotes' && (
              orphanedQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
                  <FileQuestion className="h-12 w-12 mb-4 opacity-30" />
                  <p>{ARCHIVE_LABELS.EMPTY_ORPHANED_QUOTES}</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={orphanedQuotesColumns}
                  data={orphanedQuotes}
                />
              )
            )}

            {/* 結案旅遊團 */}
            {activeTab === 'closed' && (
              closedTours.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
                  <CheckCircle className="h-12 w-12 mb-4 opacity-30" />
                  <p>{ARCHIVE_LABELS.EMPTY_CLOSED_TOURS}</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={closedToursColumns}
                  data={closedTours}
                />
              )
            )}

            {/* 封存旅遊團 */}
            {activeTab === 'tours' && (
              archivedTours.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
                  <Archive className="h-12 w-12 mb-4 opacity-30" />
                  <p>{ARCHIVE_LABELS.EMPTY_ARCHIVED_TOURS}</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={tourColumns}
                  data={archivedTours}
                />
              )
            )}

            {/* 封存行程表 */}
            {activeTab === 'itineraries' && (
              archivedItineraries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
                  <Archive className="h-12 w-12 mb-4 opacity-30" />
                  <p>{ARCHIVE_LABELS.EMPTY_ARCHIVED_ITINERARIES}</p>
                </div>
              ) : (
                <EnhancedTable
                  columns={itineraryColumns}
                  data={archivedItineraries}
                />
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
