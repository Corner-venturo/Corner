'use client'

import { useState, useCallback } from 'react'
import { Tour } from '@/stores/types'
import { ArchiveReason } from '../components/ArchiveReasonDialog'

interface DialogState<T = Tour | null> {
  isOpen: boolean
  tour: T
}

interface ContractDialogState {
  isOpen: boolean
  tour: Tour | null
  mode: 'create' | 'edit'
}

export interface UseToursDialogsReturn {
  // Quote Dialog
  quoteDialogTour: Tour | null
  openQuoteDialog: (tour: Tour) => void
  closeQuoteDialog: () => void

  // Itinerary Dialog
  itineraryDialogTour: Tour | null
  openItineraryDialog: (tour: Tour) => void
  closeItineraryDialog: () => void

  // Contract Dialog
  contractDialogState: ContractDialogState
  openContractDialog: (tour: Tour) => void
  closeContractDialog: () => void

  // Detail Dialog
  detailDialogTourId: string | null
  openDetailDialog: (tourId: string) => void
  closeDetailDialog: () => void

  // Archive Dialog
  archiveDialogTour: Tour | null
  openArchiveDialog: (tour: Tour) => void
  closeArchiveDialog: () => void
  confirmArchive: (reason: ArchiveReason, onArchive: (tour: Tour, reason: ArchiveReason) => void) => void

  // Confirmation Wizard
  confirmWizardTour: Tour | null
  openConfirmWizard: (tour: Tour) => void
  closeConfirmWizard: () => void

  // Unlock Dialog
  unlockDialogTour: Tour | null
  openUnlockDialog: (tour: Tour) => void
  closeUnlockDialog: () => void

  // Delete Confirm Dialog
  deleteConfirm: DialogState
  openDeleteDialog: (tour: Tour) => void
  closeDeleteDialog: () => void
}

export function useToursDialogs(): UseToursDialogsReturn {
  // Quote Dialog
  const [quoteDialogTour, setQuoteDialogTour] = useState<Tour | null>(null)

  // Itinerary Dialog
  const [itineraryDialogTour, setItineraryDialogTour] = useState<Tour | null>(null)

  // Contract Dialog
  const [contractDialogState, setContractDialogState] = useState<ContractDialogState>({
    isOpen: false,
    tour: null,
    mode: 'edit',
  })

  // Detail Dialog
  const [detailDialogTourId, setDetailDialogTourId] = useState<string | null>(null)

  // Archive Dialog
  const [archiveDialogTour, setArchiveDialogTour] = useState<Tour | null>(null)

  // Confirmation Wizard
  const [confirmWizardTour, setConfirmWizardTour] = useState<Tour | null>(null)

  // Unlock Dialog
  const [unlockDialogTour, setUnlockDialogTour] = useState<Tour | null>(null)

  // Delete Confirm Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<DialogState>({
    isOpen: false,
    tour: null,
  })

  // Handlers
  const openQuoteDialog = useCallback((tour: Tour) => setQuoteDialogTour(tour), [])
  const closeQuoteDialog = useCallback(() => setQuoteDialogTour(null), [])

  const openItineraryDialog = useCallback((tour: Tour) => setItineraryDialogTour(tour), [])
  const closeItineraryDialog = useCallback(() => setItineraryDialogTour(null), [])

  const openContractDialog = useCallback((tour: Tour) => {
    const mode = tour.contract_template ? 'edit' : 'create'
    setContractDialogState({ isOpen: true, tour, mode })
  }, [])
  const closeContractDialog = useCallback(
    () => setContractDialogState({ isOpen: false, tour: null, mode: 'edit' }),
    []
  )

  const openDetailDialog = useCallback((tourId: string) => setDetailDialogTourId(tourId), [])
  const closeDetailDialog = useCallback(() => setDetailDialogTourId(null), [])

  const openArchiveDialog = useCallback((tour: Tour) => setArchiveDialogTour(tour), [])
  const closeArchiveDialog = useCallback(() => setArchiveDialogTour(null), [])
  const confirmArchive = useCallback(
    (reason: ArchiveReason, onArchive: (tour: Tour, reason: ArchiveReason) => void) => {
      if (archiveDialogTour) {
        onArchive(archiveDialogTour, reason)
        setArchiveDialogTour(null)
      }
    },
    [archiveDialogTour]
  )

  const openConfirmWizard = useCallback((tour: Tour) => setConfirmWizardTour(tour), [])
  const closeConfirmWizard = useCallback(() => setConfirmWizardTour(null), [])

  const openUnlockDialog = useCallback((tour: Tour) => setUnlockDialogTour(tour), [])
  const closeUnlockDialog = useCallback(() => setUnlockDialogTour(null), [])

  const openDeleteDialog = useCallback((tour: Tour) => {
    setDeleteConfirm({ isOpen: true, tour })
  }, [])
  const closeDeleteDialog = useCallback(() => {
    setDeleteConfirm({ isOpen: false, tour: null })
  }, [])

  return {
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
  }
}
