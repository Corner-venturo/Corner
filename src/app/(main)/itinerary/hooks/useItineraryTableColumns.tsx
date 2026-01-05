'use client'

import { useMemo, useCallback } from 'react'
import { MapPin, Eye, Copy, Archive, Trash2, RotateCcw, Building2, CheckCircle2, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableColumn } from '@/components/ui/enhanced-table'
import { DateCell } from '@/components/table-cells'
import type { Itinerary, Employee, Tour } from '@/stores/types'
import { alertSuccess, alertError } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'

interface UseItineraryTableColumnsProps {
  countries: Array<{ id: string; name: string }>
  cities: Array<{ id: string; name: string }>
  employees: Employee[]
  tours: Tour[]
  handleDelete: (id: string) => Promise<void>
  handleOpenDuplicateDialog: (itinerary: Itinerary) => void
  handleArchive: (id: string) => Promise<void>
  handleUnarchive: (id: string) => Promise<void>
  handleSetTemplate: (id: string, isTemplate: boolean) => Promise<void>
  handleClose: (id: string) => Promise<void>
  handleReopen: (id: string) => Promise<void>
  isItineraryClosed: (itinerary: Itinerary) => boolean
}

export function useItineraryTableColumns({
  countries,
  cities,
  employees,
  tours,
  handleDelete,
  handleOpenDuplicateDialog,
  handleArchive,
  handleUnarchive,
  handleSetTemplate,
  handleClose,
  handleReopen,
  isItineraryClosed,
}: UseItineraryTableColumnsProps) {
  // 根據 ID 取得國家名稱
  const getCountryName = useCallback((countryId?: string) => {
    if (!countryId) return '-'
    const country = countries.find(c => c.id === countryId)
    return country?.name || countryId
  }, [countries])

  // 根據 ID 取得城市名稱
  const getCityName = useCallback((cityId?: string) => {
    if (!cityId) return '-'
    const city = cities.find(c => c.id === cityId)
    return city?.name || cityId
  }, [cities])

  // 根據 created_by ID 查找員工名稱
  const getEmployeeName = useCallback((employeeId?: string) => {
    if (!employeeId) return '-'
    const employee = employees.find(e => e.id === employeeId)
    return employee?.display_name || employee?.chinese_name || '-'
  }, [employees])

  // 根據 tour_id 查找綁定的團號
  const getLinkedTourCode = useCallback((tourId?: string | null) => {
    if (!tourId) return null
    const tour = tours.find(t => t.id === tourId)
    return tour?.code || null
  }, [tours])

  const tableColumns: TableColumn<Itinerary>[] = useMemo(
    () => [
      {
        key: 'tour_code',
        label: '行程編號',
        sortable: true,
        render: (_value, itinerary) => {
          const linkedTourCode = getLinkedTourCode(itinerary.tour_id)
          const isLinked = !!linkedTourCode
          return (
            <div className="flex items-center gap-1.5">
              {isLinked && (
                <Link2 size={12} className="text-morandi-blue flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm font-mono",
                isLinked ? "text-morandi-blue font-medium" : "text-morandi-secondary"
              )}>
                {isLinked ? linkedTourCode : (itinerary.tour_code || '-')}
              </span>
            </div>
          )
        },
      },
      {
        key: 'title',
        label: '行程名稱',
        sortable: true,
        render: (_value, itinerary) => {
          const versionRecords = itinerary.version_records as Array<unknown> | undefined
          const versionCount = versionRecords?.length || 0
          const extraVersions = versionCount > 1 ? versionCount - 1 : 0
          const cleanTitle = stripHtml(itinerary.title)
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-morandi-primary">{cleanTitle}</span>
              {extraVersions > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-morandi-gold/10 text-morandi-gold font-medium">
                  +{extraVersions}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'destination',
        label: '目的地',
        sortable: true,
        render: (_value, itinerary) => (
          <div className="flex items-center text-sm text-morandi-secondary">
            <MapPin size={14} className="mr-1" />
            {getCountryName(itinerary.country)} · {getCityName(itinerary.city)}
          </div>
        ),
      },
      {
        key: 'days',
        label: '天數',
        sortable: true,
        render: (_value, itinerary) => {
          const dailyItinerary = itinerary.daily_itinerary as Array<{ isAlternative?: boolean }> | undefined
          const mainDays = dailyItinerary?.filter(d => !d.isAlternative).length || 0
          return (
            <span className="text-sm text-morandi-secondary">
              {mainDays} 天 {Math.max(0, mainDays - 1)} 夜
            </span>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, itinerary) => {
          const isClosed = isItineraryClosed(itinerary)
          const isTemplate = itinerary.is_template

          if (isClosed) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-morandi-secondary">
                結案
              </span>
            )
          }
          if (isTemplate) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-gold/10 text-morandi-gold">
                <Building2 size={10} />
                公司範例
              </span>
            )
          }
          if (itinerary.status === '進行中') {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-green/10 text-morandi-green">
                進行中
              </span>
            )
          }
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-muted/20 text-morandi-secondary">
              提案
            </span>
          )
        },
      },
      {
        key: 'created_by',
        label: '作者',
        sortable: true,
        render: (_value, itinerary) => (
          <span className="text-sm text-morandi-secondary">
            {getEmployeeName(itinerary.created_by)}
          </span>
        ),
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        render: (_value, itinerary) => (
          <DateCell date={itinerary.created_at} showIcon={false} className="text-morandi-muted" />
        ),
      },
      {
        key: 'actions',
        label: '操作',
        render: (_value, itinerary) => {
          const isArchived = !!itinerary.archived_at
          const isClosed = isItineraryClosed(itinerary)
          const isTemplate = itinerary.is_template

          return (
            <div className="flex items-center gap-1">
              <button
                onClick={e => {
                  e.stopPropagation()
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                  // 優先使用關聯團的團號，其次用行程表自己的 tour_code
                  const linkedTourCode = getLinkedTourCode(itinerary.tour_id)
                  const tourCode = linkedTourCode || itinerary.tour_code
                  const shareUrl = tourCode
                    ? `${baseUrl}/view/${tourCode}`
                    : `${baseUrl}/view/${itinerary.id}`
                  navigator.clipboard
                    .writeText(shareUrl)
                    .then(() => {
                      alertSuccess('分享連結已複製！\n\n' + shareUrl)
                    })
                    .catch(() => {
                      alertError('複製失敗，請手動複製：\n' + shareUrl)
                    })
                }}
                className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                title="產生分享連結"
              >
                <Eye size={14} />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleOpenDuplicateDialog(itinerary)
                }}
                className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                title="複製行程"
              >
                <Copy size={14} />
              </button>

              {isTemplate && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleSetTemplate(itinerary.id, false)
                  }}
                  className="p-1 text-purple-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="取消公司範例"
                >
                  <Building2 size={14} />
                </button>
              )}

              {!isTemplate && (
                isClosed ? (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleReopen(itinerary.id)
                    }}
                    className="p-1 text-status-info hover:text-status-info hover:bg-muted rounded transition-colors"
                    title="重新開啟"
                  >
                    <RotateCcw size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleSetTemplate(itinerary.id, true)
                      }}
                      className="p-1 text-morandi-secondary hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      title="設為公司範例"
                    >
                      <Building2 size={14} />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleClose(itinerary.id)
                      }}
                      className="p-1 text-morandi-secondary hover:text-status-success hover:bg-status-success-bg rounded transition-colors"
                      title="結案"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  </>
                )
              )}

              {isArchived ? (
                <>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleUnarchive(itinerary.id)
                    }}
                    className="p-1 text-morandi-green/60 hover:text-morandi-green hover:bg-morandi-green/10 rounded transition-colors"
                    title="取消封存"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(itinerary.id)
                    }}
                    className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
                    title="永久刪除"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleArchive(itinerary.id)
                  }}
                  className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                  title="封存"
                >
                  <Archive size={14} />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [handleDelete, handleOpenDuplicateDialog, handleArchive, handleUnarchive, handleSetTemplate, handleClose, handleReopen, isItineraryClosed, getEmployeeName, getCountryName, getCityName, getLinkedTourCode]
  )

  return {
    tableColumns,
    getCountryName,
    getCityName,
    getEmployeeName,
    getLinkedTourCode,
  }
}
