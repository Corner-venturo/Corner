'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { MapPin, Eye, Copy, Archive, Trash2, RotateCcw, Building2, CheckCircle2, Link2, Plane, Search, CalendarDays, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useItineraries, useEmployees, useQuotes, useTours } from '@/hooks/cloud-hooks'
import { useRegionsStore } from '@/stores/region-store'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores'
import type { Itinerary } from '@/stores/types'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'
import { useItineraryPageState } from './hooks/useItineraryPageState'
import { useItineraryForm } from './hooks/useItineraryForm'
import { useFlightSearch } from './hooks/useFlightSearch'

const statusFilters = ['全部', '提案', '進行中', '公司範例', '結案']

// 公司密碼（統編）
const COMPANY_PASSWORD = '83212711'

// 移除 HTML 標籤，只保留純文字
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function ItineraryPage() {
  const router = useRouter()
  const { items: itineraries, delete: deleteItinerary, update: updateItinerary, create: createItinerary } = useItineraries()
  const { items: quotes, create: createQuote, update: updateQuote } = useQuotes()
  const { items: employees } = useEmployees()
  const { items: tours } = useTours()
  const { user } = useAuthStore()
  const { workspaces, loadWorkspaces } = useWorkspaceStore()
  const regionsStore = useRegionsStore()
  const countries = regionsStore.countries
  const cities = regionsStore.cities

  // 檢查是否為超級管理員
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.permissions?.includes('super_admin')

  // 超級管理員載入 workspaces
  useEffect(() => {
    if (isSuperAdmin && workspaces.length === 0) {
      loadWorkspaces()
    }
  }, [isSuperAdmin, workspaces.length, loadWorkspaces])

  // 載入地區資料（只執行一次）
  useEffect(() => {
    regionsStore.fetchAll()
  }, [regionsStore])

  // Use custom hooks
  const pageState = useItineraryPageState()
  const formState = useItineraryForm({ createItinerary, userId: user?.id })
  const flightSearch = useFlightSearch({
    outboundFlight: formState.newItineraryOutboundFlight,
    setOutboundFlight: formState.setNewItineraryOutboundFlight,
    returnFlight: formState.newItineraryReturnFlight,
    setReturnFlight: formState.setNewItineraryReturnFlight,
    departureDate: formState.newItineraryDepartureDate,
    days: formState.newItineraryDays,
  })

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

  // 根據 created_by ID 查找員工名稱（優先使用 display_name）
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

  // 打開新增行程對話框
  const handleOpenTypeSelect = useCallback(() => {
    formState.resetForm()
    pageState.setIsTypeSelectOpen(true)
  }, [formState, pageState])

  // 建立行程
  const handleCreateItinerary = useCallback(async () => {
    const success = await formState.handleCreateItinerary()
    if (success) {
      pageState.setIsTypeSelectOpen(false)
    }
  }, [formState, pageState])

  // 打開複製行程對話框
  const handleOpenDuplicateDialog = useCallback((itinerary: Itinerary) => {
    pageState.setDuplicateSource(itinerary)
    pageState.setDuplicateTourCode('')
    pageState.setDuplicateTitle('')
    pageState.setIsDuplicateDialogOpen(true)
  }, [pageState])

  // 執行複製行程
  const handleDuplicateSubmit = useCallback(async () => {
    if (!pageState.duplicateSource) return
    if (!pageState.duplicateTourCode.trim() || !pageState.duplicateTitle.trim()) {
      await alertError('請填寫行程編號和行程名稱')
      return
    }

    pageState.setIsDuplicating(true)
    try {
      const {
        id: sourceItineraryId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        created_by: _createdBy,
        updated_by: _updatedBy,
        workspace_id: _workspaceId,
        tour_id: _tourId,
        is_template: _isTemplate,
        closed_at: _closedAt,
        archived_at: _archivedAt,
        ...restData
      } = pageState.duplicateSource

      const newItinerary = {
        ...restData,
        tour_code: pageState.duplicateTourCode.trim(),
        title: pageState.duplicateTitle.trim(),
        status: '提案' as const,
        created_by: user?.id,
      }

      const createdItinerary = await createItinerary(newItinerary)

      // 查找並複製關聯的報價單
      const linkedQuotes = quotes.filter(q => q.itinerary_id === sourceItineraryId)
      let quoteCopiedCount = 0

      for (const quote of linkedQuotes) {
        const {
          id: _quoteId,
          created_at: _quoteCreatedAt,
          updated_at: _quoteUpdatedAt,
          customer_name: _customerName,
          contact_person: _contactPerson,
          contact_phone: _contactPhone,
          contact_email: _contactEmail,
          contact_address: _contactAddress,
          tour_id: _quoteTourId,
          converted_to_tour: _convertedToTour,
          status: _status,
          received_amount: _receivedAmount,
          balance_amount: _balanceAmount,
          is_pinned: _isPinned,
          ...quoteRestData
        } = quote

        const newQuote = {
          ...quoteRestData,
          code: undefined,
          workspace_id: undefined,
          itinerary_id: createdItinerary?.id,
          customer_name: '（待填寫）',
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          contact_address: undefined,
          status: 'proposed' as const,
          received_amount: undefined,
          balance_amount: undefined,
          converted_to_tour: false,
          is_pinned: false,
          tour_code: pageState.duplicateTourCode.trim(),
          created_by: user?.id,
          created_by_name: user?.name || undefined,
        }

        await createQuote(newQuote)
        quoteCopiedCount++
      }

      const successMsg = quoteCopiedCount > 0
        ? `行程已複製成功！同時複製了 ${quoteCopiedCount} 個報價單（客戶資料已清空）`
        : '行程已複製成功！'
      await alertSuccess(successMsg)
      pageState.setIsDuplicateDialogOpen(false)
      pageState.setDuplicateSource(null)
      pageState.setDuplicateTourCode('')
      pageState.setDuplicateTitle('')
    } catch (error) {
      await alertError('複製失敗，請稍後再試')
    } finally {
      pageState.setIsDuplicating(false)
    }
  }, [pageState, createItinerary, createQuote, quotes, user?.id, user?.name])

  // 封存行程
  const handleArchive = useCallback(
    async (id: string) => {
      const linkedQuotes = quotes.filter(q => q.itinerary_id === id)
      const hasLinkedQuotes = linkedQuotes.length > 0

      let syncAction: 'sync' | 'unlink' | 'cancel' = 'cancel'

      if (hasLinkedQuotes) {
        const result = await confirm(
          `此行程有 ${linkedQuotes.length} 個關聯的報價單。\n\n請選擇封存方式：\n• 同步封存：報價單也一併封存\n• 僅封存行程：斷開關聯，報價單保留`,
          {
            type: 'warning',
            title: '封存行程',
            confirmText: '同步封存',
            cancelText: '取消',
            showThirdOption: true,
            thirdOptionText: '僅封存行程',
          }
        )

        if (result === true) {
          syncAction = 'sync'
        } else if (result === 'third') {
          syncAction = 'unlink'
        } else {
          return
        }
      } else {
        const confirmed = await confirm('確定要封存這個行程嗎？封存後可在「封存」分頁中找到。', {
          type: 'warning',
          title: '封存行程',
        })
        if (!confirmed) return
        syncAction = 'sync'
      }

      try {
        const archivedAt = new Date().toISOString()
        await updateItinerary(id, { archived_at: archivedAt })

        if (hasLinkedQuotes) {
          if (syncAction === 'sync') {
            for (const quote of linkedQuotes) {
              await updateQuote(quote.id, { status: 'rejected' as const })
            }
            await alertSuccess(`已封存行程及 ${linkedQuotes.length} 個報價單！`)
          } else if (syncAction === 'unlink') {
            for (const quote of linkedQuotes) {
              await updateQuote(quote.id, { itinerary_id: undefined })
            }
            await alertSuccess('已封存行程！報價單已斷開關聯並保留。')
          }
        } else {
          await alertSuccess('已封存！')
        }
      } catch (error) {
        await alertError('封存失敗，請稍後再試')
      }
    },
    [updateItinerary, updateQuote, quotes]
  )

  // 取消封存
  const handleUnarchive = useCallback(
    async (id: string) => {
      try {
        await updateItinerary(id, { archived_at: null })
        await alertSuccess('已取消封存！')
      } catch (error) {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 刪除行程
  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要永久刪除這個行程嗎？此操作無法復原！', {
        type: 'warning',
        title: '永久刪除行程',
      })
      if (confirmed) {
        try {
          await deleteItinerary(id)
          await alertSuccess('已永久刪除！')
        } catch (error) {
          await alertError('刪除失敗，請稍後再試')
        }
      }
    },
    [deleteItinerary]
  )

  // 設為公司範例
  const handleSetTemplate = useCallback(
    async (id: string, isTemplate: boolean) => {
      try {
        await updateItinerary(id, { is_template: isTemplate })
        await alertSuccess(isTemplate ? '已設為公司範例！' : '已取消公司範例！')
      } catch (error) {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 手動結案
  const handleClose = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要結案這個行程嗎？結案後仍可在「結案」分頁中查看。', {
        type: 'warning',
        title: '結案行程',
      })
      if (confirmed) {
        try {
          await updateItinerary(id, { closed_at: new Date().toISOString() })
          await alertSuccess('已結案！')
        } catch (error) {
          await alertError('結案失敗，請稍後再試')
        }
      }
    },
    [updateItinerary]
  )

  // 取消結案
  const handleReopen = useCallback(
    async (id: string) => {
      try {
        await updateItinerary(id, { closed_at: null })
        await alertSuccess('已重新開啟！')
      } catch (error) {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 處理行程點擊
  const handleRowClick = useCallback(
    (itinerary: Itinerary) => {
      if (itinerary.status === '進行中') {
        pageState.setPendingEditId(itinerary.id)
        pageState.setPasswordInput('')
        pageState.setIsPasswordDialogOpen(true)
      } else {
        router.push(`/itinerary/new?itinerary_id=${itinerary.id}`)
      }
    },
    [router, pageState]
  )

  // 密碼驗證
  const handlePasswordSubmit = useCallback(() => {
    if (pageState.passwordInput === COMPANY_PASSWORD) {
      pageState.setIsPasswordDialogOpen(false)
      if (pageState.pendingEditId) {
        router.push(`/itinerary/new?itinerary_id=${pageState.pendingEditId}`)
      }
    } else {
      alertError('密碼錯誤！')
    }
  }, [pageState, router])

  // 判斷行程是否已結案
  const isItineraryClosed = useCallback((itinerary: Itinerary) => {
    if (itinerary.closed_at) return true
    if (itinerary.is_template) return false
    if (itinerary.departure_date) {
      const departureDate = new Date(itinerary.departure_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return departureDate < today
    }
    return false
  }, [])

  // 表格配置
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
          <span className="text-sm text-morandi-muted">
            {new Date(itinerary.created_at).toLocaleDateString('zh-TW')}
          </span>
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
                  const shortId = itinerary.id.replace(/-/g, '').substring(0, 8)
                  const shareUrl = itinerary.tour_code
                    ? `${baseUrl}/view/${itinerary.tour_code}`
                    : `${baseUrl}/view/${shortId}`
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
                  className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
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
                    className="p-1 text-blue-500/60 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                      className="p-1 text-morandi-secondary hover:text-green-600 hover:bg-green-50 rounded transition-colors"
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

  // 過濾資料
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries

    switch (pageState.statusFilter) {
      case '提案':
        filtered = filtered.filter(
          item => item.status === '提案' && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '進行中':
        filtered = filtered.filter(
          item => item.status === '進行中' && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '公司範例':
        filtered = filtered.filter(item => item.is_template && !item.archived_at)
        break
      case '結案':
        filtered = filtered.filter(item => isItineraryClosed(item) && !item.archived_at)
        break
      default:
        filtered = filtered.filter(item => !item.archived_at && !item.is_template)
    }

    const effectiveAuthorFilter = pageState.authorFilter === '__mine__' ? user?.id : pageState.authorFilter
    if (effectiveAuthorFilter && effectiveAuthorFilter !== 'all') {
      filtered = filtered.filter(item => item.created_by === effectiveAuthorFilter)
    }

    if (isSuperAdmin) {
      const workspaceFilter = typeof window !== 'undefined' ? localStorage.getItem('itinerary_workspace_filter') : null
      if (workspaceFilter && workspaceFilter !== 'all') {
        filtered = filtered.filter(item => (item as Itinerary & { workspace_id?: string }).workspace_id === workspaceFilter)
      }
    }

    if (pageState.searchTerm) {
      const searchLower = pageState.searchTerm.toLowerCase()
      filtered = filtered.filter(
        item =>
          stripHtml(item.title).toLowerCase().includes(searchLower) ||
          item.country.toLowerCase().includes(searchLower) ||
          item.city.toLowerCase().includes(searchLower) ||
          item.tour_code?.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          stripHtml(item.description).toLowerCase().includes(searchLower)
      )
    }

    filtered = filtered.sort((a, b) => {
      const aLinked = !!a.tour_id
      const bLinked = !!b.tour_id
      if (aLinked && !bLinked) return 1
      if (!aLinked && bLinked) return -1
      return 0
    })

    return filtered
  }, [itineraries, pageState.statusFilter, pageState.searchTerm, isItineraryClosed, pageState.authorFilter, user?.id, isSuperAdmin])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="行程管理"
        showSearch={true}
        searchTerm={pageState.searchTerm}
        onSearchChange={pageState.setSearchTerm}
        searchPlaceholder="搜尋行程..."
      >
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter}
                onClick={() => pageState.setStatusFilter(filter)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  pageState.statusFilter === filter
                    ? 'bg-morandi-gold text-white'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={pageState.authorFilter} onValueChange={pageState.setAuthorFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-sm">
                <SelectValue placeholder="我的行程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__mine__">我的行程</SelectItem>
                <SelectItem value="all">全部作者</SelectItem>
                {employees
                  .filter(emp =>
                    emp.id !== user?.id &&
                    itineraries.some(it => it.created_by === emp.id)
                  )
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.display_name || emp.chinese_name || emp.english_name || emp.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {isSuperAdmin && workspaces.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-morandi-blue" />
              <Select
                value={localStorage.getItem('itinerary_workspace_filter') || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    localStorage.removeItem('itinerary_workspace_filter')
                  } else {
                    localStorage.setItem('itinerary_workspace_filter', value)
                  }
                  window.location.reload()
                }}
              >
                <SelectTrigger className="w-auto min-w-[100px] h-8 text-sm border-morandi-blue/30">
                  <SelectValue placeholder="全部分公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分公司</SelectItem>
                  {workspaces.map((ws: { id: string; name: string }) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ResponsiveHeader>

      {/* 新增行程對話框 */}
      <Dialog open={pageState.isTypeSelectOpen} onOpenChange={pageState.setIsTypeSelectOpen}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-hidden p-0">
          <div className="flex h-full">
            {/* 左側：基本資訊 */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-morandi-gold" />
                  新增行程表
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newItineraryTitle">行程名稱 *</Label>
                  <Input
                    id="newItineraryTitle"
                    placeholder="例：沖繩五日遊"
                    value={formState.newItineraryTitle}
                    onChange={e => formState.setNewItineraryTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newItineraryTourCode">行程編號（選填）</Label>
                  <Input
                    id="newItineraryTourCode"
                    placeholder="例：25JOK21CIG"
                    value={formState.newItineraryTourCode}
                    onChange={e => formState.setNewItineraryTourCode(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>國家</Label>
                  <Select
                    value={formState.newItineraryCountry}
                    onValueChange={formState.setNewItineraryCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇國家" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>出發日期 *</Label>
                    <DatePicker
                      value={formState.newItineraryDepartureDate}
                      onChange={date => formState.setNewItineraryDepartureDate(date)}
                      placeholder="選擇出發日期"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>行程天數 *</Label>
                    <Select
                      value={formState.newItineraryDays}
                      onValueChange={formState.setNewItineraryDays}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇天數" />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8, 9, 10].map(day => (
                          <SelectItem key={day} value={String(day)}>
                            {day} 天
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 航班資訊 */}
                <div className="pt-4 mt-4 relative">
                  <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-morandi-muted/40 to-transparent" />
                  <Label className="text-morandi-secondary mb-3 block">航班資訊（選填）</Label>
                  <div className="space-y-3">
                    {/* 去程航班 */}
                    <div className="p-2 rounded-lg border border-morandi-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">去程</span>
                          {formState.newItineraryOutboundFlight?.departureDate && (
                            <span className="text-xs text-morandi-gold font-medium">({formState.newItineraryOutboundFlight.departureDate})</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={flightSearch.handleSearchOutboundFlight}
                          disabled={flightSearch.loadingOutboundFlight || !formState.newItineraryOutboundFlight?.flightNumber}
                          className="h-5 text-[10px] gap-1 px-2"
                        >
                          {flightSearch.loadingOutboundFlight ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                          查詢
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        <Input placeholder="航班" value={formState.newItineraryOutboundFlight?.flightNumber || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, flightNumber: e.target.value, airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="航空" value={formState.newItineraryOutboundFlight?.airline || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, airline: e.target.value, flightNumber: prev?.flightNumber || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="出發" value={formState.newItineraryOutboundFlight?.departureAirport || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, departureAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="抵達" value={formState.newItineraryOutboundFlight?.arrivalAirport || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, arrivalAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="起飛" value={formState.newItineraryOutboundFlight?.departureTime || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, departureTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="降落" value={formState.newItineraryOutboundFlight?.arrivalTime || ''} onChange={e => formState.setNewItineraryOutboundFlight(prev => ({ ...prev, arrivalTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || 'TPE', arrivalAirport: prev?.arrivalAirport || '', departureTime: prev?.departureTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                      </div>
                    </div>

                    {/* 回程航班 */}
                    <div className="p-2 rounded-lg border border-morandi-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">回程</span>
                          {formState.newItineraryReturnFlight?.departureDate && (
                            <span className="text-xs text-morandi-gold font-medium">({formState.newItineraryReturnFlight.departureDate})</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={flightSearch.handleSearchReturnFlight}
                          disabled={flightSearch.loadingReturnFlight || !formState.newItineraryReturnFlight?.flightNumber}
                          className="h-5 text-[10px] gap-1 px-2"
                        >
                          {flightSearch.loadingReturnFlight ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                          查詢
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        <Input placeholder="航班" value={formState.newItineraryReturnFlight?.flightNumber || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, flightNumber: e.target.value, airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="航空" value={formState.newItineraryReturnFlight?.airline || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, airline: e.target.value, flightNumber: prev?.flightNumber || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="出發" value={formState.newItineraryReturnFlight?.departureAirport || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, departureAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="抵達" value={formState.newItineraryReturnFlight?.arrivalAirport || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, arrivalAirport: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', departureTime: prev?.departureTime || '', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="起飛" value={formState.newItineraryReturnFlight?.departureTime || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, departureTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', arrivalTime: prev?.arrivalTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                        <Input placeholder="降落" value={formState.newItineraryReturnFlight?.arrivalTime || ''} onChange={e => formState.setNewItineraryReturnFlight(prev => ({ ...prev, arrivalTime: e.target.value, flightNumber: prev?.flightNumber || '', airline: prev?.airline || '', departureAirport: prev?.departureAirport || '', arrivalAirport: prev?.arrivalAirport || 'TPE', departureTime: prev?.departureTime || '', departureDate: prev?.departureDate || '' }))} className="text-[10px] h-7" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 按鈕 */}
                <div className="flex justify-end gap-2 pt-4 mt-2 relative">
                  <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-morandi-muted/40 to-transparent" />
                  <Button
                    variant="outline"
                    onClick={() => pageState.setIsTypeSelectOpen(false)}
                    disabled={formState.isCreatingItinerary}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateItinerary}
                    disabled={formState.isCreatingItinerary || !formState.newItineraryTitle.trim() || !formState.newItineraryDepartureDate || !formState.newItineraryDays}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
                  >
                    {formState.isCreatingItinerary ? (
                      <>建立中...</>
                    ) : (
                      <>
                        <Plane size={14} />
                        建立行程
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 中間分隔線 */}
            <div className="flex items-center py-8">
              <div className="w-px h-full bg-gradient-to-b from-transparent via-morandi-muted/40 to-transparent" />
            </div>

            {/* 右側：每日行程預覽 */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-sm font-bold text-morandi-primary mb-4">每日行程</h3>
              {formState.newItineraryDays ? (
                <div className="space-y-3">
                  {Array.from({ length: parseInt(formState.newItineraryDays) }, (_, i) => {
                    const dayNum = i + 1
                    const isFirst = dayNum === 1
                    const isLast = dayNum === parseInt(formState.newItineraryDays)
                    let dateLabel = ''
                    if (formState.newItineraryDepartureDate) {
                      const date = new Date(formState.newItineraryDepartureDate)
                      date.setDate(date.getDate() + i)
                      dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
                    }
                    const dayData = formState.newItineraryDailyData[i] || { title: '', breakfast: '', lunch: '', dinner: '', accommodation: '' }
                    const updateDayData = (field: string, value: string) => {
                      formState.setNewItineraryDailyData(prev => {
                        const updated = [...prev]
                        updated[i] = { ...updated[i], [field]: value }
                        return updated
                      })
                    }
                    return (
                      <div key={dayNum} className="p-3 rounded-lg border border-morandi-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-morandi-gold text-white text-xs font-bold px-2 py-0.5 rounded">
                            Day {dayNum}
                          </span>
                          {dateLabel && <span className="text-xs text-slate-500">({dateLabel})</span>}
                        </div>
                        <Input
                          placeholder={isFirst ? '抵達目的地' : isLast ? '返回台灣' : '每日標題'}
                          className="h-8 text-sm mb-2"
                          value={dayData.title}
                          onChange={e => updateDayData('title', e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder={isFirst ? '溫暖的家' : '早餐'}
                            className="h-8 text-xs"
                            value={dayData.breakfast}
                            onChange={e => updateDayData('breakfast', e.target.value)}
                          />
                          <Input
                            placeholder="午餐"
                            className="h-8 text-xs"
                            value={dayData.lunch}
                            onChange={e => updateDayData('lunch', e.target.value)}
                          />
                          <Input
                            placeholder="晚餐"
                            className="h-8 text-xs"
                            value={dayData.dinner}
                            onChange={e => updateDayData('dinner', e.target.value)}
                          />
                        </div>
                        {!isLast && (
                          <Input
                            placeholder="住宿飯店"
                            className="h-8 text-xs mt-2"
                            value={dayData.accommodation}
                            onChange={e => updateDayData('accommodation', e.target.value)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  請先選擇行程天數
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密碼解鎖對話框 */}
      <Dialog open={pageState.isPasswordDialogOpen} onOpenChange={pageState.setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>編輯進行中行程</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-morandi-secondary mb-4">
              此行程已綁定旅遊團，為避免誤觸修改，請輸入公司密碼以解鎖編輯。
            </p>
            <Input
              type="password"
              placeholder="請輸入公司密碼"
              value={pageState.passwordInput}
              onChange={e => pageState.setPasswordInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => pageState.setIsPasswordDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handlePasswordSubmit}>
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 複製行程對話框 */}
      <Dialog open={pageState.isDuplicateDialogOpen} onOpenChange={pageState.setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>複製行程</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-morandi-secondary">
              正在複製：<span className="font-medium text-morandi-primary">{stripHtml(pageState.duplicateSource?.title)}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="duplicateTourCode">行程編號 *</Label>
              <Input
                id="duplicateTourCode"
                placeholder="請輸入新的行程編號"
                value={pageState.duplicateTourCode}
                onChange={e => pageState.setDuplicateTourCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateTitle">行程名稱 *</Label>
              <Input
                id="duplicateTitle"
                placeholder="請輸入新的行程名稱"
                value={pageState.duplicateTitle}
                onChange={e => pageState.setDuplicateTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && pageState.duplicateTourCode.trim() && pageState.duplicateTitle.trim()) {
                    handleDuplicateSubmit()
                  }
                }}
              />
            </div>
            <p className="text-xs text-morandi-muted">
              封面、行程內容、圖片等將會完整複製。<br />
              關聯的報價單也會一併複製（客戶資料會清空，價格保留）。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => pageState.setIsDuplicateDialogOpen(false)}
              disabled={pageState.isDuplicating}
            >
              取消
            </Button>
            <Button
              onClick={handleDuplicateSubmit}
              disabled={pageState.isDuplicating || !pageState.duplicateTourCode.trim() || !pageState.duplicateTitle.trim()}
            >
              {pageState.isDuplicating ? '複製中...' : '確認複製'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns as TableColumn[]}
            data={filteredItineraries}
            onRowClick={(itinerary) => handleRowClick(itinerary as Itinerary)}
            rowClassName={(row) => {
              const itinerary = row as Itinerary
              if (itinerary.tour_id) {
                return 'bg-morandi-blue/5 hover:bg-morandi-blue/10'
              }
              if (!itinerary.tour_id && !itinerary.is_template) {
                return 'bg-red-50/50 hover:bg-red-100/50'
              }
              return ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
