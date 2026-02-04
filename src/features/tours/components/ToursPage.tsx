/**
 * ToursPage - Main tours list page component (Refactored)
 * 🔧 TOUR-01 重構：提案相關邏輯抽取到 useProposalOperations hook
 */

'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
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
// TourControlDialogWrapper 已移除，功能整合到團確單
import { TourRequirementsDialog } from './TourRequirementsDialog'
import { TourEditDialog } from '@/components/tours/tour-edit-dialog'
import { ProposalsTableContent } from '@/features/proposals/components/ProposalsTableContent'
import { convertToTour } from '@/services/proposal.service'
import { alert } from '@/lib/ui/alert-dialog'
import { useProposalOperations } from '../hooks/useProposalOperations'
import { ProposalDialogsWrapper } from './ProposalDialogsWrapper'
import type { Proposal } from '@/types/proposal.types'

const TourDetailDialog = dynamic(
  () => import('@/components/tours/TourDetailDialog').then(m => m.TourDetailDialog),
  {
    /* eslint-disable venturo/no-custom-modal -- 動態載入時的 loading 狀態 */
    loading: () => (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9000]">
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

  const [requirementsDialogTour, setRequirementsDialogTour] = useState<Tour | null>(null)

  // Edit dialog state (using TourEditDialog instead of TourForm for edit mode)
  const [editDialogTour, setEditDialogTour] = useState<Tour | null>(null)

  // 🔧 TOUR-01 重構：使用 useProposalOperations hook 管理提案相關狀態和操作
  const proposalOps = useProposalOperations()
  const {
    proposals,
    refreshProposals,
    selectedProposal,
    setSelectedProposal,
    proposalDialogOpen,
    setProposalDialogOpen,
    proposalDetailDialogOpen,
    setProposalDetailDialogOpen,
    handleEditProposal,
    handleOpenArchiveDialog,
    handleDeleteProposal,
    handleProposalClick,
  } = proposalOps

  // 🔧 優化：只保留 quotes（TourActionButtons 需要），其他由 useTourOperations 內部處理
  const { items: quotes } = useQuotesListSlim()

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
    detailDialogDefaultTab,
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
    resetForm,
    handleNavigationEffect,
    proposalConvertData,
    clearProposalConvertData,
  } = useToursForm({ state, openDialog })

  // Handler for opening edit dialog (now uses TourEditDialog instead of TourForm)
  const handleOpenEditDialog = useCallback((tour: Tour) => {
    setEditDialogTour(tour)
  }, [])

  // Handler for closing edit dialog
  const handleCloseEditDialog = useCallback(() => {
    setEditDialogTour(null)
  }, [])

  // 🔧 優化：useTourOperations 不再需要外部傳入 quotes/itineraries/addOrder 等
  // 🔧 編輯模式已移至 TourEditDialog + useTourEdit hook
  const operations = useTourOperations({
    actions,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
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
    const result = await operations.handleDeleteTour(deleteConfirm.tour)
    closeDeleteDialog()
    if (!result.success && result.error) {
      await alert(result.error, 'error')
    }
  }, [operations, deleteConfirm.tour, closeDeleteDialog])

  const { handleCreateChannel } = useTourChannelOperations({
    actions: actions as unknown as TourStoreActions
  })

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
    onOpenRequirementsDialog: (tour: Tour) => {
      setRequirementsDialogTour(tour)
    },
    onProposalClick: handleProposalClick,
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
      handleProposalClick(item.__originalProposal)
      return
    }

    // 否則是旅遊團，打開旅遊團詳情
    setSelectedTour(item as Tour)
    openDetailDialog(item.id)
  }, [setSelectedTour, openDetailDialog, handleProposalClick])

  useEffect(() => {
    handleNavigationEffect()
  }, [handleNavigationEffect])

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

      {/* TourForm only for create mode */}
      <TourForm
        isOpen={dialogState.isOpen && dialogState.type === 'create'}
        onClose={() => {
          resetForm()
          closeDialog()
          // 如果是從提案轉開團，關閉時也要清除資料
          if (proposalConvertData) {
            clearProposalConvertData()
          }
        }}
        mode="create"
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
        isFromProposal={!!proposalConvertData}
      />

      {/* TourEditDialog for edit mode */}
      {editDialogTour && (
        <TourEditDialog
          isOpen={!!editDialogTour}
          onClose={handleCloseEditDialog}
          tour={editDialogTour}
          onSuccess={() => {
            // Refresh is handled by SWR mutate in the hook
          }}
        />
      )}

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
        defaultTab={detailDialogDefaultTab}
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

      {/* 需求總表對話框 */}
      <TourRequirementsDialog
        open={!!requirementsDialogTour}
        tour={requirementsDialogTour}
        onClose={() => setRequirementsDialogTour(null)}
      />

      {/* 🔧 TOUR-01: 提案對話框整合到 ProposalDialogsWrapper */}
      <ProposalDialogsWrapper {...proposalOps} onRefreshProposals={refreshProposals} />
    </div>
  )
}
