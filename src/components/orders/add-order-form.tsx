'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { useToursListSlim } from '@/hooks/useListSlim'
import { useUserStore } from '@/stores/user-store'
import type { Employee } from '@/stores/types'
import type { SyncableEntity } from '@/types'

// 型別守衛：檢查 Employee 是否包含同步欄位
type EmployeeWithSync = Employee & Partial<SyncableEntity>

export interface OrderFormData {
  tour_id: string
  contact_person: string
  sales_person: string
  assistant: string
  member_count?: number
  total_amount?: number
}

interface AddOrderFormProps {
  tourId?: string // 如果從旅遊團頁面打開，會帶入 tour_id

  // 獨立模式（用於 Dialog）
  onSubmit?: (orderData: OrderFormData) => void
  onCancel?: () => void

  // 嵌入模式（用於嵌入其他表單）
  value?: Partial<OrderFormData>
  onChange?: (orderData: Partial<OrderFormData>) => void
}

export function AddOrderForm({ tourId, onSubmit, onCancel, value, onChange }: AddOrderFormProps) {
  const { items: tours } = useToursListSlim()
  const { items: employees, fetchAll: fetchEmployees } = useUserStore()

  // 判斷是否為嵌入模式
  const isEmbedded = !!onChange

  // 內部 state（獨立模式使用）
  const [internalFormData, setInternalFormData] = useState<Partial<OrderFormData>>({
    tour_id: tourId || '',
    contact_person: '',
    sales_person: '',
    assistant: '',
  })

  // 使用外部 state 或內部 state
  const formData = isEmbedded ? value || {} : internalFormData
  const updateFormData = isEmbedded ? onChange : setInternalFormData

  // 載入員工資料
  React.useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees()
    }
  }, [employees.length, fetchEmployees])


  // 排序函數：按員工編號排序
  const sortByEmployeeNumber = (a: Employee, b: Employee) => {
    const numA = a.employee_number || ''
    const numB = b.employee_number || ''
    return numA.localeCompare(numB, 'en', { numeric: true })
  }

  // 篩選業務人員（roles 包含 'sales'）
  const salesPersons = useMemo(() => {
    const activeEmployees = employees.filter(emp => {
      const empWithSync = emp as EmployeeWithSync
      const notDeleted = !empWithSync._deleted
      const isActive = emp.status === 'active'
      // 排除機器人
      const notBot = emp.employee_number !== 'BOT001' && emp.id !== '00000000-0000-0000-0000-000000000001'
      return notDeleted && isActive && notBot
    })

    const salesOnly = activeEmployees.filter(emp => emp.roles?.includes('sales'))

    // 如果有標記業務的就只顯示業務，沒有就顯示所有人
    const result = salesOnly.length > 0 ? salesOnly : activeEmployees
    return result.sort(sortByEmployeeNumber)
  }, [employees])

  // 篩選助理（roles 包含 'assistant'）
  const assistants = useMemo(() => {
    const activeEmployees = employees.filter(emp => {
      const empWithSync = emp as EmployeeWithSync
      const notDeleted = !empWithSync._deleted
      const isActive = emp.status === 'active'
      // 排除機器人
      const notBot = emp.employee_number !== 'BOT001' && emp.id !== '00000000-0000-0000-0000-000000000001'
      return notDeleted && isActive && notBot
    })

    const assistantsOnly = activeEmployees.filter(emp => emp.roles?.includes('assistant'))

    // 如果有標記助理的就只顯示助理，沒有就顯示所有人
    const result = assistantsOnly.length > 0 ? assistantsOnly : activeEmployees
    return result.sort(sortByEmployeeNumber)
  }, [employees])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit && !isEmbedded) {
      onSubmit(formData as OrderFormData)
    }
  }

  // 嵌入模式用 div，獨立模式用 form
  const Container = isEmbedded ? 'div' : 'form'
  const containerProps = isEmbedded ? {} : { onSubmit: handleSubmit }

  return (
    <Container {...containerProps} className="space-y-4">
      {/* 選擇旅遊團（如果沒有預設 tour_id） */}
      {!tourId && (
        <div>
          <label className="text-sm font-medium text-morandi-primary">選擇旅遊團</label>
          <Combobox
            options={tours.map(tour => ({
              value: tour.id,
              label: `${tour.code} - ${tour.name}`,
              data: tour,
            }))}
            value={formData.tour_id || ''}
            onChange={value => updateFormData?.({ ...formData, tour_id: value })}
            placeholder="搜尋或選擇旅遊團..."
            emptyMessage="找不到旅遊團"
            className="mt-1"
          />
        </div>
      )}

      {/* 聯絡人 */}
      <div>
        <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
        <Input
          value={formData.contact_person || ''}
          onChange={e => updateFormData?.({ ...formData, contact_person: e.target.value })}
          placeholder="輸入聯絡人姓名"
          className="mt-1"
          required={!isEmbedded}
        />
      </div>

      {/* 業務和助理 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">業務</label>
          <Combobox
            options={salesPersons.map(emp => ({
              value: emp.display_name || emp.english_name,
              label: `${emp.display_name || emp.english_name} (${emp.employee_number})`,
            }))}
            value={formData.sales_person || ''}
            onChange={value => updateFormData?.({ ...formData, sales_person: value })}
            placeholder="選擇業務人員..."
            emptyMessage="找不到業務人員"
            showSearchIcon={true}
            showClearButton={true}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">助理</label>
          <Combobox
            options={assistants.map(emp => ({
              value: emp.display_name || emp.english_name,
              label: `${emp.display_name || emp.english_name} (${emp.employee_number})`,
            }))}
            value={formData.assistant || ''}
            onChange={value => updateFormData?.({ ...formData, assistant: value })}
            placeholder="選擇助理..."
            emptyMessage="找不到助理"
            showSearchIcon={true}
            showClearButton={true}
            className="mt-1"
          />
        </div>
      </div>


      {/* 按鈕（只在獨立模式顯示） */}
      {!isEmbedded && (
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            type="submit"
            disabled={!formData.tour_id || !formData.contact_person}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            新增訂單 <span className="ml-1 text-xs opacity-70">(Enter)</span>
          </Button>
        </div>
      )}
    </Container>
  )
}
