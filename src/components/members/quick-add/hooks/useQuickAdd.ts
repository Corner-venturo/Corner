'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useMembers, useCustomers, createMember, updateMember, createCustomer } from '@/data'
import type { Customer } from '@/types/customer.types'
import type { Member } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'

interface ParsedMember {
  name: string
  name_en: string
  passport_number: string
  passport_expiry: string
  id_number: string
  birthday: string
  gender: string
}

// 壓縮圖片函數
async function compressImage(file: File, quality = 0.6): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = e => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 護照 OCR 只需要看底部文字，降低到 1200px
        const maxDimension = 1200
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          async blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })

              // 如果還是太大，遞迴降低品質（目標 800 KB）
              if (compressedFile.size > 800 * 1024 && quality > 0.2) {
                resolve(await compressImage(file, quality - 0.1))
              } else {
                resolve(compressedFile)
              }
            } else {
              reject(new Error('壓縮失敗'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export function useQuickAdd(orderId: string, onMembersAdded?: () => void) {
  const [mode, setMode] = useState<'upload' | 'search' | null>(null)
  const [passportFiles, setPassportFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingMember, setPendingMember] = useState<ParsedMember | null>(null)
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([])

  const { items: members } = useMembers()
  const { items: customers } = useCustomers()

  // 過濾掉已經在這個訂單裡的顧客
  const existingIds = members
    .filter(m => m.order_id === orderId)
    .flatMap(m => [m.passport_number, m.id_number].filter(Boolean))
  const availableCustomers = customers.filter(c =>
    !existingIds.includes(c.national_id ?? '') &&
    !existingIds.includes(c.passport_number ?? '')
  )

  // 上傳護照照片到 Supabase Storage
  const uploadPassportImage = async (file: File, memberId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${memberId}_${Date.now()}.${fileExt}`
      const filePath = `passports/${fileName}`

      const { error } = await supabase.storage
        .from('member-documents')
        .upload(filePath, file, { upsert: true })

      if (error) {
        logger.error('上傳護照照片失敗:', error)
        if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('exceeded')) {
          toast.error('雲端儲存空間已滿，護照照片無法儲存。請聯繫管理員升級方案。')
        }
        return null
      }

      const { data: urlData } = supabase.storage
        .from('member-documents')
        .getPublicUrl(filePath)

      return urlData?.publicUrl || null
    } catch (error) {
      logger.error('上傳護照照片失敗:', error)
      return null
    }
  }

  // 新增成員 + 自動新增到顧客資料庫
  const addMemberAndCustomer = async (parsed: ParsedMember, confirmedCustomerId?: string, passportFile?: File) => {
    const existingOrderMembers = members.filter(m => m.order_id === orderId)
    const duplicateInOrder = existingOrderMembers.find(
      m =>
        (parsed.passport_number && m.passport_number === parsed.passport_number) ||
        (parsed.id_number && m.id_number === parsed.id_number)
    )

    if (duplicateInOrder) {
      toast.warning(`${parsed.name} 已在此訂單中，跳過`)
      return
    }

    let customerId: string | undefined

    if (confirmedCustomerId) {
      customerId = confirmedCustomerId
    } else {
      const exactMatch = customers.find(
        c =>
          c.passport_number === parsed.passport_number &&
          c.national_id === parsed.id_number &&
          parsed.passport_number &&
          parsed.id_number
      )

      const partialMatch = customers.find(
        c =>
          (c.passport_number && c.passport_number === parsed.passport_number) ||
          (c.national_id && c.national_id === parsed.id_number)
      )

      const nameMatches = customers.filter(c => c.name === parsed.name)

      if (exactMatch) {
        customerId = exactMatch.id
        toast.success(`辨識到現有顧客：${exactMatch.name}`)
      } else if (partialMatch) {
        setPendingMember(parsed)
        setMatchedCustomers([partialMatch])
        setShowConfirmDialog(true)
        return
      } else if (nameMatches.length > 0) {
        setPendingMember(parsed)
        setMatchedCustomers(nameMatches)
        setShowConfirmDialog(true)
        return
      } else {
        const newCustomer = await createCustomer({
          name: parsed.name,
          passport_number: parsed.passport_number,
          passport_name: parsed.name_en,
          passport_expiry: parsed.passport_expiry,
          national_id: parsed.id_number,
          birth_date: parsed.birthday,
          gender: parsed.gender,
          email: '',
          phone: '',
        } as unknown as Parameters<typeof createCustomer>[0])

        customerId = newCustomer?.id
        toast.success(`新增顧客：${parsed.name}`)
      }
    }

    const newMember = await createMember({
      order_id: orderId,
      name: parsed.name,
      name_en: parsed.name_en,
      passport_number: parsed.passport_number,
      passport_expiry: parsed.passport_expiry,
      id_number: parsed.id_number,
      birthday: parsed.birthday,
      gender: parsed.gender,
      customer_id: customerId,
      reservation_code: '',
      add_ons: [],
      refunds: [],
    } as unknown as Parameters<typeof createMember>[0])

    if (passportFile && newMember?.id) {
      const passportUrl = await uploadPassportImage(passportFile, newMember.id)
      if (passportUrl) {
        await updateMember(newMember.id, {
          passport_image_url: passportUrl,
        } as unknown as Parameters<typeof updateMember>[1])
      }
    }
  }

  const handleUploadPassports = async () => {
    if (passportFiles.length === 0) {
      toast.error('請先選擇護照照片')
      return
    }

    setIsUploading(true)

    try {
      const existingMembers = members.filter(m => m.order_id === orderId)

      interface ParsedResult {
        parsed: ParsedMember
        file: File
      }
      const results: ParsedResult[] = []

      for (const file of passportFiles) {
        const compressedFile = await compressImage(file)

        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(compressedFile)
        })

        const response = await fetch('/api/ocr/passport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        if (!response.ok) {
          throw new Error(`辨識失敗：${file.name}`)
        }

        const data = await response.json()
        if (data.success && data.data) {
          results.push({ parsed: data.data, file: compressedFile })
        }
      }

      if (results.length === 0) {
        toast.error('無法辨識護照資訊')
        return
      }

      let updatedCount = 0
      let newCount = 0

      for (const { parsed, file } of results) {
        const matchedMember = existingMembers.find(m =>
          (parsed.passport_number && m.passport_number === parsed.passport_number) ||
          (parsed.name && m.name === parsed.name)
        )

        if (matchedMember) {
          const passportUrl = await uploadPassportImage(file, matchedMember.id)

          await updateMember(matchedMember.id, {
            name_en: parsed.name_en || matchedMember.name_en,
            passport_number: parsed.passport_number || matchedMember.passport_number,
            passport_expiry: parsed.passport_expiry || matchedMember.passport_expiry,
            id_number: parsed.id_number || matchedMember.id_number,
            birthday: parsed.birthday || matchedMember.birthday,
            gender: parsed.gender || matchedMember.gender,
            ...(passportUrl && { passport_image_url: passportUrl }),
          } as Parameters<typeof updateMember>[1])

          updatedCount++
        } else {
          await addMemberAndCustomer(parsed, undefined, file)
          newCount++
        }
      }

      const messages: string[] = []
      if (updatedCount > 0) messages.push(`更新 ${updatedCount} 位`)
      if (newCount > 0) messages.push(`新增 ${newCount} 位`)
      toast.success(messages.join('、') || '處理完成')

      setPassportFiles([])
      setMode(null)
      onMembersAdded?.()
    } catch (error) {
      logger.error('OCR 錯誤:', error)
      toast.error('辨識失敗，請重試')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectCustomer = async () => {
    if (!selectedCustomer) {
      toast.error('請選擇顧客')
      return
    }

    const memberData = {
      order_id: orderId,
      name: selectedCustomer.name,
      name_en: selectedCustomer.passport_name || '',
      passport_number: selectedCustomer.passport_number || '',
      passport_expiry: selectedCustomer.passport_expiry || '',
      id_number: selectedCustomer.national_id || '',
      birthday: selectedCustomer.birth_date || '',
      gender: selectedCustomer.gender || '',
      reservation_code: '',
      add_ons: [],
      refunds: [],
    }

    await createMember(memberData as unknown as Parameters<typeof createMember>[0])
    toast.success(`已新增成員：${selectedCustomer.name}`)
    setSelectedCustomer(null)
    setMode(null)
    onMembersAdded?.()
  }

  return {
    mode,
    setMode,
    passportFiles,
    setPassportFiles,
    isUploading,
    selectedCustomer,
    setSelectedCustomer,
    availableCustomers,
    handleUploadPassports,
    handleSelectCustomer,
    showConfirmDialog,
    setShowConfirmDialog,
    pendingMember,
    setPendingMember,
    matchedCustomers,
    addMemberAndCustomer,
    createCustomer,
  }
}
