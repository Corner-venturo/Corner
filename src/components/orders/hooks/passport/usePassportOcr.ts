/**
 * usePassportOcr - OCR 識別邏輯
 *
 * 功能：
 * - 呼叫 OCR API
 * - 解析 OCR 結果
 * - 檢查重複成員
 */

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { ProcessedFile } from '../../order-member.types'

interface OcrCustomerData {
  name?: string
  english_name?: string
  passport_romanization?: string
  passport_number?: string
  passport_expiry_date?: string | null
  national_id?: string
  date_of_birth?: string | null
  sex?: string
}

interface OcrResult {
  success: boolean
  customer: OcrCustomerData
  fileName: string
}

interface OcrApiResponse {
  results: OcrResult[]
  successful: number
  total: number
}

interface ExistingMember {
  passport_number: string | null
  id_number: string | null
  chinese_name: string | null
  birth_date: string | null
}

interface DuplicateCheckResult {
  isDuplicate: boolean
  reason: string
}

interface UsePassportOcrReturn {
  performOcr: (files: File[]) => Promise<OcrApiResponse>
  checkDuplicate: (
    customer: OcrCustomerData,
    existingMembers: ExistingMember[]
  ) => DuplicateCheckResult
}

export function usePassportOcr(): UsePassportOcrReturn {
  // 執行 OCR 辨識
  const performOcr = useCallback(async (files: File[]): Promise<OcrApiResponse> => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await fetch('/api/ocr/passport', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('OCR 辨識失敗')
    }

    return await response.json()
  }, [])

  // 檢查是否為重複成員
  const checkDuplicate = useCallback((
    customer: OcrCustomerData,
    existingMembers: ExistingMember[]
  ): DuplicateCheckResult => {
    const passportNumber = customer.passport_number || ''
    const idNumber = customer.national_id || ''
    const birthDate = customer.date_of_birth || null
    const chineseName = customer.name || ''
    const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()
    const nameBirthKey = cleanChineseName && birthDate ? `${cleanChineseName}|${birthDate}` : ''

    // 建立檢查集合
    const existingPassports = new Set(existingMembers.map(m => m.passport_number).filter(Boolean))
    const existingIdNumbers = new Set(existingMembers.map(m => m.id_number).filter(Boolean))
    const existingNameBirthKeys = new Set(
      existingMembers
        .filter(m => m.chinese_name && m.birth_date)
        .map(m => `${m.chinese_name}|${m.birth_date}`)
    )

    // 檢查重複
    if (passportNumber && existingPassports.has(passportNumber)) {
      return { isDuplicate: true, reason: '護照號碼重複' }
    }

    if (idNumber && existingIdNumbers.has(idNumber)) {
      return { isDuplicate: true, reason: '身分證號重複' }
    }

    if (nameBirthKey && existingNameBirthKeys.has(nameBirthKey)) {
      return { isDuplicate: true, reason: '姓名+生日重複' }
    }

    return { isDuplicate: false, reason: '' }
  }, [])

  return {
    performOcr,
    checkDuplicate,
  }
}
