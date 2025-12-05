'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { MapPin, Eye, Copy, Archive, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useItineraries, useEmployees } from '@/hooks/cloud-hooks'
import type { Itinerary } from '@/stores/types'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'

const statusFilters = ['全部', '草稿', '已發布', '封存']

export default function ItineraryPage() {
  const router = useRouter()
  const { items: itineraries, delete: deleteItinerary, update: updateItinerary } = useItineraries()
  const { items: employees } = useEmployees()
  const [statusFilter, setStatusFilter] = useState<string>('全部')

  // 根據 created_by ID 查找員工名稱
  const getEmployeeName = useCallback((employeeId?: string) => {
    if (!employeeId) return '-'
    const employee = employees.find(e => e.id === employeeId)
    return employee?.name || '-'
  }, [employees])
  const [searchTerm, setSearchTerm] = useState('')
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)

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
            {itinerary.country} · {itinerary.city}
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
        render: (_value, itinerary) => (
          <span
            className={cn(
              'text-sm font-medium',
              itinerary.status === 'published' ? 'text-green-600' : 'text-gray-600'
            )}
          >
            {itinerary.status === 'published' ? '已發布' : '草稿'}
          </span>
        ),
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
          return (
            <div className="flex items-center gap-1">
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
    [handleDelete, handleDuplicate, handleArchive, handleUnarchive, getEmployeeName]
  )

  // 過濾資料
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries

    // 狀態篩選
    if (statusFilter === '封存') {
      // 顯示已封存的項目
      filtered = filtered.filter(item => !!item.archived_at)
    } else {
      // 其他分頁：只顯示未封存的項目
      filtered = filtered.filter(item => !item.archived_at)

      if (statusFilter === '草稿') {
        filtered = filtered.filter(item => item.status === 'draft')
      } else if (statusFilter === '已發布') {
        filtered = filtered.filter(item => item.status === 'published')
      }
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
  }, [itineraries, statusFilter, searchTerm])

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

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <EnhancedTable
            columns={tableColumns as TableColumn[]}
            data={filteredItineraries}
            onRowClick={(itinerary) => router.push(`/itinerary/${(itinerary as Itinerary).id}`)}
          />
        </div>
      </div>
    </div>
  )
}
