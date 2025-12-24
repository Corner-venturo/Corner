'use client'

import { FormDialog } from '@/components/dialog'
import { Attraction, AttractionFormData } from '../types'
import type { Country, Region, City } from '@/stores/region-store'
import { supabase } from '@/lib/supabase/client'
import { prompt, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { useAttractionForm } from '../hooks/useAttractionForm'
import { AttractionForm } from './attraction-dialog/AttractionForm'
import { AttractionImageUpload } from './attraction-dialog/AttractionImageUpload'

interface AttractionsDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (formData: AttractionFormData) => Promise<{ success: boolean }>
  attraction?: Attraction | null
  countries: Country[]
  regions: Region[]
  cities: City[]
  getRegionsByCountry: (countryId: string) => Region[]
  getCitiesByCountry: (countryId: string) => City[]
  getCitiesByRegion: (regionId: string) => City[]
  initialFormData: AttractionFormData
}

export function AttractionsDialog({
  open,
  onClose,
  onSubmit,
  attraction,
  countries,
  regions,
  cities,
  getRegionsByCountry,
  getCitiesByCountry,
  getCitiesByRegion,
  initialFormData,
}: AttractionsDialogProps) {
  const {
    formData,
    setFormData,
    isUploading,
    uploadedImages,
    setUploadedImages,
    imagePositions,
    setImagePositions,
    isDragOver,
    setIsDragOver,
    fileInputRef,
    dropZoneRef,
    mergePositionsToNotes,
    uploadFiles,
    fetchAndUploadImage,
  } = useAttractionForm({ attraction, initialFormData, open })

  // 上傳圖片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    await uploadFiles(imageFiles)

    // 清空 input，讓同一檔案可以再次上傳
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 移除圖片
  const handleRemoveImage = (indexToRemove: number) => {
    const removedUrl = uploadedImages[indexToRemove]
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove)
    setUploadedImages(newImages)
    setFormData(prev => ({ ...prev, images: newImages.join(', ') }))

    // 同時移除該圖片的位置設定
    if (removedUrl) {
      setImagePositions(prev => {
        const newPositions = { ...prev }
        delete newPositions[removedUrl]
        return newPositions
      })
    }
  }

  // 更新圖片位置
  const handlePositionChange = (url: string, position: 'top' | 'center' | 'bottom') => {
    setImagePositions(prev => ({
      ...prev,
      [url]: position
    }))
  }

  // 新增網址圖片
  const handleAddUrlImage = async () => {
    const url = await prompt('請輸入圖片網址', {
      title: '新增圖片',
      placeholder: 'https://...',
    })
    if (url && url.trim()) {
      const allImages = [...uploadedImages, url.trim()]
      setUploadedImages(allImages)
      setFormData(prev => ({ ...prev, images: allImages.join(', ') }))
    }
  }

  // 處理拖曳上傳
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // 檢查 files
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
      if (imageFiles.length > 0) {
        await uploadFiles(imageFiles)
        return
      }
    }

    // 檢查 items
    const items = e.dataTransfer.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            await uploadFiles([file])
            return
          }
        }
      }
    }

    // 從 HTML 解析圖片 URL
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match && match[1]) {
        await fetchAndUploadImage(match[1])
        return
      }
    }

    // 純 URL
    const imageUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      await fetchAndUploadImage(imageUrl)
      return
    }

    void alert('請拖曳圖片檔案', 'warning')
  }

  const handleSubmit = async () => {
    // 將圖片位置資訊合併到 notes 中儲存
    const updatedNotes = mergePositionsToNotes(formData.notes, imagePositions)
    const result = await onSubmit({ ...formData, notes: updatedNotes })
    if (result.success) {
      onClose()
    }
  }

  const availableRegions = formData.country_id ? getRegionsByCountry(formData.country_id) : []
  const availableCities = formData.region_id
    ? getCitiesByRegion(formData.region_id)
    : formData.country_id
      ? getCitiesByCountry(formData.country_id)
      : []

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title={attraction ? '編輯景點' : '新增景點'}
      onSubmit={handleSubmit}
      submitLabel={attraction ? '更新' : '新增'}
      submitDisabled={!formData.name || !formData.country_id}
      maxWidth="2xl"
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <AttractionForm
        formData={formData}
        countries={countries}
        availableRegions={availableRegions}
        availableCities={availableCities}
        onFormDataChange={setFormData}
      />

      <AttractionImageUpload
        fileInputRef={fileInputRef}
        dropZoneRef={dropZoneRef}
        isUploading={isUploading}
        uploadedImages={uploadedImages}
        imagePositions={imagePositions}
        isDragOver={isDragOver}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
        onPositionChange={handlePositionChange}
        onAddUrlImage={handleAddUrlImage}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </FormDialog>
  )
}
