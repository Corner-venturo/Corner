'use client'

import React, { useEffect, useMemo } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { useUserStore } from '@/stores/user-store'
import type { Employee } from '@/stores/types'
import type { SyncableEntity } from '@/types'
import type { NewTourData } from '../../types'

type EmployeeWithSync = Employee & Partial<SyncableEntity>

interface TourSettingsProps {
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
}

export function TourSettings({ newTour, setNewTour }: TourSettingsProps) {
  const { items: employees, fetchAll: fetchEmployees } = useUserStore()

  // 載入員工資料
  useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees()
    }
  }, [employees.length, fetchEmployees])

  // 篩選團控人員（roles 包含 'controller'）
  const controllers = useMemo(() => {
    const activeEmployees = employees.filter(emp => {
      const empWithSync = emp as EmployeeWithSync
      const notDeleted = !empWithSync._deleted
      const isActive = emp.status === 'active'
      return notDeleted && isActive
    })

    const controllerOnly = activeEmployees.filter(emp => emp.roles?.includes('controller'))

    // 如果有標記團控的就只顯示團控，沒有就顯示所有人
    return controllerOnly.length > 0 ? controllerOnly : activeEmployees
  }, [employees])

  return (
    <div className="space-y-4">
      {/* 團控人員選擇 */}
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">
          團控人員
        </label>
        <Combobox
          options={controllers.map(emp => ({
            value: emp.id,
            label: `${emp.display_name || emp.english_name} (${emp.employee_number})`,
          }))}
          value={newTour.controller_id || ''}
          onChange={value => setNewTour(prev => ({ ...prev, controller_id: value || undefined }))}
          placeholder="選擇團控人員..."
          emptyMessage="找不到團控人員"
          showSearchIcon={true}
          showClearButton={true}
        />
      </div>

      {/* 設定選項 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isSpecial"
            checked={newTour.isSpecial}
            onChange={e => setNewTour(prev => ({ ...prev, isSpecial: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isSpecial" className="text-sm text-morandi-primary">
            特殊團
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableCheckin"
            checked={newTour.enable_checkin || false}
            onChange={e => setNewTour(prev => ({ ...prev, enable_checkin: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="enableCheckin" className="text-sm text-morandi-primary">
            開啟報到功能
          </label>
        </div>
      </div>
    </div>
  )
}
