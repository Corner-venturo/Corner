'use client'
/**
 * ToursPage - Main tours list page component
 * 提案功能已移除，純粹管理旅遊團
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useQuotesListSlim, useOrdersListSlim } from '@/hooks/useListSlim'
import { useTourOperations } from '../hooks/useTourOperations'
import { useTourChannelOperations, TourStoreActions } from './TourChannelOperations'
import { useTourActionButtons } from './TourActionButtons'
import { useToursPage } from '../hooks/useToursPage'
import { useToursDialogs } from '../hooks/useToursDialogs'
import type { Tour } from '@/stores/types'
import { useToursForm } from '../hooks/useToursForm'
import { TourFilters } from './TourFilters'
import { TourTable } from './TourTable'
import { TourFormShell } from './TourFormShell'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { ArchiveReasonDialog } from './ArchiveReasonDialog'
import { LinkItineraryToTourDialog } from './LinkItineraryToTourDialog'
import { LinkDocumentsToTourDialog } from './LinkDocumentsToTourDialog'
import { TourItineraryDialog } from './TourItineraryDialog'
import { ContractDialog } from '@/features/contracts/components/ContractDialog'
import { TourClosingDialog } from './TourClosingDialog'
import { TourEditDialog } from '@/features/tours/components/tour-edit-dialog'
import { alert } from '@/lib/ui/alert-dialog'


export const ToursPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuthStore()

  // Edit dialog state
  const [editDialogTour, setEditDialogTour] = useState<Tour | null>(null)

  const { items: quotes } = useQuotesListSlim()
  const { items: allOrders } = useOrdersListSlim()

  // Build a map of tour_id → first order's sales_person/assistant for display
  const ordersByTourId = useMemo(() => {
    const map = new Map<string, { sales_person: string | null; assistant: string | null }>()
    for (const order of allOrders) {
      if (order.tour_id && !map.has(order.tour_id)) {
        map.set(order.tour_id, {
          sales_person: order.sales_person ?? null,
          assistant: order.assistant ?? null,
        })
      }
    }
    return map
  }, [allOrders])

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
    quoteDialogTour,
    openQuoteDialog,
    closeQuoteDialog,
    tourItineraryDialogTour,
    closeTourItineraryDialog,
    contractDialogState,
    openContractDialog,
    closeContractDialog,
    closingDialogTour,
    openClosingDialog,
    closeClosingDialog,
    archiveDialogTour,
    openArchiveDialog,
    closeArchiveDialog,
    confirmArchive,
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
  } = useToursForm({ state, openDialog })

  const handleOpenEditDialog = useCallback((tour: Tour) => {
    setEditDialogTour(tour)
  }, [])

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogTour(null)
  }, [])

  const operations = useTourOperations({
    actions,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    workspaceId: user?.workspace_id,
  })

  const handleAddTour = useCallback(async () => {
    const fromQuoteId = searchParams.get('fromQuote')
    operations.handleAddTour(newTour, newOrder, fromQuoteId ?? undefined)
  }, [operations, newTour, newOrder, searchParams])

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
    onOpenRequirementsDialog: undefined,
    onProposalClick: undefined,
    onProposalEdit: undefined,
    onProposalArchive: undefined,
    onProposalDelete: undefined,
  })

  const handleRowClick = useCallback((row: unknown) => {
    const item = row as Tour
    router.push(`/tours/${item.code}`)
  }, [router])

  useEffect(() => {
    handleNavigationEffect()
  }, [handleNavigationEffect])

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
        onAddTour={() => handleOpenCreateDialog()}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <TourTable
            tours={filteredTours}
            loading={loading}
            onSort={handleSortChange}
            onRowClick={handleRowClick}
            renderActions={renderActions}
            getStatusColor={getStatusColor}
            ordersByTourId={ordersByTourId}
          />
        </div>
      </div>

      {/* TourForm only for create mode */}
      <TourFormShell
        isOpen={dialogState.isOpen && dialogState.type === 'create'}
        onClose={() => {
          resetForm()
          closeDialog()
        }}
        mode="create"
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
        isFromProposal={false}
      />

      {/* TourEditDialog for edit mode */}
      {editDialogTour && (
        <TourEditDialog
          isOpen={!!editDialogTour}
          onClose={handleCloseEditDialog}
          tour={editDialogTour}
          onSuccess={() => {}}
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

      {closingDialogTour && (
        <TourClosingDialog
          tour={closingDialogTour}
          open={!!closingDialogTour}
          onOpenChange={(open) => !open && closeClosingDialog()}
          onSuccess={closeClosingDialog}
        />
      )}
    </div>
  )
}
