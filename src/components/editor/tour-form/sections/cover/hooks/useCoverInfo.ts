'use client'
import { useState, useMemo } from 'react'
import { TourFormData, CityOption, CoverStyleType, FlightStyleType } from '../../../types'
import { useRegionsStore } from '@/stores'
import { supabase } from '@/lib/supabase/client'
import { alert } from '@/lib/ui/alert-dialog'
import { useTemplates, getTemplateColor } from '@/features/itinerary/hooks/useTemplates'
import { logger } from '@/lib/utils/logger'

interface UseCoverInfoProps {
  data: TourFormData
  onChange: (data: TourFormData) => void
}

export function useCoverInfo({ data, onChange }: UseCoverInfoProps) {
  const { cities, updateCity: updateCityInStore } = useRegionsStore()
  const { coverTemplates, loading: templatesLoading } = useTemplates()
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')

  // 取得當前選擇城市的圖片
  const cityImages = useMemo(() => {
    if (!data.city) return []

    const selectedCity = cities.find(c => c.name === data.city)
    if (!selectedCity) return []

    const images = []
    if (selectedCity.background_image_url) {
      images.push({
        url: selectedCity.background_image_url,
        label: '圖片 1',
      })
    }
    if (selectedCity.background_image_url_2) {
      images.push({
        url: selectedCity.background_image_url_2,
        label: '圖片 2',
      })
    }
    return images
  }, [data.city, cities])

  // 封面風格對應的預設航班風格映射
  const getDefaultFlightStyle = (coverStyle: CoverStyleType): FlightStyleType => {
    switch (coverStyle) {
      case 'nature':
        return 'chinese'
      case 'luxury':
        return 'luxury'
      case 'art':
        return 'art'
      case 'dreamscape':
        return 'dreamscape'
      case 'collage':
        return 'collage'
      default:
        return 'original'
    }
  }

  // 從資料庫載入的封面風格選項（排除 serene）
  const coverStyleOptions = useMemo(() => {
    return coverTemplates
      .filter(template => template.id !== 'serene')
      .map(template => ({
        value: template.id as CoverStyleType,
        label: template.name,
        description: template.description || '',
        color: getTemplateColor(template.id),
        previewImage: template.preview_image_url,
      }))
  }, [coverTemplates])

  // 取得當前風格的顏色
  const currentStyleOption = coverStyleOptions.find(o => o.value === (data.coverStyle || 'original'))
  const currentStyleColor = currentStyleOption?.color || getTemplateColor(data.coverStyle)

  // 更新城市預設圖片
  const handleUpdateCityImage = async (imageNumber: 1 | 2) => {
    if (!data.city || !uploadedImageUrl) return

    const selectedCity = cities.find(c => c.name === data.city)
    if (!selectedCity) return

    try {
      const updateData = imageNumber === 1
        ? { background_image_url: uploadedImageUrl }
        : { background_image_url_2: uploadedImageUrl }

      // 更新資料庫
      const { error } = await supabase
        .from('cities')
        .update(updateData)
        .eq('id', selectedCity.id)

      if (error) throw error

      // 更新本地 store
      await updateCityInStore(selectedCity.id, updateData)

      void alert(`已將圖片設為「${data.city}」的預設圖片 ${imageNumber}！`, 'success')
      setShowUpdateDialog(false)
    } catch (error) {
      logger.error('更新城市圖片失敗:', error)
      void alert('更新失敗，請稍後再試', 'error')
    }
  }

  // 處理封面風格變更
  const handleCoverStyleChange = (style: CoverStyleType) => {
    onChange({
      ...data,
      coverStyle: style,
      flightStyle: getDefaultFlightStyle(style),
    })
  }

  return {
    // State
    cityImages,
    coverStyleOptions,
    currentStyleOption,
    currentStyleColor,
    showUpdateDialog,
    setShowUpdateDialog,
    uploadedImageUrl,
    setUploadedImageUrl,
    templatesLoading,

    // Functions
    handleUpdateCityImage,
    handleCoverStyleChange,
  }
}
