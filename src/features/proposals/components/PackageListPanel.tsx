'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Edit2,
  Trash2,
  Check,
  FileText,
  Book,
  Globe,
  DollarSign,
  ClipboardList,
  BookMarked,
} from 'lucide-react'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { logger } from '@/lib/utils/logger'
import {
  createPackage,
  updatePackage,
  duplicatePackage,
  deletePackage,
} from '@/services/proposal.service'
import { PackageDialog } from './PackageDialog'
import { PackageItineraryDialog } from './PackageItineraryDialog'
import { BrochurePreviewDialog } from './BrochurePreviewDialog'
import { RequirementSyncDialog } from './RequirementSyncDialog'
import type { Proposal, ProposalPackage, CreatePackageData } from '@/types/proposal.types'
import { PROPOSAL_LABELS } from '../constants'

interface PackageListPanelProps {
  proposal: Proposal
  packages: ProposalPackage[]
  onPackagesChange: () => void
  showAddDialog?: boolean
  onShowAddDialogChange?: (show: boolean) => void
  /** 當任何子 Dialog 開啟/關閉時回調（用於單一遮罩模式） */
  onChildDialogChange?: (isOpen: boolean) => void
  /** 開啟行程表對話框（由父組件管理，用於單一遮罩模式） */
  onOpenItineraryDialog?: (pkg: ProposalPackage) => void
  /** 當導航離開（如轉開團）時回調，用於關閉父 Dialog */
  onNavigateAway?: () => void
}

export function PackageListPanel({
  proposal,
  packages,
  onPackagesChange,
  showAddDialog,
  onShowAddDialogChange,
  onChildDialogChange,
  onOpenItineraryDialog,
  onNavigateAway,
}: PackageListPanelProps) {
  const router = useRouter()
  const { user } = useAuthStore()

  // 直接查詢國家列表（避免 useCountries 的認證狀態問題）
  // 排序與 useTourDestinations 一致：usage_count DESC → display_order ASC → name ASC
  const [countries, setCountries] = useState<Array<{ id: string; name: string; is_active: boolean }>>([])
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase
        .from('countries')
        .select('id, name, is_active, usage_count')
        .eq('is_active', true)
        .order('usage_count', { ascending: false, nullsFirst: false })
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
      if (data) {
        // 過濾掉 is_active 為 null 的資料
        setCountries(data.filter(c => c.is_active === true) as Array<{ id: string; name: string; is_active: boolean }>)
      }
    }
    fetchCountries()
  }, [])

  // 取得目的地顯示名稱（國家 + 機場代碼）
  // 現在 country_id 存放國家名稱, main_city_id 存放機場代碼
  const getLocationName = useCallback((country?: string | null, airportCode?: string | null) => {
    if (country && airportCode) {
      return `${country} (${airportCode})`
    }
    if (country) return country
    if (airportCode) return airportCode
    return '-'
  }, [])

  // 使用外部控制或內部狀態
  const [internalAddDialogOpen, setInternalAddDialogOpen] = useState(false)
  const addDialogOpen = showAddDialog ?? internalAddDialogOpen
  const setAddDialogOpen = onShowAddDialogChange ?? setInternalAddDialogOpen
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itineraryDialogOpen, setItineraryDialogOpen] = useState(false)
  const [brochureDialogOpen, setBrochureDialogOpen] = useState(false)
  const [requirementDialogOpen, setRequirementDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<ProposalPackage | null>(null)

  // 注意：已移除 onChildDialogChange 邏輯，改用 Dialog level 系統處理多重遮罩

  // 新增套件
  const handleCreatePackage = useCallback(
    async (data: CreatePackageData | Partial<CreatePackageData>) => {
      if (!user?.id) {
        await alert(PROPOSAL_LABELS.packageList.cannotGetUserInfo, 'error')
        return
      }

      try {
        // CreatePackageData requires proposal_id and version_name, which are set in the dialog
        await createPackage(data as CreatePackageData, user.id)
        onPackagesChange()
        setAddDialogOpen(false)
      } catch (error) {
        await alert(PROPOSAL_LABELS.packageList.createPackageFailed, 'error')
      }
    },
    [user?.id, user?.workspace_id, onPackagesChange]
  )

  // 更新套件
  const handleUpdatePackage = useCallback(
    async (data: CreatePackageData | Partial<CreatePackageData>) => {
      if (!selectedPackage || !user?.id) return

      try {
        await updatePackage(selectedPackage.id, data, user.id)
        onPackagesChange()
        setEditDialogOpen(false)
        setSelectedPackage(null)
      } catch (error) {
        await alert(PROPOSAL_LABELS.packageList.updatePackageFailed, 'error')
      }
    },
    [selectedPackage, user?.id, onPackagesChange]
  )

  // 複製套件
  const handleDuplicatePackage = useCallback(
    async (pkg: ProposalPackage) => {
      if (!user?.id) return

      const newVersionName = `${pkg.version_name} ${PROPOSAL_LABELS.packageList.copySuffix}`
      try {
        await duplicatePackage(pkg.id, newVersionName, user.id)
        onPackagesChange()
      } catch (error) {
        await alert(PROPOSAL_LABELS.packageList.copyPackageFailed, 'error')
      }
    },
    [user?.id, user?.workspace_id, onPackagesChange]
  )

  // 刪除套件
  const handleDeletePackage = useCallback(
    async (pkg: ProposalPackage) => {
      const confirmed = await confirm(
        `確定要刪除套件「${pkg.version_name}」嗎？`,
        { type: 'warning', title: '刪除套件' }
      )

      if (confirmed) {
        try {
          await deletePackage(pkg.id)
          onPackagesChange()
        } catch (error) {
          await alert('刪除套件失敗', 'error')
        }
      }
    },
    [onPackagesChange]
  )

  // 開啟行程表對話框
  const openItineraryDialog = useCallback((pkg: ProposalPackage) => {
    setSelectedPackage(pkg)
    setItineraryDialogOpen(true)
  }, [])

  // 開啟編輯對話框
  const openEditDialog = useCallback((pkg: ProposalPackage) => {
    setSelectedPackage(pkg)
    setEditDialogOpen(true)
  }, [])

  // 轉開團 - 導向旅遊團頁面（使用跟直接開團一樣的表單）
  const handleConvertToTour = useCallback((pkg: ProposalPackage) => {
    // 先關閉父 Dialog（避免轉開團成功後還顯示舊的 Dialog）
    onNavigateAway?.()
    // 帶上 proposal 和 package 資訊到 /tours 頁面
    const params = new URLSearchParams({
      action: 'create',
      fromProposal: proposal.id,
      packageId: pkg.id,
    })
    router.push(`/tours?${params.toString()}`)
  }, [proposal.id, router, onNavigateAway])

  // 建立或開啟報價單
  const handleQuoteClick = useCallback(
    async (pkg: ProposalPackage) => {
      if (pkg.quote_id) {
        // 已有報價單，直接跳轉
        router.push(`/quotes/${pkg.quote_id}`)
        return
      }

      // 建立新報價單
      try {
        const destinationDisplay = pkg.country_id && pkg.main_city_id
          ? `${pkg.country_id} (${pkg.main_city_id})`
          : pkg.country_id || ''

        // 計算住宿天數（總天數 - 1，最後一天不住宿）
        let accommodationDays = 0
        if (pkg.start_date && pkg.end_date) {
          const start = new Date(pkg.start_date)
          const end = new Date(pkg.end_date)
          const diffTime = Math.abs(end.getTime() - start.getTime())
          const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
          accommodationDays = Math.max(0, totalDays - 1)
        }

        // 從行程表帶入住宿和餐飲資料
        let categories = null
        if (pkg.itinerary_id) {
          const { data: itinerary } = await supabase
            .from('itineraries')
            .select('daily_itinerary')
            .eq('id', pkg.itinerary_id)
            .single()

          if (itinerary?.daily_itinerary && Array.isArray(itinerary.daily_itinerary)) {
            const dailyData = itinerary.daily_itinerary as Array<{
              accommodation?: string
              meals?: { breakfast?: string; lunch?: string; dinner?: string }
            }>

            // 建立住宿項目
            const accommodationItems = dailyData
              .slice(0, -1) // 最後一天不住宿
              .map((day, idx) => ({
                id: `accommodation-day${idx + 1}-${Date.now()}-${idx}`,
                name: day.accommodation || '',
                quantity: 0,
                unit_price: 0,
                total: 0,
                note: '',
                day: idx + 1,
                room_type: '',
              }))

            // 建立餐飲項目
            const mealItems: Array<{
              id: string
              name: string
              quantity: number
              unit_price: number
              total: number
              note: string
            }> = []
            dailyData.forEach((day, idx) => {
              const dayLabel = `Day${idx + 1}`
              if (day.meals?.lunch && day.meals.lunch !== '自理') {
                mealItems.push({
                  id: `meal-lunch-day${idx + 1}-${Date.now()}`,
                  name: `${dayLabel} 午餐：${day.meals.lunch}`,
                  quantity: 0,
                  unit_price: 0,
                  total: 0,
                  note: '',
                })
              }
              if (day.meals?.dinner && day.meals.dinner !== '自理') {
                mealItems.push({
                  id: `meal-dinner-day${idx + 1}-${Date.now()}`,
                  name: `${dayLabel} 晚餐：${day.meals.dinner}`,
                  quantity: 0,
                  unit_price: 0,
                  total: 0,
                  note: '',
                })
              }
            })

            // 建立完整的 categories
            categories = [
              { id: 'transport', name: '交通', items: [], total: 0 },
              { id: 'group-transport', name: '團體分攤', items: [], total: 0 },
              { id: 'accommodation', name: '住宿', items: accommodationItems, total: 0 },
              { id: 'meals', name: '餐飲', items: mealItems, total: 0 },
              { id: 'activities', name: '活動', items: [], total: 0 },
              { id: 'others', name: '其他', items: [], total: 0 },
              { id: 'guide', name: '領隊導遊', items: [], total: 0 },
            ]

            // 更新住宿天數
            accommodationDays = accommodationItems.length
          }
        }

        // 設定預設人數（全部算成人）
        const groupSize = pkg.group_size || proposal.group_size || 0
        const participantCounts = {
          adult: groupSize,
          child_with_bed: 0,
          child_no_bed: 0,
          single_room: 0,
          infant: 0,
        }

        const { data: newQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            id: crypto.randomUUID(),
            name: proposal.title || pkg.version_name,
            customer_name: proposal.customer_name || '待填寫',
            quote_type: 'standard',
            status: 'draft',
            destination: destinationDisplay,
            start_date: pkg.start_date || proposal.expected_start_date,
            end_date: pkg.end_date || proposal.expected_end_date,
            group_size: groupSize,
            participant_counts: participantCounts,
            proposal_package_id: pkg.id,
            workspace_id: user?.workspace_id,
            created_by: user?.id,
            itinerary_id: pkg.itinerary_id || null,
            accommodation_days: accommodationDays,
            categories: categories,
          })
          .select()
          .single()

        if (quoteError) {
          logger.error('建立報價單失敗:', quoteError.message)
          await alert('建立報價單失敗', 'error')
          return
        }

        if (newQuote) {
          // 更新套件關聯報價單
           
          await dynamicFrom('proposal_packages')
            .update({ quote_id: newQuote.id })
            .eq('id', pkg.id)

          onPackagesChange()
          router.push(`/quotes/${newQuote.id}`)
        }
      } catch (error) {
        logger.error('建立報價單時發生錯誤:', error)
        await alert('建立報價單失敗', 'error')
      }
    },
    [router, proposal, user, onPackagesChange]
  )

  // 已轉團的提案不能再操作
  const isConverted = proposal.status === 'converted'
  const isArchived = proposal.status === 'archived'
  const canEdit = !isConverted && !isArchived

  return (
    <div className="pt-4 h-full flex flex-col">
      <div className="flex-1 border border-border rounded-lg overflow-hidden min-h-[260px]">
        {packages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-morandi-secondary text-center">
            尚無版本
          </div>
        ) : (
          <div className="h-full flex flex-col">
          <table className="w-full">
            <thead>
              <tr className="bg-morandi-container/40 border-b border-border/60">
                <th className="px-4 py-2 text-left text-xs font-medium text-morandi-secondary">版本</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-morandi-secondary">目的地</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-morandi-secondary">日期</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-morandi-secondary">人數</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-morandi-secondary">操作</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-morandi-secondary"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr
                  key={pkg.id}
                  className={`border-b border-border/60 hover:bg-morandi-gold/5 ${
                    pkg.is_selected ? 'bg-morandi-gold/10' : ''
                  }`}
                >
                  {/* 版本名稱 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-morandi-primary">
                        {pkg.version_name}
                      </span>
                      {pkg.is_selected && (
                        <Check size={14} className="text-morandi-gold" />
                      )}
                    </div>
                  </td>

                  {/* 目的地 */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-morandi-primary">
                      {getLocationName(pkg.country_id, pkg.main_city_id)}
                    </span>
                  </td>

                  {/* 日期 */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-morandi-primary">
                      {pkg.start_date || '-'}
                    </span>
                  </td>

                  {/* 人數 */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-morandi-primary">
                      {pkg.group_size ? `${pkg.group_size}人` : '-'}
                    </span>
                  </td>

                  {/* 操作按鈕 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* 行程表按鈕 - 直接開啟（已整合時間軸功能） */}
                      <button
                        onClick={() => {
                          if (onOpenItineraryDialog) {
                            onOpenItineraryDialog(pkg)
                          } else {
                            openItineraryDialog(pkg)
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          pkg.itinerary_id
                            ? 'text-morandi-green hover:bg-morandi-green/10'
                            : 'text-morandi-secondary hover:bg-morandi-container/80'
                        }`}
                        title="行程表"
                      >
                        <FileText size={16} />
                      </button>
                      {/* 簡易行程預覽 */}
                      <button
                        onClick={() => {
                          if (pkg.itinerary_id) {
                            setSelectedPackage(pkg)
                            setBrochureDialogOpen(true)
                          } else {
                            void alert('請先建立行程表', 'info')
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          pkg.itinerary_id
                            ? 'text-morandi-green hover:bg-morandi-green/10'
                            : 'text-morandi-muted cursor-not-allowed'
                        }`}
                        title="簡易行程預覽"
                        disabled={!pkg.itinerary_id}
                      >
                        <Book size={16} />
                      </button>
                      {/* 網頁行程 */}
                      <button
                        onClick={() => {
                          if (pkg.itinerary_id) {
                            router.push(`/itinerary/new?itinerary_id=${pkg.itinerary_id}`)
                          } else {
                            void alert('請先建立行程表', 'info')
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          pkg.itinerary_id
                            ? 'text-morandi-green hover:bg-morandi-green/10'
                            : 'text-morandi-muted cursor-not-allowed'
                        }`}
                        title="網頁行程"
                        disabled={!pkg.itinerary_id}
                      >
                        <Globe size={16} />
                      </button>
                      {/* 報價單 */}
                      <button
                        onClick={() => void handleQuoteClick(pkg)}
                        className={`p-1.5 rounded transition-colors ${
                          pkg.quote_id
                            ? 'text-morandi-gold hover:bg-morandi-gold/10'
                            : 'text-morandi-secondary hover:bg-morandi-container/80'
                        }`}
                        title={pkg.quote_id ? '查看報價單' : '建立報價單'}
                      >
                        <DollarSign size={16} />
                      </button>
                      {/* 需求確認單 */}
                      <button
                        onClick={() => {
                          if (pkg.quote_id) {
                            setSelectedPackage(pkg)
                            setRequirementDialogOpen(true)
                          } else {
                            void alert('請先建立報價單', 'info')
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          pkg.quote_id
                            ? 'text-morandi-green hover:bg-morandi-green/10'
                            : 'text-morandi-muted cursor-not-allowed'
                        }`}
                        title="需求確認單"
                        disabled={!pkg.quote_id}
                      >
                        <ClipboardList size={16} />
                      </button>
                      {/* 手冊設計 */}
                      <button
                        onClick={() => {
                          if (pkg.itinerary_id) {
                            router.push(`/brochure?itinerary_id=${pkg.itinerary_id}`)
                          } else {
                            void alert('請先建立行程表', 'info')
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          pkg.itinerary_id
                            ? 'text-morandi-primary hover:bg-morandi-container/80'
                            : 'text-morandi-muted cursor-not-allowed'
                        }`}
                        title="手冊設計"
                        disabled={!pkg.itinerary_id}
                      >
                        <BookMarked size={16} />
                      </button>
                    </div>
                  </td>

                  {/* 操作 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleDuplicatePackage(pkg)}
                            className="p-1 text-morandi-secondary hover:text-morandi-primary"
                            title="複製"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => openEditDialog(pkg)}
                            className="p-1 text-morandi-secondary hover:text-morandi-primary"
                            title="編輯"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg)}
                            className="p-1 text-morandi-red/60 hover:text-morandi-red"
                            title="刪除"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => handleConvertToTour(pkg)}
                            className="ml-1 px-2 py-1 text-xs bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded"
                            title="轉開團"
                          >
                            轉開團
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 新增套件對話框 - 以最後一個套件為基底預填資料 */}
      <PackageDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        mode="create"
        proposalId={proposal.id}
        proposal={proposal}
        basePackage={packages.length > 0 ? packages[packages.length - 1] : null}
        onSubmit={handleCreatePackage}
        countries={countries}
      />

      {/* 編輯套件對話框 */}
      <PackageDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode="edit"
        proposalId={proposal.id}
        proposal={proposal}
        package={selectedPackage}
        onSubmit={handleUpdatePackage}
        countries={countries}
      />

      {/* 行程表對話框（僅在未使用父組件回調時渲染） */}
      {!onOpenItineraryDialog && selectedPackage && (
        <PackageItineraryDialog
          isOpen={itineraryDialogOpen}
          onClose={() => {
            setItineraryDialogOpen(false)
            setSelectedPackage(null)
          }}
          pkg={selectedPackage}
          proposal={proposal}
          onItineraryCreated={onPackagesChange}
        />
      )}

      {/* 簡易行程表對話框 */}
      <BrochurePreviewDialog
        isOpen={brochureDialogOpen}
        onClose={() => {
          setBrochureDialogOpen(false)
          setSelectedPackage(null)
        }}
        itineraryId={selectedPackage?.itinerary_id || null}
      />

      {/* 需求確認單對話框 */}
      <RequirementSyncDialog
        isOpen={requirementDialogOpen}
        onClose={() => {
          setRequirementDialogOpen(false)
          setSelectedPackage(null)
        }}
        pkg={selectedPackage}
        proposal={proposal}
        onSyncComplete={onPackagesChange}
      />
    </div>
  )
}
