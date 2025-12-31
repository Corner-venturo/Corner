'use client'

import { useState, useEffect, useCallback } from 'react'
import { Archive, RotateCcw, Trash2, Plane, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell } from '@/components/table-cells'
import { confirm } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

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

export default function ArchiveManagementPage() {
  const [activeTab, setActiveTab] = useState('tours')
  const [archivedTours, setArchivedTours] = useState<ArchivedTour[]>([])
  const [archivedItineraries, setArchivedItineraries] = useState<ArchivedItinerary[]>([])
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
    const confirmed = await confirm(
      `確定要永久刪除旅遊團「${tour.code}」嗎？\n\n⚠️ 此操作無法復原，相關的訂單、請款單等資料也會一併刪除！`,
      {
        title: '永久刪除',
        type: 'warning',
      }
    )
    if (!confirmed) return

    // 二次確認
    const doubleConfirmed = await confirm(
      `請再次確認：永久刪除「${tour.code}」及所有相關資料？`,
      {
        title: '最終確認',
        type: 'warning',
      }
    )
    if (!doubleConfirmed) return

    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', tour.id)

      if (error) throw error
      toast.success(`已永久刪除旅遊團 ${tour.code}`)
      loadArchivedData()
    } catch (error) {
      logger.error('刪除失敗:', error)
      toast.error('刪除失敗，可能有關聯資料無法刪除')
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

  // 旅遊團表格欄位
  const tourColumns = [
    {
      key: 'code',
      label: '團號',
      width: '140px',
      render: (_: unknown, row: ArchivedTour) => (
        <span className="font-medium text-morandi-primary">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: '團名',
      render: (_: unknown, row: ArchivedTour) => (
        <span className="text-morandi-secondary">{row.name || row.location || '-'}</span>
      ),
    },
    {
      key: 'departure_date',
      label: '出發日期',
      width: '120px',
      render: (_: unknown, row: ArchivedTour) => <DateCell date={row.departure_date} />,
    },
    {
      key: 'updated_at',
      label: '封存時間',
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
              label: '還原',
              onClick: () => handleRestoreTour(row),
            },
            {
              icon: Trash2,
              label: '永久刪除',
              onClick: () => handleDeleteTour(row),
              variant: 'danger',
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
      label: '團號',
      width: '140px',
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="font-medium text-morandi-primary">{row.tour_code || '-'}</span>
      ),
    },
    {
      key: 'title',
      label: '標題',
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="text-morandi-secondary">{row.title || '-'}</span>
      ),
    },
    {
      key: 'location',
      label: '地點',
      width: '150px',
      render: (_: unknown, row: ArchivedItinerary) => (
        <span className="text-morandi-secondary">
          {[row.country, row.city].filter(Boolean).join(' / ') || '-'}
        </span>
      ),
    },
    {
      key: 'archived_at',
      label: '封存時間',
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
              label: '還原',
              onClick: () => handleRestoreItinerary(row),
            },
            {
              icon: Trash2,
              label: '永久刪除',
              onClick: () => handleDeleteItinerary(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="封存資料管理"
        icon={Archive}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '封存資料管理', href: '/database/archive-management' },
        ]}
      />

      {/* 警告提示 */}
      <div className="mx-4 mb-4 p-4 bg-morandi-red/10 border border-morandi-red/30 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-morandi-red flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-morandi-red">注意事項</p>
          <p className="text-sm text-morandi-secondary mt-1">
            永久刪除的資料無法復原。刪除旅遊團時，相關的訂單、請款單等資料也會一併刪除。建議定期清理超過一年以上的封存資料。
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="tours" className="gap-2">
              <Plane className="h-4 w-4" />
              旅遊團
              {archivedTours.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-morandi-red/20 text-morandi-red rounded-full">
                  {archivedTours.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="itineraries" className="gap-2">
              <FileText className="h-4 w-4" />
              行程表
              {archivedItineraries.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-morandi-red/20 text-morandi-red rounded-full">
                  {archivedItineraries.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tours" className="flex-1 overflow-hidden mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
              </div>
            ) : archivedTours.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
                <Archive className="h-12 w-12 mb-4 opacity-30" />
                <p>沒有封存的旅遊團</p>
              </div>
            ) : (
              <EnhancedTable
                columns={tourColumns}
                data={archivedTours}
              />
            )}
          </TabsContent>

          <TabsContent value="itineraries" className="flex-1 overflow-hidden mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
              </div>
            ) : archivedItineraries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
                <Archive className="h-12 w-12 mb-4 opacity-30" />
                <p>沒有封存的行程表</p>
              </div>
            ) : (
              <EnhancedTable
                columns={itineraryColumns}
                data={archivedItineraries}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
