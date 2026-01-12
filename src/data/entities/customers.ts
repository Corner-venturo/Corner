'use client'

/**
 * Customers Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Customer } from '@/stores/types'

export const customerEntity = createEntityHook<Customer>('customers', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,code,name,phone,email',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
})

export const useCustomers = customerEntity.useList
export const useCustomersSlim = customerEntity.useListSlim
export const useCustomer = customerEntity.useDetail
export const useCustomersPaginated = customerEntity.usePaginated
export const useCustomerDictionary = customerEntity.useDictionary

export const createCustomer = customerEntity.create
export const updateCustomer = customerEntity.update
export const deleteCustomer = customerEntity.delete
export const invalidateCustomers = customerEntity.invalidate
