'use client'

import { useState, useCallback, useRef } from 'react'
import type { Itinerary } from '@/stores/types'

/**
 * Hook for managing itinerary page state
 * Includes: filters, search, dialogs, and password state
 *
 * Note: Returns stable setter references to prevent infinite re-render loops.
 * DO NOT wrap return in useMemo - it causes object recreation on every state change.
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

  // Use refs to store latest values for stable callbacks
  const duplicateSourceRef = useRef(duplicateSource)
  duplicateSourceRef.current = duplicateSource
  const duplicateTourCodeRef = useRef(duplicateTourCode)
  duplicateTourCodeRef.current = duplicateTourCode
  const duplicateTitleRef = useRef(duplicateTitle)
  duplicateTitleRef.current = duplicateTitle
  const passwordInputRef = useRef(passwordInput)
  passwordInputRef.current = passwordInput
  const pendingEditIdRef = useRef(pendingEditId)
  pendingEditIdRef.current = pendingEditId

  // Stable getter functions for values that change frequently
  const getDuplicateSource = useCallback(() => duplicateSourceRef.current, [])
  const getDuplicateTourCode = useCallback(() => duplicateTourCodeRef.current, [])
  const getDuplicateTitle = useCallback(() => duplicateTitleRef.current, [])
  const getPasswordInput = useCallback(() => passwordInputRef.current, [])
  const getPendingEditId = useCallback(() => pendingEditIdRef.current, [])

  // Return object directly - useState setters are already stable
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

    // Password state - use getters for callbacks, direct values for rendering
    passwordInput,
    setPasswordInput,
    getPasswordInput,
    pendingEditId,
    setPendingEditId,
    getPendingEditId,

    // Duplicate state - use getters for callbacks, direct values for rendering
    duplicateSource,
    setDuplicateSource,
    getDuplicateSource,
    duplicateTourCode,
    setDuplicateTourCode,
    getDuplicateTourCode,
    duplicateTitle,
    setDuplicateTitle,
    getDuplicateTitle,
    isDuplicating,
    setIsDuplicating,
  }
}
