import { useState, useCallback, useEffect } from 'react'
import { useVisaDateCalculator } from './use-visa-date-calculator'

export interface VisaApplicant {
  id: string
  name: string
  country: string
  is_urgent: boolean
  submission_date: string
  received_date: string
  cost: number
}

export interface VisaContactInfo {
  tour_id: string
  order_id: string
  applicant_name: string
  contact_person: string
  contact_phone: string
}

/**
 * 簽證表單管理 Hook
 * 處理聯絡人資訊和批次辦理人列表的狀態管理
 */
export const useVisaForm = () => {
  const { calculateReceivedDate } = useVisaDateCalculator()

  // 聯絡人資訊
  const [contactInfo, setContactInfo] = useState<VisaContactInfo>({
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
      submission_date: '',
      received_date: '',
      cost: 0,
    },
  ])

  // 第一個辦理人自動帶入申請人姓名（即時同步）
  useEffect(() => {
    if (applicants.length > 0) {
      setApplicants(prev => {
        const updated = [...prev]
        updated[0].name = contactInfo.applicant_name
        return updated
      })
    }
  }, [contactInfo.applicant_name, applicants.length])

  /**
   * 新增辦理人
   */
  const addApplicant = useCallback(() => {
    setApplicants(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        country: '護照 成人',
        is_urgent: false,
        submission_date: '',
        received_date: '',
        cost: 0,
      },
    ])
  }, [])

  /**
   * 移除辦理人
   */
  const removeApplicant = useCallback(
    (id: string) => {
      if (applicants.length > 1) {
        setApplicants(prev => prev.filter(a => a.id !== id))
      }
    },
    [applicants.length]
  )

  /**
   * 更新辦理人資料
   */
  const updateApplicant = useCallback(
    (id: string, field: keyof VisaApplicant, value: unknown) => {
      setApplicants(prev =>
        prev.map(a => {
          if (a.id !== id) return a

          const updated = { ...a, [field]: value }

          // 如果是送件時間或簽證類型改變，自動計算下件時間
          if (field === 'submission_date' || field === 'country' || field === 'is_urgent') {
            if (updated.submission_date) {
              const visaTypeWithUrgent = updated.is_urgent
                ? `${updated.country} 急件`
                : updated.country
              updated.received_date = calculateReceivedDate(
                updated.submission_date,
                visaTypeWithUrgent
              )
            }
          }

          // 如果勾選/取消急件，自動調整成本 ±1000
          if (field === 'is_urgent') {
            if (value === true) {
              // 勾選急件：+1000
              updated.cost = a.cost + 1000
            } else {
              // 取消急件：-1000
              updated.cost = Math.max(0, a.cost - 1000)
            }
          }

          return updated
        })
      )
    },
    [calculateReceivedDate]
  )

  /**
   * 重置表單
   */
  const resetForm = useCallback(() => {
    setContactInfo({
      tour_id: '',
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
        submission_date: '',
        received_date: '',
        cost: 0,
      },
    ])
  }, [])

  return {
    contactInfo,
    setContactInfo,
    applicants,
    setApplicants,
    addApplicant,
    removeApplicant,
    updateApplicant,
    resetForm,
  }
}
