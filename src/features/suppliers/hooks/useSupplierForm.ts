/**
 * Hook for managing supplier form state
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { SupplierFormData, SupplierPaymentAccount } from '../types'

interface UseSupplierFormProps {
  onSubmit: (
    data: Omit<SupplierFormData, 'supplier_code'>,
    cityIds: string[],
    paymentAccounts: Omit<
      SupplierPaymentAccount,
      'id' | 'supplier_id' | 'created_at' | 'updated_at'
    >[]
  ) => Promise<void>
  getRegionsByCountry: (countryId: string) => Array<{ id: string; name: string }>
  getCitiesByCountry: (countryId: string) => Array<{ id: string; name: string }>
  getCitiesByRegion: (regionId: string) => Array<{ id: string; name: string }>
}

export function useSupplierForm({
  onSubmit,
  getRegionsByCountry,
  getCitiesByCountry,
  getCitiesByRegion,
}: UseSupplierFormProps) {
  const [formData, setFormData] = useState<Omit<SupplierFormData, 'supplier_code'>>({
    name: '',
    country: '',
    region: '',
    cities: [],
    type: 'hotel',
    contact: {
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      website: '',
    },
    status: 'active',
    note: '',
  })

  const [paymentAccounts, setPaymentAccounts] = useState<
    Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>[]
  >([])

  // Get available regions based on selected country
  const availableRegions = useMemo(() => {
    if (!formData.country) return []
    return getRegionsByCountry(formData.country)
  }, [formData.country, getRegionsByCountry])

  // Get available cities based on selected region or country
  const availableCities = useMemo(() => {
    if (formData.region) {
      return getCitiesByRegion(formData.region)
    } else if (formData.country) {
      return getCitiesByCountry(formData.country)
    }
    return []
  }, [formData.country, formData.region, getCitiesByCountry, getCitiesByRegion])

  // Update form field
  const setFormField = useCallback(
    <K extends keyof Omit<SupplierFormData, 'supplier_code'>>(
      field: K,
      value: Omit<SupplierFormData, 'supplier_code'>[K]
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  // Update contact field
  const setContactField = useCallback(
    <K extends keyof SupplierFormData['contact']>(
      field: K,
      value: SupplierFormData['contact'][K]
    ) => {
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [field]: value },
      }))
    },
    []
  )

  // Handle country change (cascade reset)
  const handleCountryChange = useCallback((countryId: string) => {
    setFormData(prev => ({
      ...prev,
      country: countryId,
      region: '',
      cities: [],
    }))
  }, [])

  // Handle region change (cascade reset)
  const handleRegionChange = useCallback((regionId: string) => {
    setFormData(prev => ({
      ...prev,
      region: regionId,
      cities: [],
    }))
  }, [])

  // Toggle city selection
  const toggleCitySelection = useCallback((cityId: string) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.includes(cityId)
        ? prev.cities.filter(id => id !== cityId)
        : [...prev.cities, cityId],
    }))
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      country: '',
      region: '',
      cities: [],
      type: 'hotel',
      contact: {
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        website: '',
      },
      status: 'active',
      note: '',
    })
    setPaymentAccounts([])
  }, [])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || !formData.contact.contact_person.trim()) {
      throw new Error('請填寫必填欄位')
    }
    if (!formData.country) {
      throw new Error('請選擇國家')
    }
    if (formData.cities.length === 0) {
      throw new Error('請至少選擇一個服務城市')
    }

    await onSubmit(formData, formData.cities, paymentAccounts)
    resetForm()
  }, [formData, paymentAccounts, onSubmit, resetForm])

  return {
    formData,
    paymentAccounts,
    availableRegions,
    availableCities,
    setFormField,
    setContactField,
    setPaymentAccounts,
    handleCountryChange,
    handleRegionChange,
    toggleCitySelection,
    resetForm,
    handleSubmit,
  }
}
