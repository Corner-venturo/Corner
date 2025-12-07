'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { MapPin, Eye, Copy, Archive, Trash2, RotateCcw, Building2, CheckCircle2, Globe, FileEdit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useItineraries, useEmployees } from '@/hooks/cloud-hooks'
import { useRegionsStore } from '@/stores/region-store'
import type { Itinerary } from '@/stores/types'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'

const statusFilters = ['全部', '草稿', '已發布', '公司範例', '結案']

// 公司密碼（統編）
const COMPANY_PASSWORD = '83212711'

export default function ItineraryPage() {
  const router = useRouter()
  const { items: itineraries, delete: deleteItinerary, update: updateItinerary } = useItineraries()
  const { items: employees } = useEmployees()
  const regionsStore = useRegionsStore()
  const countries = regionsStore.countries
  const cities = regionsStore.cities
  const [statusFilter, setStatusFilter] = useState<string>('全部')

  // 載入地區資料（只執行一次）
  React.useEffect(() => {
    regionsStore.fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 根據 created_by ID 查找員工名稱
  const getEmployeeName = useCallback((employeeId?: string) => {
    if (!employeeId) return '-'
    const employee = employees.find(e => e.id === employeeId)
    return employee?.chinese_name || employee?.display_name || '-'
  }, [employees])
  const [searchTerm, setSearchTerm] = useState('')
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)

  // 密碼解鎖對話框狀態
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)

  // 打開類型選擇對話框
  const handleOpenTypeSelect = useCallback(() => {
    setIsTypeSelectOpen(true)
  }, [])

  // 選擇網頁版行程表
  const handleSelectWeb = () => {
    setIsTypeSelectOpen(false)
    router.push('/itinerary/new')
  }

  // 選擇紙本行程表
  const handleSelectPrint = () => {
    setIsTypeSelectOpen(false)
    router.push('/itinerary/new?type=print')
  }

  // 選擇 Gemini AI 行程表
  const handleSelectGemini = () => {
    setIsTypeSelectOpen(false)
    router.push('/itinerary/new?type=gemini')
  }

  // 複製行程
  const handleDuplicate = useCallback(async (id: string) => {
    // 待實作: 複製邏輯
  }, [])

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
        render: (_value, itinerary) => (
          <span className="text-sm text-morandi-secondary">
            {itinerary.daily_itinerary?.length || 0} 天{' '}
            {Math.max(0, (itinerary.daily_itinerary?.length || 0) - 1)} 夜
          </span>
        ),
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
          // 一般狀態（支援中英文 status）
          if (itinerary.status === 'published' || itinerary.status === '已發布') {
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
          const isPublished = itinerary.status === 'published' || itinerary.status === '已發布'
          const isDraft = itinerary.status === 'draft' || itinerary.status === '草稿' || !itinerary.status

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
                  handleDuplicate(itinerary.id)
                }}
                className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
                title="複製行程"
              >
                <Copy size={14} />
              </button>

              {/* 結案相關操作 */}
              {isClosed ? (
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
                  {/* 設為/取消公司範例 */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleSetTemplate(itinerary.id, !isTemplate)
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      isTemplate
                        ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                        : 'text-morandi-secondary hover:text-purple-600 hover:bg-purple-50'
                    )}
                    title={isTemplate ? '取消公司範例' : '設為公司範例'}
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
    [handleDelete, handleDuplicate, handleArchive, handleUnarchive, handleSetTemplate, handleClose, handleReopen, isItineraryClosed, getEmployeeName, getCountryName, getCityName]
  )

  // 過濾資料
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries

    // 狀態篩選（移除封存分頁，改用新的五種分頁）
    switch (statusFilter) {
      case '草稿':
        // 草稿：未發布、未結案、未封存（支援中英文 status）
        filtered = filtered.filter(
          item => (item.status === 'draft' || item.status === '草稿') && !isItineraryClosed(item) && !item.archived_at && !item.is_template
        )
        break
      case '已發布':
        // 已發布：已發布、未結案、未封存、非公司範例（支援中英文 status）
        filtered = filtered.filter(
          item => (item.status === 'published' || item.status === '已發布') && !isItineraryClosed(item) && !item.archived_at && !item.is_template
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
  }, [itineraries, statusFilter, searchTerm, isItineraryClosed])

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
        {/* 狀態篩選 */}
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
              onClick={handleSelectPrint}
              className="w-full h-20 flex-col bg-morandi-green hover:bg-morandi-green/90 text-white"
            >
              <div className="text-lg font-bold">紙本行程表</div>
              <div className="text-xs opacity-80">精美列印版本（適合印刷給客戶）</div>
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
