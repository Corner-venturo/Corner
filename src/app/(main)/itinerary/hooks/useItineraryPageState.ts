'use client'

import { useState } from 'react'
import type { Itinerary } from '@/stores/types'

/**
 * Hook for managing itinerary page state
 * Includes: filters, search, dialogs, and password state
 */
export function useItineraryPageState() {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [authorFilter, setAuthorFilter] = useState<string>('__mine__')
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)

  // Password dialog state
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)

  // Duplicate dialog state
  const [duplicateSource, setDuplicateSource] = useState<Itinerary | null>(null)
  const [duplicateTourCode, setDuplicateTourCode] = useState('')
  const [duplicateTitle, setDuplicateTitle] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  return {
    // Filter states
    statusFilter,
    setStatusFilter,
    authorFilter,
    setAuthorFilter,
    searchTerm,
    setSearchTerm,

    // Dialog states
    isTypeSelectOpen,
    setIsTypeSelectOpen,
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
    isDuplicateDialogOpen,
    setIsDuplicateDialogOpen,

    // Password state
    passwordInput,
    setPasswordInput,
    pendingEditId,
    setPendingEditId,

    // Duplicate state
    duplicateSource,
    setDuplicateSource,
    duplicateTourCode,
    setDuplicateTourCode,
    duplicateTitle,
    setDuplicateTitle,
    isDuplicating,
    setIsDuplicating,
  }
}
