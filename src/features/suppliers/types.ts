/**
 * Suppliers feature types
 */

import { Supplier, SupplierPaymentAccount } from '@/types/supplier.types'

export type { Supplier, SupplierPaymentAccount }

export interface SupplierFormData {
  supplier_code: string
  name: string
  country: string
  region: string
  cities: string[]
  type: Supplier['type']
  contact: {
    contact_person: string
    phone: string
    email: string
    address: string
    website: string
  }
  status: Supplier['status']
  note: string
}

export interface SupplierFilters {
  searchQuery: string
  statusFilter?: Supplier['status']
  typeFilter?: Supplier['type']
  countryFilter?: string
}
