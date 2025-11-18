/**
 * Hook for managing suppliers data and operations
 */

'use client'

import { useCallback, useMemo } from 'react'
import { useSupplierStore, useRegionsStore } from '@/stores'
import { supplierService } from '../services/supplier.service'
import { Supplier, SupplierPaymentAccount } from '../types'

export function useSuppliersData() {
  const { items: suppliers, create: addSupplier, fetchAll } = useSupplierStore()
  const {
    countries,
    regions,
    cities,
    fetchAll: fetchRegions,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  } = useRegionsStore()

  // Get active countries
  const activeCountries = useMemo(() => {
    return countries
      .filter(c => c.is_active)
      .map(c => ({ code: c.id, name: c.name, emoji: c.emoji }))
  }, [countries])

  // Create supplier with cities and payment accounts
  const handleCreateSupplier = useCallback(
    async (
      supplierData: {
        name: string
        country: string
        region: string
        type: 'hotel' | 'restaurant' | 'bus_company' | 'airline' | 'attraction' | 'other'
        contact: {
          contact_person: string
          phone: string
          email?: string
          address?: string
          website?: string
        }
        status: 'active' | 'inactive'
        note?: string
      },
      cityIds: string[],
      paymentAccounts: Omit<
        SupplierPaymentAccount,
        'id' | 'supplier_id' | 'created_at' | 'updated_at'
      >[]
    ) => {
      // Generate supplier code
      const country = countries.find(c => c.id === supplierData.country)
      const countryCode = country?.code || 'OTH'

      const suppliersArray = suppliers ? (Array.isArray(suppliers) ? suppliers : Object.values(suppliers)) : []
      const sameCountryCount = suppliersArray.filter(
        (s: any) => s.country === supplierData.country
      ).length

      const sequence = (sameCountryCount + 1).toString().padStart(3, '0')
      const supplierCode = `S${countryCode}${sequence}`

      // Create supplier with cities and payment accounts
      await supplierService.createSupplierWithCities(
        {
          supplier_code: supplierCode,
          ...supplierData,
        },
        cityIds,
        paymentAccounts
      )

      // Reload suppliers
      await fetchAll()
    },
    [suppliers, countries, fetchAll]
  )

  return {
    suppliers,
    countries,
    regions,
    cities,
    activeCountries,
    fetchRegions,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
    handleCreateSupplier,
  }
}
