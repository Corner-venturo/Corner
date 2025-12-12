'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { MapPin, Eye, Copy, Archive, Trash2, RotateCcw, Building2, CheckCircle2, Globe, FileEdit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useItineraries, useEmployees } from '@/hooks/cloud-hooks'
import { useRegionsStore } from '@/stores/region-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Itinerary } from '@/stores/types'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'

const statusFilters = ['全部', '草稿', '已發布', '公司範例', '結案']

// 公司密碼（統編）
const COMPANY_PASSWORD = '83212711'

export default function ItineraryPage() {
  const router = useRouter()
  const { items: itineraries, delete: deleteItinerary, update: updateItinerary, create: createItinerary } = useItineraries()
  const { items: employees } = useEmployees()
  const { user } = useAuthStore()
  const regionsStore = useRegionsStore()
  const countries = regionsStore.countries
  const cities = regionsStore.cities

  // 所有 useState hooks 集中在一起
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [authorFilter, setAuthorFilter] = useState<string>('') // 預設空字串表示當前登入者
  const [searchTerm, setSearchTerm] = useState('')
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<Itinerary | null>(null)
  const [duplicateTourCode, setDuplicateTourCode] = useState('')
  const [duplicateTitle, setDuplicateTitle] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  // 載入地區資料（只執行一次）
  React.useEffect(() => {
    regionsStore.fetchAll()
     
  }, [])

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

  // 打開類型選擇對話框
  const handleOpenTypeSelect = useCallback(() => {
    setIsTypeSelectOpen(true)
  }, [])

  // 選擇網頁版行程表
  const handleSelectWeb = () => {
    setIsTypeSelectOpen(false)
    router.push('/itinerary/new')
  }


  // 選擇 Gemini AI 行程表
  const handleSelectGemini = () => {
    setIsTypeSelectOpen(false)
    router.push('/itinerary/new?type=gemini')
  }

  // 打開複製行程對話框
  const handleOpenDuplicateDialog = useCallback((itinerary: Itinerary) => {
    setDuplicateSource(itinerary)
    setDuplicateTourCode('')
    setDuplicateTitle('')
    setIsDuplicateDialogOpen(true)
  }, [])

  // 執行複製行程
  const handleDuplicateSubmit = useCallback(async () => {
    if (!duplicateSource) return
    if (!duplicateTourCode.trim() || !duplicateTitle.trim()) {
      await alertError('請填寫行程編號和行程名稱')
      return
    }

    setIsDuplicating(true)
    try {
      // 複製所有欄位，但排除 id, created_at, updated_at 並覆蓋 tour_code, title, created_by
      const {
        id: _id,
        created_at: _createdAt,
        updated_at: _updatedAt,
        created_by: _createdBy, // 作者改為當前登入者
        tour_id: _tourId, // 複製的行程不關聯原有的團
        is_template: _isTemplate, // 複製的行程不是公司範例
        closed_at: _closedAt, // 複製的行程不是結案狀態
        archived_at: _archivedAt, // 複製的行程不是封存狀態
        ...restData
      } = duplicateSource

      const newItinerary = {
        ...restData,
        tour_code: duplicateTourCode.trim(),
        title: duplicateTitle.trim(),
        status: 'draft' as const, // 複製的行程預設為草稿
        created_by: user?.id, // 作者為當前登入者
      }

      await createItinerary(newItinerary)
      await alertSuccess('行程已複製成功！')
      setIsDuplicateDialogOpen(false)
      setDuplicateSource(null)
      setDuplicateTourCode('')
      setDuplicateTitle('')
    } catch (error) {
      await alertError('複製失敗，請稍後再試')
    } finally {
      setIsDuplicating(false)
    }
  }, [duplicateSource, duplicateTourCode, duplicateTitle, createItinerary, user?.id])

  // 封存行程
  const handleArchive = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要封存這個行程嗎？封存後可在「封存」分頁中找到。', {
        type: 'warning',
        title: '封存行程',
      })
      if (confirmed) {
        try {
          await updateItinerary(id, { archived_at: new Date().toISOString() })
          await alertSuccess('已封存！')
        } catch (error) {
          await alertError('封存失敗，請稍後再試')
        }
      }
    },
    [updateItinerary]
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

  // 刪除行程（僅封存列表可用）
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

  // 發布行程
  const handlePublish = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要發布這個行程嗎？發布後需要密碼才能編輯。', {
        type: 'warning',
        title: '發布行程',
      })
      if (confirmed) {
        try {
          await updateItinerary(id, { status: 'published' })
          await alertSuccess('已發布！')
        } catch (error) {
          await alertError('發布失敗，請稍後再試')
        }
      }
    },
    [updateItinerary]
  )

  // 取消發布（改回草稿）
  const handleUnpublish = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要取消發布嗎？行程將變回草稿狀態。', {
        type: 'warning',
        title: '取消發布',
      })
      if (confirmed) {
        try {
          await updateItinerary(id, { status: 'draft' })
          await alertSuccess('已改回草稿！')
        } catch (error) {
          await alertError('操作失敗，請稍後再試')
        }
      }
    },
    [updateItinerary]
  )

  // 處理行程點擊（已發布需密碼解鎖）
  const handleRowClick = useCallback(
    (itinerary: Itinerary) => {
      // 如果是已發布狀態，需要密碼解鎖
      if (itinerary.status === 'published') {
        setPendingEditId(itinerary.id)
        setPasswordInput('')
        setIsPasswordDialogOpen(true)
      } else {
        router.push(`/itinerary/${itinerary.id}`)
      }
    },
    [router]
  )

  // 密碼驗證
  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === COMPANY_PASSWORD) {
      setIsPasswordDialogOpen(false)
      if (pendingEditId) {
        router.push(`/itinerary/${pendingEditId}`)
      }
    } else {
      alertError('密碼錯誤！')
    }
  }, [passwordInput, pendingEditId, router])

  // 判斷行程是否已結案（手動結案或日期過期）
  const isItineraryClosed = useCallback((itinerary: Itinerary) => {
    // 手動結案
    if (itinerary.closed_at) return true
    // 公司範例不會因為日期過期而結案
    if (itinerary.is_template) return false
    // 日期過期自動結案
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
        render: (_value, itinerary) => (
          <span className="text-sm text-morandi-secondary font-mono">
            {itinerary.tour_code || '-'}
          </span>
        ),
      },
      {
        key: 'title',
        label: '行程名稱',
        sortable: true,
        render: (_value, itinerary) => (
          <span className="text-sm font-medium text-morandi-primary">{itinerary.title}</span>
        ),
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
          // 排除備案，只計算主行程天數
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

          // 優先顯示結案狀態
          if (isClosed) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                結案
              </span>
            )
          }
          // 公司範例顯示特殊標籤
          if (isTemplate) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-gold/10 text-morandi-gold">
                <Building2 size={10} />
                公司範例
              </span>
            )
          }
          // 一般狀態
          if (itinerary.status === 'published') {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-green/10 text-morandi-green">
                已發布
              </span>
            )
          }
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-muted/20 text-morandi-secondary">
              草稿
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
          const isPublished = itinerary.status === 'published'
          const isDraft = itinerary.status === 'draft' || !itinerary.status

          return (
            <div className="flex items-center gap-1">
              {/* 發布/取消發布 - 只有非公司範例才顯示 */}
              {!isTemplate && !isClosed && !isArchived && (
                isPublished ? (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleUnpublish(itinerary.id)
                    }}
                    className="p-1 text-morandi-green hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                    title="取消發布（改回草稿）"
                  >
                    <FileEdit size={14} />
                  </button>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handlePublish(itinerary.id)
                    }}
                    className="p-1 text-morandi-secondary hover:text-morandi-green hover:bg-morandi-green/10 rounded transition-colors"
                    title="發布行程"
                  >
                    <Globe size={14} />
                  </button>
                )
              )}

              {/* 產生分享連結 */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                  const shareUrl = `${baseUrl}/view/${itinerary.id}`
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

              {/* 複製行程 */}
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

              {/* 公司範例：永遠顯示取消範例按鈕 */}
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

              {/* 非公司範例的結案相關操作 */}
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
                    {/* 設為公司範例 */}
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

                    {/* 結案按鈕 */}
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

              {/* 封存操作 */}
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
    [handleDelete, handleOpenDuplicateDialog, handleArchive, handleUnarchive, handleSetTemplate, handleClose, handleReopen, isItineraryClosed, getEmployeeName, getCountryName, getCityName]
  )

  // 過濾資料
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries

    // 狀態篩選（移除封存分頁，改用新的五種分頁）
    switch (statusFilter) {
      case '草稿':
        // 草稿：未發布、未結案、未封存
        filtered = filtered.filter(
          item => item.status === 'draft' && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '已發布':
        // 已發布：已發布、未結案、未封存、非公司範例
        filtered = filtered.filter(
          item => item.status === 'published' && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '公司範例':
        // 公司範例：is_template = true、未封存
        filtered = filtered.filter(item => item.is_template && !item.archived_at)
        break
      case '結案':
        // 結案：手動結案或日期過期、未封存
        filtered = filtered.filter(item => isItineraryClosed(item) && !item.archived_at)
        break
      default:
        // 全部：排除封存的和公司範例
        filtered = filtered.filter(item => !item.archived_at && !item.is_template)
    }

    // 作者篩選
    const effectiveAuthorFilter = authorFilter === '' ? user?.id : authorFilter
    if (effectiveAuthorFilter && effectiveAuthorFilter !== 'all') {
      filtered = filtered.filter(item => item.created_by === effectiveAuthorFilter)
    }

    // 搜尋 - 搜尋所有文字欄位
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.country.toLowerCase().includes(searchLower) ||
          item.city.toLowerCase().includes(searchLower) ||
          item.tour_code?.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [itineraries, statusFilter, searchTerm, isItineraryClosed, authorFilter, user?.id])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="行程管理"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋行程..."
        onAdd={handleOpenTypeSelect}
        addLabel="新增行程"
      >
        {/* 狀態篩選 + 作者篩選 */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === filter
                    ? 'bg-morandi-gold text-white'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* 作者篩選 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-morandi-secondary">作者：</span>
            <select
              value={authorFilter}
              onChange={e => setAuthorFilter(e.target.value)}
              className="px-3 py-1 text-sm rounded-lg border border-morandi-border bg-white text-morandi-primary focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
            >
              <option value="">我的行程</option>
              <option value="all">全部作者</option>
              {employees
                .filter(emp => itineraries.some(it => it.created_by === emp.id))
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.display_name || emp.chinese_name || emp.english_name || emp.email}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </ResponsiveHeader>

      {/* 類型選擇對話框 */}
      <Dialog open={isTypeSelectOpen} onOpenChange={setIsTypeSelectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>選擇行程表類型</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={handleSelectWeb}
              className="w-full h-20 flex-col bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <div className="text-lg font-bold">網頁版行程表</div>
              <div className="text-xs opacity-80">可編輯的動態行程表（適合線上分享）</div>
            </Button>
            <Button
              onClick={handleSelectGemini}
              className="w-full h-20 flex-col bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <div className="text-lg font-bold">✨ Gemini AI 行程表</div>
              <div className="text-xs opacity-80">AI 智慧生成內容與插圖（實驗功能）</div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密碼解鎖對話框 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>編輯已發布行程</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-morandi-secondary mb-4">
              此行程已發布，為避免誤觸修改，請輸入公司密碼以解鎖編輯。
            </p>
            <Input
              type="password"
              placeholder="請輸入公司密碼"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
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
              onClick={() => setIsPasswordDialogOpen(false)}
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
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>複製行程</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-morandi-secondary">
              正在複製：<span className="font-medium text-morandi-primary">{duplicateSource?.title}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="duplicateTourCode">行程編號 *</Label>
              <Input
                id="duplicateTourCode"
                placeholder="請輸入新的行程編號"
                value={duplicateTourCode}
                onChange={e => setDuplicateTourCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateTitle">行程名稱 *</Label>
              <Input
                id="duplicateTitle"
                placeholder="請輸入新的行程名稱"
                value={duplicateTitle}
                onChange={e => setDuplicateTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && duplicateTourCode.trim() && duplicateTitle.trim()) {
                    handleDuplicateSubmit()
                  }
                }}
              />
            </div>
            <p className="text-xs text-morandi-muted">
              其他資料（封面、行程內容、圖片等）將會完整複製。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
              disabled={isDuplicating}
            >
              取消
            </Button>
            <Button
              onClick={handleDuplicateSubmit}
              disabled={isDuplicating || !duplicateTourCode.trim() || !duplicateTitle.trim()}
            >
              {isDuplicating ? '複製中...' : '確認複製'}
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
          />
        </div>
      </div>
    </div>
  )
}
