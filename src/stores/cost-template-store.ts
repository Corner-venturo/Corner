/**
 * 成本模板 Store
 */

import { createStore } from './core/create-store'
import type { CostTemplate } from '@/types/supplier.types'

export const useCostTemplateStore = createStore<CostTemplate>('cost_templates')
