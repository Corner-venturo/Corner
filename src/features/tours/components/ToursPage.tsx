/**
 * ToursPage - Main tours list page component (Refactored)
 */

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useOrdersListSlim, useQuotesListSlim, useItinerariesListSlim } from '@/hooks/useListSlim'
import { useDialog } from '@/hooks/useDialog'
import { useTourOperations } from '../hooks/useTourOperations'
import { useTourChannelOperations, TourStoreActions } from './TourChannelOperations'
import { useTourActionButtons } from './TourActionButtons'
import { useToursPage } from '../hooks/useToursPage'
import { useToursDialogs } from '../hooks/useToursDialogs'
import { useToursForm } from '../hooks/useToursForm'
import { TourFilters } from './TourFilters'
import { TourTable } from './TourTable'
import { TourForm } from './TourForm'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { ArchiveReasonDialog } from './ArchiveReasonDialog'
import { LinkQuoteToTourDialog } from './LinkQuoteToTourDialog'
import { LinkItineraryToTourDialog } from './LinkItineraryToTourDialog'
import { ContractDialog } from '@/components/contracts/ContractDialog'
import { TourConfirmationWizard } from './TourConfirmationWizard'
import { TourUnlockDialog } from './TourUnlockDialog'

const TourDetailDialog = dynamic(
  () => import('@/components/tours/TourDetailDialog').then(m => m.TourDetailDialog),
  {
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
  const { user } = useAuthStore()

  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)

  const { items: orders, create: addOrder } = useOrdersListSlim()
  const { items: quotes, update: updateQuote } = useQuotesListSlim()
  const { items: itineraries, update: updateItinerary } = useItinerariesListSlim()
  const { dialog, closeDialog } = useDialog()

  const {
    filteredTours,
    loading,
    currentPage,
    setCurrentPage,
    activeStatusTab,
    setActiveStatusTab,
    searchQuery,
    setSearchQuery,
    expandedRows,
    state,
    actions,
    handleSortChange,
    handleRowClick,
  } = useToursPage()

  const {
    quoteDialogTour,
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
    deleteConfirm,
    openDeleteDialog,
    closeDeleteDialog,
  } = useToursDialogs()

  const {
    activeTabs,
    submitting,
    setSubmitting,
    formError,
    setFormError,
    triggerAddOnAdd,
    setTriggerAddOnAdd,
    triggerPaymentAdd,
    setTriggerPaymentAdd,
    triggerCostAdd,
    setTriggerCostAdd,
    tourExtraFields,
    setTourExtraFields,
    newTour,
    setNewTour,
    newOrder,
    toggleRowExpand,
    setActiveTab,
    getStatusColor,
    setSelectedTour,
  } = state

  const {
    handleOpenCreateDialog,
    resetForm,
    handleEditDialogEffect,
    handleNavigationEffect,
  } = useToursForm(state)

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
    dialogData: dialog.data || null,
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
    openDialog: () => {},
    setSelectedTour,
    setDeleteConfirm: openDeleteDialog,
    handleCreateChannel,
    handleUnlockTour,
    onOpenQuoteDialog: openQuoteDialog,
    onOpenItineraryDialog: openItineraryDialog,
    onOpenContractDialog: openContractDialog,
    onViewDetails: (tour) => {
      setSelectedTour(tour)
      openDetailDialog(tour.id)
    },
    onConfirmTour: openConfirmWizard,
    onUnlockLockedTour: openUnlockDialog,
    onOpenArchiveDialog: openArchiveDialog,
  })

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
        onAdd={() => handleOpenCreateDialog()}
      />

      <div className="flex-1 overflow-hidden">
        <TourTable
          tours={filteredTours}
          loading={loading}
          orders={orders}
          expandedRows={expandedRows}
          activeTabs={activeTabs}
          tourExtraFields={tourExtraFields}
          triggerAddOnAdd={triggerAddOnAdd}
          triggerPaymentAdd={triggerPaymentAdd}
          triggerCostAdd={triggerCostAdd}
          onSort={handleSortChange}
          onExpand={toggleRowExpand}
          onRowClick={handleRowClick}
          onActiveTabChange={setActiveTab}
          onTourExtraFieldsChange={setTourExtraFields}
          onTriggerAddOnAdd={setTriggerAddOnAdd}
          onTriggerPaymentAdd={setTriggerPaymentAdd}
          onTriggerCostAdd={setTriggerCostAdd}
          openDialog={() => {}}
          renderActions={renderActions}
          getStatusColor={getStatusColor}
        />
      </div>

      <TourForm
        isOpen={dialog.isOpen}
        onClose={() => {
          resetForm()
          setSelectedItineraryId(null)
          setSelectedQuoteId(null)
          closeDialog()
        }}
        mode={dialog.type === 'edit' ? 'edit' : 'create'}
        newTour={newTour}
        setNewTour={setNewTour}
        newOrder={newOrder}
        setNewOrder={() => {}}
        submitting={submitting}
        formError={formError}
        onSubmit={handleAddTour}
        selectedItineraryId={selectedItineraryId}
        setSelectedItineraryId={setSelectedItineraryId}
        selectedQuoteId={selectedQuoteId}
        setSelectedQuoteId={setSelectedQuoteId}
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
        <LinkQuoteToTourDialog
          isOpen={!!quoteDialogTour}
          onClose={closeQuoteDialog}
          tour={quoteDialogTour}
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
    </div>
  )
}
