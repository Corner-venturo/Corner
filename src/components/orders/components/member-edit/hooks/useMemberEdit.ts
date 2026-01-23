/**
 * useMemberEdit - 成員編輯狀態管理
 * 從 MemberEditDialog.tsx 提取
 */

'use client'

import { useState } from 'react'
import { useImageEditor } from '@/hooks/image-editor'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { OrderMember } from '../../../order-member.types'

interface EditFormData {
  chinese_name?: string
  passport_name?: string
  birth_date?: string
  gender?: string
  id_number?: string
  passport_number?: string
  passport_expiry?: string
  special_meal?: string
  remarks?: string
}

// 從 URL 提取檔名並刪除舊照片
async function deleteOldPassportImage(oldUrl: string | null | undefined): Promise<void> {
  if (!oldUrl) return
  try {
    // 從 URL 提取檔名 (格式: .../passport-images/filename.jpg)
    const match = oldUrl.match(/passport-images\/(.+)$/)
    if (match) {
      const oldFileName = decodeURIComponent(match[1])
      await supabase.storage.from('passport-images').remove([oldFileName])
      logger.log(`已刪除舊護照照片: ${oldFileName}`)
    }
  } catch (error) {
    // 刪除失敗不影響上傳流程，只記錄錯誤
    logger.error('刪除舊護照照片失敗:', error)
  }
}

// 圖片壓縮函數
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (ev) => {
      const img = new Image()
      img.src = ev.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
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
        if (!ctx) {
          reject(new Error('無法取得 canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              reject(new Error('壓縮失敗'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export function useMemberEdit(
  editingMember: OrderMember | null,
  onMemberChange: (member: OrderMember) => void,
  onRecognize: (imageUrl: string) => Promise<void>
) {
  const imageEditor = useImageEditor()

  // 儲存旋轉/翻轉後的圖片
  const handleSaveTransform = async () => {
    if (!editingMember?.passport_image_url) return

    imageEditor.setIsSaving(true)
    const oldUrl = editingMember.passport_image_url
    try {
      const transformedImage = await imageEditor.transformImage(
        editingMember.passport_image_url,
        imageEditor.rotation,
        imageEditor.flipH
      )
      const response = await fetch(transformedImage)
      const blob = await response.blob()
      // 統一格式：passport_{timestamp}_{random}.jpg
      const random = Math.random().toString(36).substring(2, 8)
      const fileName = `passport_${Date.now()}_${random}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(fileName, blob, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('passport-images')
        .getPublicUrl(fileName)

      await supabase
        .from('order_members')
        .update({ passport_image_url: urlData.publicUrl })
        .eq('id', editingMember.id)

      // 上傳成功後刪除舊照片
      await deleteOldPassportImage(oldUrl)

      onMemberChange({ ...editingMember, passport_image_url: urlData.publicUrl })
      imageEditor.reset()

      const { toast } = await import('sonner')
      toast.success('圖片已儲存')
    } catch (error) {
      logger.error('儲存圖片失敗:', error)
      const { toast } = await import('sonner')
      toast.error('儲存圖片失敗')
    } finally {
      imageEditor.setIsSaving(false)
    }
  }

  // 確認裁剪
  const handleConfirmCrop = async () => {
    if (!editingMember?.passport_image_url) return

    const oldUrl = editingMember.passport_image_url
    try {
      const croppedImage = await imageEditor.confirmCrop(editingMember.passport_image_url)
      if (croppedImage) {
        imageEditor.setIsSaving(true)
        const response = await fetch(croppedImage)
        const blob = await response.blob()
        // 統一格式：passport_{timestamp}_{random}.jpg
      const random = Math.random().toString(36).substring(2, 8)
      const fileName = `passport_${Date.now()}_${random}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('passport-images')
          .upload(fileName, blob, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('passport-images')
          .getPublicUrl(fileName)

        await supabase
          .from('order_members')
          .update({ passport_image_url: urlData.publicUrl })
          .eq('id', editingMember.id)

        // 上傳成功後刪除舊照片
        await deleteOldPassportImage(oldUrl)

        onMemberChange({ ...editingMember, passport_image_url: urlData.publicUrl })
        imageEditor.reset()

        const { toast } = await import('sonner')
        toast.success('裁剪完成')
      }
    } catch (error) {
      const { toast } = await import('sonner')
      toast.error(error instanceof Error ? error.message : '裁剪失敗')
    } finally {
      imageEditor.setIsSaving(false)
    }
  }

  // 上傳新護照照片
  const handleUploadPassport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingMember) return

    const oldUrl = editingMember.passport_image_url
    try {
      const compressedFile = await compressImage(file)
      // 統一格式：passport_{timestamp}_{random}.jpg
      const random = Math.random().toString(36).substring(2, 8)
      const fileName = `passport_${Date.now()}_${random}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(fileName, compressedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('passport-images')
        .getPublicUrl(fileName)

      await supabase
        .from('order_members')
        .update({ passport_image_url: urlData.publicUrl })
        .eq('id', editingMember.id)

      // 上傳成功後刪除舊照片
      await deleteOldPassportImage(oldUrl)

      onMemberChange({ ...editingMember, passport_image_url: urlData.publicUrl })

      const { toast } = await import('sonner')
      toast.success('護照照片上傳成功')
    } catch (error) {
      logger.error('護照上傳失敗:', error)
      const { toast } = await import('sonner')
      toast.error('上傳失敗，請重試')
    }

    e.target.value = ''
  }

  // 再次辨識護照
  const handleRecognize = async () => {
    if (!editingMember?.passport_image_url) return
    await onRecognize(editingMember.passport_image_url)
  }

  return {
    imageEditor,
    handleSaveTransform,
    handleConfirmCrop,
    handleUploadPassport,
    handleRecognize,
  }
}

export type { EditFormData }
