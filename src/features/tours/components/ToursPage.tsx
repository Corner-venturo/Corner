/**
 * ToursPage - Main tours list page component (Refactored)
 */

'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useRegionsStore } from '@/stores'
import { useOrdersListSlim, useQuotesListSlim, useItinerariesListSlim } from '@/hooks/useListSlim'
import { useDialog } from '@/hooks/useDialog'
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
import { DocumentVersionPicker } from '@/components/documents'
import { LinkItineraryToTourDialog } from './LinkItineraryToTourDialog'
import { ContractDialog } from '@/components/contracts/ContractDialog'
import { TourConfirmationWizard } from './TourConfirmationWizard'
import { TourUnlockDialog } from './TourUnlockDialog'
import { TourClosingDialog } from './TourClosingDialog'
import { TourConfirmationDialog } from './TourConfirmationDialog'
import { ProposalDialog } from '@/features/proposals/components/ProposalDialog'
import { ProposalsTableContent } from '@/features/proposals/components/ProposalsTableContent'
import { ProposalDetailDialog } from '@/features/proposals/components/ProposalDetailDialog'
import { useProposals } from '@/hooks/cloud-hooks'
import { createProposal } from '@/services/proposal.service'
import { alert } from '@/lib/ui/alert-dialog'
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

  const [tourConfirmationDialogTour, setTourConfirmationDialogTour] = useState<Tour | null>(null)
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [proposalDetailDialogOpen, setProposalDetailDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  const { items: orders, create: addOrder } = useOrdersListSlim()
  const { items: quotes, update: updateQuote } = useQuotesListSlim()
  const { items: itineraries, update: updateItinerary } = useItinerariesListSlim()
  const { items: proposals } = useProposals()
  const { countries, cities, fetchAll: fetchRegions } = useRegionsStore()
  const { dialog, closeDialog, openDialog } = useDialog()

  // 載入地區資料（只在首次載入時執行）
  useEffect(() => {
    if (countries.length === 0) {
      fetchRegions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    quoteDialogTour,
    quoteDialogMode,
    openQuoteDialog,
    closeQuoteDialog,
    itineraryDialogTour,
    openItineraryDialog,
    closeItineraryDialog,
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
    confirmWizardTour,
    openConfirmWizard,
    closeConfirmWizard,
    unlockDialogTour,
    openUnlockDialog,
    closeUnlockDialog,
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
  } = useToursForm({ state, openDialog, dialog })

  const operations = useTourOperations({
    actions,
    addOrder: addOrder as never,
    updateQuote,
    updateItinerary,
    quotes,
    itineraries,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType: dialog.type || 'create',
    dialogData: (dialog.data && Object.keys(dialog.data).length > 0 ? dialog.data : null) as Tour | null,
  })

  const handleAddTour = useCallback(() => {
    const fromQuoteId = searchParams.get('fromQuote')
    operations.handleAddTour(newTour, newOrder, fromQuoteId ?? undefined)
  }, [operations, newTour, newOrder, searchParams])

  const handleDeleteTour = useCallback(async () => {
    await operations.handleDeleteTour(deleteConfirm.tour)
    closeDeleteDialog()
  }, [operations, deleteConfirm.tour, closeDeleteDialog])

  const { handleCreateChannel, handleUnlockTour } = useTourChannelOperations({
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
    handleUnlockTour,
    onOpenQuoteDialog: openQuoteDialog,
    onOpenItineraryDialog: openItineraryDialog,
    onOpenContractDialog: openContractDialog,
    onConfirmTour: openConfirmWizard,
    onUnlockLockedTour: openUnlockDialog,
    onCloseTour: openClosingDialog,
    onOpenArchiveDialog: openArchiveDialog,
    onOpenTourConfirmationDialog: (tour: Tour) => {
      setTourConfirmationDialogTour(tour)
    },
    onProposalClick: (proposal) => {
      setSelectedProposal(proposal)
      setProposalDetailDialogOpen(true)
    },
  })

  // 取得國家/城市名稱的輔助函數
  const getDestinationName = useMemo(() => {
    return (countryId?: string | null, cityId?: string | null) => {
      const country = countries.find(c => c.id === countryId)
      const city = cities.find(c => c.id === cityId)
      if (city && country) return `${country.name} ${city.name}`
      if (country) return country.name
      return '-'
    }
  }, [countries, cities])

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
      // 目的地顯示（國家/城市）
      destination: getDestinationName(p.country_id, p.main_city_id),
      // 標記這是提案，用於 click handler 區分
      __isProposal: true,
      __originalProposal: p,
    })) as unknown as Tour[]

    // 提案置頂
    return [...proposalsAsTours, ...filteredTours]
  }, [activeStatusTab, filteredTours, proposals, searchQuery, getDestinationName])

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
        await createProposal(data as CreateProposalData, user.workspace_id, user.id)
        setProposalDialogOpen(false)
        // 切換到提案 tab
        setActiveStatusTab('提案')
      } catch (error) {
        await alert('建立提案失敗', 'error')
      }
    },
    [user?.workspace_id, user?.id, setActiveStatusTab]
  )

  useEffect(() => {
    handleNavigationEffect()
  }, [handleNavigationEffect])

  useEffect(() => {
    handleEditDialogEffect()
  }, [handleEditDialogEffect])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

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
        onAdd={() => setProposalDialogOpen(true)}
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
        isOpen={dialog.isOpen}
        onClose={() => {
          resetForm()
          closeDialog()
        }}
        mode={dialog.type === 'edit' ? 'edit' : 'create'}
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
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

      {quoteDialogTour && (
        <DocumentVersionPicker
          isOpen={!!quoteDialogTour}
          onClose={closeQuoteDialog}
          tour={quoteDialogTour}
          mode={quoteDialogMode}
          onConfirmLock={() => operations.handleConfirmTour(quoteDialogTour)}
        />
      )}

      {itineraryDialogTour && (
        <LinkItineraryToTourDialog
          isOpen={!!itineraryDialogTour}
          onClose={closeItineraryDialog}
          tour={itineraryDialogTour}
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

      {confirmWizardTour && (
        <TourConfirmationWizard
          tour={confirmWizardTour}
          open={!!confirmWizardTour}
          onOpenChange={(open) => !open && closeConfirmWizard()}
          onConfirmed={closeConfirmWizard}
        />
      )}

      {unlockDialogTour && (
        <TourUnlockDialog
          tour={unlockDialogTour}
          open={!!unlockDialogTour}
          onOpenChange={(open) => !open && closeUnlockDialog()}
          onUnlocked={closeUnlockDialog}
        />
      )}

      {closingDialogTour && (
        <TourClosingDialog
          tour={closingDialogTour}
          open={!!closingDialogTour}
          onOpenChange={(open) => !open && closeClosingDialog()}
          onSuccess={closeClosingDialog}
        />
      )}

      {/* 團確單對話框 */}
      <TourConfirmationDialog
        open={!!tourConfirmationDialogTour}
        tour={tourConfirmationDialogTour}
        onClose={() => setTourConfirmationDialogTour(null)}
      />

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
        onOpenChange={setProposalDetailDialogOpen}
        proposal={selectedProposal}
        onPackagesChange={() => {
          // 刷新資料
        }}
      />
    </div>
  )
}
