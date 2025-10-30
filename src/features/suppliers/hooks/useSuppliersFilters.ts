/**
 * Hook for filtering suppliers
 */

'use client'

import { useMemo } from 'react'
import { Supplier } from '../types'

interface UseSuppliersFiltersProps {
  suppliers: Record<string, Supplier> | Supplier[]
  searchQuery: string
}

export function useSuppliersFilters({ suppliers, searchQuery }: UseSuppliersFiltersProps) {
  const filteredSuppliers = useMemo(() => {
    // Convert suppliers to array if needed
    const suppliersArray = Array.isArray(suppliers)
      ? suppliers
      : suppliers
        ? Object.values(suppliers)
        : []

    // Filter by search query
    if (!searchQuery) return suppliersArray

    const query = searchQuery.toLowerCase()
    return suppliersArray.filter(supplier => {
      return (
        supplier.name.toLowerCase().includes(query) ||
        (supplier.supplier_code && supplier.supplier_code.toLowerCase().includes(query)) ||
        (supplier.country && supplier.country.toLowerCase().includes(query)) ||
        (supplier.location && supplier.location.toLowerCase().includes(query)) ||
        supplier.contact.contact_person.toLowerCase().includes(query)
      )
    })
  }, [suppliers, searchQuery])

  return { filteredSuppliers }
}
