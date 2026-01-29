'use client'

/**
 * Employees Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Employee } from '@/stores/types'

export const employeeEntity = createEntityHook<Employee>('employees', {
  list: {
    select: '*',
    orderBy: { column: 'employee_number', ascending: true },
  },
  slim: {
    select: 'id,employee_number,display_name,chinese_name,english_name,email,status,roles,workspace_id,employee_type,avatar',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.low,
  workspaceScoped: false, // 員工是全域資料
})

export const useEmployees = employeeEntity.useList
export const useEmployeesSlim = employeeEntity.useListSlim
export const useEmployee = employeeEntity.useDetail
export const useEmployeesPaginated = employeeEntity.usePaginated
export const useEmployeeDictionary = employeeEntity.useDictionary

export const createEmployee = employeeEntity.create
export const updateEmployee = employeeEntity.update
export const deleteEmployee = employeeEntity.delete
export const invalidateEmployees = employeeEntity.invalidate
