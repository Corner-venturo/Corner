'use client'

import { useState, useCallback, useMemo } from 'react'
import type { ComboboxOption } from '@/components/ui/combobox'

interface VisaApplicant {
  id: string
  name: string
  country: string
  is_urgent: boolean
  received_date: string // 收件時間
  expected_issue_date: string // 預計下件時間
  cost: number
}

/**
 * 簽證對話框邏輯 Hook
 * 負責對話框狀態、表單資料、辦理人管理
 */
interface Tour {
  id: string
  code: string
  name: string
}

export function useVisasDialog(tours: Tour[]) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 聯絡人資訊
  const [contact_info, setContactInfo] = useState({
    tour_id: '',
    order_id: '',
    applicant_name: '',
    contact_person: '',
    contact_phone: '',
  })

  // 批次辦理人列表
  const [applicants, setApplicants] = useState<VisaApplicant[]>([
    {
      id: '1',
      name: '',
      country: '護照 成人',
      is_urgent: false,
      received_date: '',
      expected_issue_date: '',
      cost: 0,
    },
  ])

  // 團號選項
  const tourOptions: ComboboxOption[] = useMemo(() => {
    return tours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  }, [tours])

  // 計算下件時間
  const calculateReceivedDate = useCallback((submissionDate: string, visaType: string): string => {
    if (!submissionDate) return ''

    const date = new Date(submissionDate)
    let days = 21

    if (visaType.includes('ESTA')) {
      days = 3 // 美國 ESTA 通常 72 小時內
    } else if (visaType.includes('台胞證') && visaType.includes('急件')) {
      days = 6
    } else if (visaType.includes('護照') && visaType.includes('急件')) {
      days = 3
    } else if (visaType.includes('台胞證')) {
      days = 14
    } else if (visaType.includes('護照')) {
      days = 21
    }

    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }, [])

  // 計算代辦費
  const calculateFee = useCallback((country: string): number => {
    if (country.includes('ESTA')) return 1000 // 美國 ESTA 代辦費
    if (country.includes('兒童')) return 1500
    if (country.includes('首辦')) return 800
    if (country.includes('台胞證') && country.includes('遺失件')) return 2900
    return 1800
  }, [])

  // 新增辦理人
  const addApplicant = useCallback(() => {
    setApplicants(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        country: '護照 成人',
        is_urgent: false,
        received_date: '',
        expected_issue_date: '',
        cost: 0,
      },
    ])
  }, [])

  // 移除辦理人
  const removeApplicant = useCallback(
    (id: string) => {
      if (applicants.length > 1) {
        setApplicants(prev => prev.filter(a => a.id !== id))
      }
    },
    [applicants.length]
  )

  // 更新辦理人資料
  const updateApplicant = useCallback(
    (id: string, field: keyof VisaApplicant, value: unknown) => {
      setApplicants(prev =>
        prev.map(a => {
          if (a.id !== id) return a

          const updated = { ...a, [field]: value }

          // 如果是收件時間或簽證類型改變，自動計算預計下件時間
          if (field === 'received_date' || field === 'country' || field === 'is_urgent') {
            if (updated.received_date) {
              const visaTypeWithUrgent = updated.is_urgent
                ? `${updated.country} 急件`
                : updated.country
              updated.expected_issue_date = calculateReceivedDate(
                updated.received_date,
                visaTypeWithUrgent
              )
            }
          }

          // 如果勾選/取消急件，自動調整成本 ±1000
          if (field === 'is_urgent') {
            if (value === true) {
              updated.cost = a.cost + 1000
            } else {
              updated.cost = Math.max(0, a.cost - 1000)
            }
          }

          return updated
        })
      )
    },
    [calculateReceivedDate]
  )

  // 重置表單
  const resetForm = useCallback((defaultTourId?: string) => {
    setContactInfo({
      tour_id: defaultTourId || '',
      order_id: '',
      applicant_name: '',
      contact_person: '',
      contact_phone: '',
    })
    setApplicants([
      {
        id: '1',
        name: '',
        country: '護照 成人',
        is_urgent: false,
        received_date: '',
        expected_issue_date: '',
        cost: 0,
      },
    ])
  }, [])

  return {
    isDialogOpen,
    setIsDialogOpen,
    contact_info,
    setContactInfo,
    applicants,
    setApplicants,
    tourOptions,
    calculateReceivedDate,
    calculateFee,
    addApplicant,
    removeApplicant,
    updateApplicant,
    resetForm,
  }
}
