/**
 * 供應商類別 Store
 */

import { createStore } from './core/create-store'
import type { SupplierCategory } from '@/types/supplier-category.types'

export const useSupplierCategoryStore = createStore<SupplierCategory>('supplier_categories')
