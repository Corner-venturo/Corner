'use client'

import { useState, useRef } from 'react'
import { DailyItinerary, Activity, DayDisplayStyle } from '../../../types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface UseDayTemplateProps {
  dayData: DailyItinerary
  style: DayDisplayStyle
}

export function useDayTemplate({ dayData, style }: UseDayTemplateProps) {
  const [editingDay, setEditingDay] = useState<DailyItinerary>(dayData)
  const [currentStyle, setCurrentStyle] = useState<DayDisplayStyle>(style)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ type: 'activity' | 'day'; index?: number } | null>(null)

  // 更新欄位
  const updateField = (field: keyof DailyItinerary, value: unknown) => {
    setEditingDay(prev => ({ ...prev, [field]: value }))
  }

  // 更新活動
  const updateActivity = (actIndex: number, field: keyof Activity, value: string) => {
    setEditingDay(prev => ({
      ...prev,
      activities: prev.activities.map((act, i) =>
        i === actIndex ? { ...act, [field]: value } : act
      ),
    }))
  }

  // 新增活動
  const addActivity = () => {
    setEditingDay(prev => ({
      ...prev,
      activities: [
        ...prev.activities,
        { icon: '📍', title: '', description: '', image: '' }
      ],
    }))
  }

  // 處理圖片上傳
  const handleImageUpload = async (file: File, target: { type: 'activity' | 'day'; index?: number }) => {
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案')
      return
    }

    const targetKey = target.type === 'activity' ? `activity-${target.index}` : 'day'
    setUploading(targetKey)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `template-${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-activity-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      if (target.type === 'activity' && target.index !== undefined) {
        updateActivity(target.index, 'image', urlData.publicUrl)
      }

      toast.success('圖片上傳成功')
    } catch (error) {
      logger.error('上傳失敗:', error)
      toast.error('圖片上傳失敗')
    } finally {
      setUploading(null)
      setUploadTarget(null)
    }
  }

  // 觸發圖片上傳
  const triggerUpload = (target: { type: 'activity' | 'day'; index?: number }) => {
    setUploadTarget(target)
    fileInputRef.current?.click()
  }

  // 取得主圖（第一個有圖的活動或每日圖片）
  const mainImage = editingDay.activities.find(a => a.image)?.image ||
    (editingDay.images?.[0] && (typeof editingDay.images[0] === 'string' ? editingDay.images[0] : editingDay.images[0].url))

  return {
    editingDay,
    currentStyle,
    setCurrentStyle,
    editingField,
    setEditingField,
    uploading,
    fileInputRef,
    uploadTarget,
    updateField,
    updateActivity,
    addActivity,
    handleImageUpload,
    triggerUpload,
    mainImage,
  }
}
