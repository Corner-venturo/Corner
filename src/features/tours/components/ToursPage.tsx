/**
 * ToursPage - Main tours list page component (Refactored)
 */

'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
// 🔧 優化：移除 useRegionsStore import（不再需要載入 countries/cities）
// 🔧 優化：移除 useOrdersListSlim 和 useItinerariesListSlim（useTourOperations 已內部處理）
import { useQuotesListSlim } from '@/hooks/useListSlim'
import { useTourOperations } from '../hooks/useTourOperations'
import { useTourChannelOperations, TourStoreActions } from './TourChannelOperations'
import { useTourActionButtons } from './TourActionButtons'
import { useToursPage } from '../hooks/useToursPage'
import { useToursDialogs } from '../hooks/useToursDialogs'
import type { Tour } from '@/stores/types'
import { useToursForm } from '../hooks/useToursForm'
import { TourFilters } from './TourFilters'
import { TourTable } from './TourTable'
import { TourForm } from './TourForm'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { ArchiveReasonDialog } from './ArchiveReasonDialog'
import { LinkItineraryToTourDialog } from './LinkItineraryToTourDialog'
import { LinkDocumentsToTourDialog } from './LinkDocumentsToTourDialog'
import { TourItineraryDialog } from './TourItineraryDialog'
import { ContractDialog } from '@/components/contracts/ContractDialog'
import { TourClosingDialog } from './TourClosingDialog'
import { logger } from '@/lib/utils/logger'
import { TourControlDialogWrapper } from './TourControlDialogWrapper'
import { ProposalDialog } from '@/features/proposals/components/ProposalDialog'
import { ProposalsTableContent } from '@/features/proposals/components/ProposalsTableContent'
import { ProposalDetailDialog } from '@/features/proposals/components/ProposalDetailDialog'
import { useProposals } from '@/hooks/cloud-hooks'
import { createProposal, updateProposal, archiveProposal, convertToTour } from '@/services/proposal.service'
import { alert, confirm } from '@/lib/ui/alert-dialog'
import { ArchiveProposalDialog } from '@/features/proposals/components/ArchiveProposalDialog'
// 🔧 優化：移除 useProposalPackages import，改為刪除時才查詢
import type { CreateProposalData, UpdateProposalData, Proposal } from '@/types/proposal.types'

const TourDetailDialog = dynamic(
  () => import('@/components/tours/TourDetailDialog').then(m => m.TourDetailDialog),
  {
    /* eslint-disable venturo/no-custom-modal -- 動態載入時的 loading 狀態 */
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    ),
    ssr: false
  }
)

export const ToursPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuthStore()

  const [tourControlDialogTour, setTourControlDialogTour] = useState<Tour | null>(null)
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [proposalEditDialogOpen, setProposalEditDialogOpen] = useState(false)
  const [proposalArchiveDialogOpen, setProposalArchiveDialogOpen] = useState(false)
  const [proposalDetailDialogOpen, setProposalDetailDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  // 🔧 優化：只保留 quotes（TourActionButtons 需要），其他由 useTourOperations 內部處理
  const { items: quotes } = useQuotesListSlim()
  const { items: proposals, fetchAll: refreshProposals } = useProposals()

  // 🔧 對話框狀態（替代 deprecated useDialog）
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    type: string | null
    data: Tour | null
  }>({ isOpen: false, type: null, data: null })

  const openDialog = useCallback((type: string, data?: unknown) => {
    setDialogState({ isOpen: true, type, data: (data as Tour) || null })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogState({ isOpen: false, type: null, data: null })
  }, [])

  // 🔧 優化：移除無條件載入 regions
  // 提案已有 destination 欄位，不需要 country_id/city_id 轉換
  // 如果未來需要 regions，可以在 TourForm 開啟時才載入

  const {
    filteredTours,
    loading,
    currentPage,
    setCurrentPage,
    activeStatusTab,
    setActiveStatusTab,
    searchQuery,
    setSearchQuery,
    state,
    actions,
    handleSortChange,
  } = useToursPage()

  const {
    itineraryDialogTour,
    openItineraryDialog,
    closeItineraryDialog,
    tourItineraryDialogTour,
    openTourItineraryDialog,
    closeTourItineraryDialog,
    quoteDialogTour,
    openQuoteDialog,
    closeQuoteDialog,
    contractDialogState,
    openContractDialog,
    closeContractDialog,
    detailDialogTourId,
    openDetailDialog,
    closeDetailDialog,
    archiveDialogTour,
    openArchiveDialog,
    closeArchiveDialog,
    confirmArchive,
    closingDialogTour,
    openClosingDialog,
    closeClosingDialog,
    deleteConfirm,
    openDeleteDialog,
    closeDeleteDialog,
  } = useToursDialogs()

  const {
    submitting,
    setSubmitting,
    formError,
    setFormError,
    newTour,
    setNewTour,
    newOrder,
    setNewOrder,
    getStatusColor,
    setSelectedTour,
  } = state

  const {
    handleOpenCreateDialog,
    handleOpenEditDialog,
    resetForm,
    handleEditDialogEffect,
    handleNavigationEffect,
    proposalConvertData,
    clearProposalConvertData,
  } = useToursForm({ state, openDialog, dialog: dialogState })

  // 🔧 優化：useTourOperations 不再需要外部傳入 quotes/itineraries/addOrder 等
  const operations = useTourOperations({
    actions,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType: dialogState.type || 'create',
    dialogData: (dialogState.data && Object.keys(dialogState.data).length > 0 ? dialogState.data : null) as Tour | null,
    workspaceId: user?.workspace_id,
  })

  const handleAddTour = useCallback(async () => {
    // 如果是從提案轉開團，使用 convertToTour API
    if (proposalConvertData) {
      if (!user?.workspace_id || !user?.id) {
        await alert('無法取得使用者資訊', 'error')
        return
      }

      setSubmitting(true)
      try {
        const result = await convertToTour(
          {
            proposal_id: proposalConvertData.proposal.id,
            package_id: proposalConvertData.package.id,
            city_code: newTour.cityCode || '',
            departure_date: newTour.departure_date,
            tour_name: newTour.name,
            contact_person: newOrder.contact_person || undefined,
            contact_phone: proposalConvertData.proposal.customer_phone || undefined,
          },
          user.workspace_id,
          user.id
        )

        await alert(`轉開團成功！團號：${result.tour_code}`, 'success')

        // 清除提案轉開團資料和 URL 參數
        clearProposalConvertData()
        resetForm()
        closeDialog()

        // 刷新提案列表
        refreshProposals()

        // 高亮顯示新建的旅遊團
        router.push(`/tours?highlight=${result.tour_id}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : '轉開團失敗'
        await alert(message, 'error')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // 一般開團流程
    const fromQuoteId = searchParams.get('fromQuote')
    operations.handleAddTour(newTour, newOrder, fromQuoteId ?? undefined)
  }, [operations, newTour, newOrder, searchParams, proposalConvertData, user, clearProposalConvertData, resetForm, closeDialog, refreshProposals, router, setSubmitting])

  const handleDeleteTour = useCallback(async () => {
    await operations.handleDeleteTour(deleteConfirm.tour)
    closeDeleteDialog()
  }, [operations, deleteConfirm.tour, closeDeleteDialog])

  const { handleCreateChannel } = useTourChannelOperations({
    actions: actions as unknown as TourStoreActions
  })

  // 編輯提案
  const handleEditProposal = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setProposalDetailDialogOpen(false)
    setProposalEditDialogOpen(true)
  }, [])

  // 開啟封存對話框
  const handleOpenArchiveDialog = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setProposalDetailDialogOpen(false)
    setProposalArchiveDialogOpen(true)
  }, [])

  // 刪除提案
  const handleDeleteProposal = useCallback(
    async (proposal: Proposal) => {
      // 🔧 優化：刪除時才查詢套件，不預先載入
      const { supabase } = await import('@/lib/supabase/client')
      const { data: packages } = await supabase
        .from('proposal_packages')
        .select('id')
        .eq('proposal_id', proposal.id)

      const packageCount = packages?.length || 0
      const packageInfo = packageCount > 0 ? `\n\n注意：此提案有 ${packageCount} 個版本，將一併刪除` : ''

      const confirmed = await confirm(`確定要刪除提案「${proposal.title}」嗎？${packageInfo}`, {
        type: 'warning',
        title: '刪除提案',
      })

      if (confirmed) {
        try {
          // 先解除旅遊團的提案關聯（避免外鍵衝突）
          logger.log('[ToursPage] 解除旅遊團關聯...')
          const { error: tourUnlinkError } = await supabase
            .from('tours')
            .update({ proposal_id: null, proposal_package_id: null } as Record<string, unknown>)
            .eq('proposal_id' as string, proposal.id)
          if (tourUnlinkError) {
            logger.error('[ToursPage] 解除旅遊團關聯失敗:', tourUnlinkError)
            throw new Error(`解除旅遊團關聯失敗: ${tourUnlinkError.message || tourUnlinkError.code || JSON.stringify(tourUnlinkError)}`)
          }

          // 清除提案的 selected_package_id（避免外鍵衝突）
          logger.log('[ToursPage] 清除提案的 selected_package_id...')
          const { error: clearSelectedError } = await supabase
            .from('proposals' as 'notes')
            .update({ selected_package_id: null } as Record<string, unknown>)
            .eq('id', proposal.id)
          if (clearSelectedError) {
            logger.error('[ToursPage] 清除 selected_package_id 失敗:', clearSelectedError)
            // 不拋錯，繼續嘗試刪除
          }

          // 取得所有套件 ID
          const packageIds = packages?.map(p => p.id) || []

          if (packageIds.length > 0) {
            // 解除報價單的套件關聯
            logger.log('[ToursPage] 解除報價單關聯...')
            const { error: quoteUnlinkError } = await supabase
              .from('quotes')
              .update({ proposal_package_id: null } as Record<string, unknown>)
              .in('proposal_package_id' as string, packageIds)
            if (quoteUnlinkError) {
              logger.error('[ToursPage] 解除報價單關聯失敗:', quoteUnlinkError)
              // 不拋錯，繼續嘗試
            }

            // 解除行程表的套件關聯
            logger.log('[ToursPage] 解除行程表關聯...')
            const { error: itinUnlinkError } = await supabase
              .from('itineraries')
              .update({ proposal_package_id: null } as Record<string, unknown>)
              .in('proposal_package_id' as string, packageIds)
            if (itinUnlinkError) {
              logger.error('[ToursPage] 解除行程表關聯失敗:', itinUnlinkError)
              // 不拋錯，繼續嘗試
            }

            // 刪除相關套件
            logger.log('[ToursPage] 正在刪除套件...', packageIds.length)
            const { error: pkgError } = await supabase
              .from('proposal_packages' as 'notes')
              .delete()
              .eq('proposal_id', proposal.id)
            if (pkgError) {
              logger.error('[ToursPage] 刪除套件失敗:', pkgError)
              throw new Error(`刪除套件失敗: ${pkgError.message || pkgError.code || JSON.stringify(pkgError)}`)
            }
          }

          // 再刪除提案
          logger.log('[ToursPage] 正在刪除提案...', proposal.id)
          const { error } = await supabase.from('proposals' as 'notes').delete().eq('id', proposal.id)
          if (error) {
            logger.error('[ToursPage] 刪除提案失敗:', error)
            throw new Error(`刪除提案失敗: ${error.message || error.code || JSON.stringify(error)}`)
          }

          logger.log('[ToursPage] 刪除成功，重新整理列表...')
          refreshProposals()
          setProposalDetailDialogOpen(false)
          setSelectedProposal(null)
          await alert('提案已刪除', 'success')
        } catch (error) {
          logger.error('[ToursPage] 刪除提案失敗:', JSON.stringify(error, null, 2))
          const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
          await alert(`刪除提案失敗: ${errorMessage}`, 'error')
        }
      }
    },
    [refreshProposals]
  )

  const { renderActions } = useTourActionButtons({
    quotes,
    activeStatusTab,
    user,
    operations,
    onEditTour: handleOpenEditDialog,
    setSelectedTour,
    setDeleteConfirm: (state) => state.tour && openDeleteDialog(state.tour),
    handleCreateChannel,
    onOpenItineraryDialog: openItineraryDialog,
    onOpenQuoteDialog: openQuoteDialog,
    onOpenContractDialog: openContractDialog,
    onCloseTour: openClosingDialog,
    onOpenArchiveDialog: openArchiveDialog,
    onOpenTourControlDialog: (tour: Tour) => {
      setTourControlDialogTour(tour)
    },
    onProposalClick: (proposal) => {
      setSelectedProposal(proposal)
      setProposalDetailDialogOpen(true)
    },
    onProposalEdit: handleEditProposal,
    onProposalArchive: handleOpenArchiveDialog,
    onProposalDelete: handleDeleteProposal,
  })

  // 🔧 優化：移除 getDestinationName，直接使用提案的 destination 欄位
  // 不再需要 countries/cities ID→名稱轉換

  // 將提案轉換為 Tour 格式，用於「全部」頁籤整合顯示
  const combinedTours = useMemo(() => {
    if (activeStatusTab !== 'all') return filteredTours

    // 篩選提案（排除已轉團、已封存）
    const filteredProposals = proposals.filter(p => {
      if (p.status === 'converted' || p.status === 'archived') return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.code?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.customer_name?.toLowerCase().includes(q) ||
          p.destination?.toLowerCase().includes(q)
        )
      }
      return true
    })

    // 將提案轉換為 Tour 格式（帶有標記）
    const proposalsAsTours = filteredProposals.map(p => ({
      id: p.id,
      code: p.code,
      name: p.title || '-',
      departure_date: p.expected_start_date || null,
      return_date: null,
      status: '提案',
      // 🔧 優化：直接使用提案的 destination 欄位，不需要 ID→名稱轉換
      destination: p.destination || '-',
      // 標記這是提案，用於 click handler 區分
      __isProposal: true,
      __originalProposal: p,
    })) as unknown as Tour[]

    // 提案置頂
    return [...proposalsAsTours, ...filteredTours]
  }, [activeStatusTab, filteredTours, proposals, searchQuery])

  // 點擊整列打開詳情浮動視窗
  const handleRowClick = useCallback((row: unknown) => {
    const item = row as Tour & { __isProposal?: boolean; __originalProposal?: Proposal }

    // 如果是提案，打開提案詳細對話框
    if (item.__isProposal && item.__originalProposal) {
      setSelectedProposal(item.__originalProposal)
      setProposalDetailDialogOpen(true)
      return
    }

    // 否則是旅遊團，打開旅遊團詳情
    setSelectedTour(item as Tour)
    openDetailDialog(item.id)
  }, [setSelectedTour, openDetailDialog, setSelectedProposal, setProposalDetailDialogOpen])

  // 新增提案
  const handleCreateProposal = useCallback(
    async (data: CreateProposalData | UpdateProposalData) => {
      if (!user?.workspace_id || !user?.id) {
        await alert('無法取得使用者資訊', 'error')
        return
      }

      try {
        const newProposal = await createProposal(data as CreateProposalData, user.workspace_id, user.id)
        setProposalDialogOpen(false)
        // 刷新列表以顯示新提案
        await refreshProposals()
        // 自動展開新提案的詳情對話框
        if (newProposal) {
          setSelectedProposal(newProposal)
          setProposalDetailDialogOpen(true)
        }
      } catch (error) {
        await alert('建立提案失敗', 'error')
      }
    },
    [user?.workspace_id, user?.id, refreshProposals]
  )

  // 更新提案
  const handleUpdateProposal = useCallback(
    async (data: CreateProposalData | UpdateProposalData) => {
      if (!selectedProposal || !user?.id) {
        await alert('無法取得資訊', 'error')
        return
      }

      try {
        await updateProposal(selectedProposal.id, data, user.id)
        refreshProposals()
        setProposalEditDialogOpen(false)
        setSelectedProposal(null)
      } catch (error) {
        await alert('更新提案失敗', 'error')
      }
    },
    [selectedProposal, user?.id, refreshProposals]
  )

  // 封存提案
  const handleArchiveProposal = useCallback(
    async (reason: string) => {
      if (!selectedProposal || !user?.id) return

      try {
        await archiveProposal(selectedProposal.id, reason, user.id)
        refreshProposals()
        setProposalArchiveDialogOpen(false)
        setSelectedProposal(null)
      } catch (error) {
        await alert('封存提案失敗', 'error')
      }
    },
    [selectedProposal, user?.id, refreshProposals]
  )

  useEffect(() => {
    handleNavigationEffect()
  }, [handleNavigationEffect])

  useEffect(() => {
    handleEditDialogEffect()
  }, [handleEditDialogEffect])

  // 移除完整頁面載入阻擋，改為讓表格結構先顯示
  // loading 狀態由 TourTable 內部處理

  return (
    <div className="h-full flex flex-col">
      <TourFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeStatusTab}
        onTabChange={(tab: string) => {
          setActiveStatusTab(tab)
          setCurrentPage(1)
        }}
        onAddProposal={() => setProposalDialogOpen(true)}
        onAddTour={() => handleOpenCreateDialog()}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeStatusTab === '提案' ? (
          <div className="flex-1 overflow-auto">
            <ProposalsTableContent searchQuery={searchQuery} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <TourTable
              tours={combinedTours}
              loading={loading}
              onSort={handleSortChange}
              onRowClick={handleRowClick}
              renderActions={renderActions}
              getStatusColor={getStatusColor}
            />
          </div>
        )}
      </div>

      <TourForm
        isOpen={dialogState.isOpen}
        onClose={() => {
          resetForm()
          closeDialog()
          // 如果是從提案轉開團，關閉時也要清除資料
          if (proposalConvertData) {
            clearProposalConvertData()
          }
        }}
        mode={dialogState.type === 'edit' ? 'edit' : 'create'}
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
        isFromProposal={!!proposalConvertData}
      />

      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        tour={deleteConfirm.tour}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTour}
      />

      <ArchiveReasonDialog
        isOpen={!!archiveDialogTour}
        tour={archiveDialogTour}
        onClose={closeArchiveDialog}
        onConfirm={(reason) => confirmArchive(reason, operations.handleArchiveTour)}
      />

      {itineraryDialogTour && (
        <LinkItineraryToTourDialog
          isOpen={!!itineraryDialogTour}
          onClose={closeItineraryDialog}
          tour={itineraryDialogTour}
        />
      )}

      {quoteDialogTour && (
        <LinkDocumentsToTourDialog
          isOpen={!!quoteDialogTour}
          onClose={closeQuoteDialog}
          tour={quoteDialogTour}
        />
      )}

      {/* 行程表選擇對話框 */}
      {tourItineraryDialogTour && (
        <TourItineraryDialog
          isOpen={!!tourItineraryDialogTour}
          onClose={closeTourItineraryDialog}
          tour={tourItineraryDialogTour}
        />
      )}

      {contractDialogState.tour && (
        <ContractDialog
          isOpen={contractDialogState.isOpen}
          onClose={closeContractDialog}
          tour={contractDialogState.tour}
          mode={contractDialogState.mode}
        />
      )}

      <TourDetailDialog
        isOpen={!!detailDialogTourId}
        onClose={closeDetailDialog}
        tourId={detailDialogTourId}
        onDataChange={() => {}}
      />


      {closingDialogTour && (
        <TourClosingDialog
          tour={closingDialogTour}
          open={!!closingDialogTour}
          onOpenChange={(open) => !open && closeClosingDialog()}
          onSuccess={closeClosingDialog}
        />
      )}

      {/* 團控表對話框 */}
      {tourControlDialogTour && (
        <TourControlDialogWrapper
          tour={tourControlDialogTour}
          onClose={() => setTourControlDialogTour(null)}
        />
      )}

      {/* 新增提案對話框 */}
      <ProposalDialog
        open={proposalDialogOpen}
        onOpenChange={setProposalDialogOpen}
        mode="create"
        onSubmit={handleCreateProposal}
      />

      {/* 提案詳細對話框 */}
      <ProposalDetailDialog
        open={proposalDetailDialogOpen}
        onOpenChange={(open) => {
          setProposalDetailDialogOpen(open)
          // 關閉時清除選擇，但不改變 tab 狀態
          if (!open) {
            setSelectedProposal(null)
          }
        }}
        proposal={selectedProposal}
        onPackagesChange={() => {
          // 刷新提案資料
          refreshProposals()
        }}
      />

      {/* 編輯提案對話框 */}
      <ProposalDialog
        open={proposalEditDialogOpen}
        onOpenChange={(open) => {
          setProposalEditDialogOpen(open)
          if (!open) setSelectedProposal(null)
        }}
        mode="edit"
        proposal={selectedProposal}
        onSubmit={handleUpdateProposal}
      />

      {/* 封存提案對話框 */}
      <ArchiveProposalDialog
        open={proposalArchiveDialogOpen}
        onOpenChange={(open) => {
          setProposalArchiveDialogOpen(open)
          if (!open) setSelectedProposal(null)
        }}
        proposal={selectedProposal}
        onConfirm={handleArchiveProposal}
      />
    </div>
  )
}
