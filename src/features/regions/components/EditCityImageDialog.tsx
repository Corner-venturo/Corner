'use client'

import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, Upload, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/dialog'
import type { City } from '@/stores'

interface EditCityImageDialogProps {
  open: boolean
  onClose: () => void
  city: City | null
  onUpdate: (id: string, data: any) => Promise<any>
}

export function EditCityImageDialog({ open, onClose, city, onUpdate }: EditCityImageDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl1, setPreviewUrl1] = useState<string | null>(null)
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null)
  const [selectedFile1, setSelectedFile1] = useState<File | null>(null)
  const [selectedFile2, setSelectedFile2] = useState<File | null>(null)
  const [primaryImage, setPrimaryImage] = useState<1 | 2>(1)
  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)

  // 當 city 改變時更新預覽
  useEffect(() => {
    if (city) {
      setPreviewUrl1(city.background_image_url || null)
      setPreviewUrl2(city.background_image_url_2 || null)
      setPrimaryImage(city.primary_image || 1)
    } else {
      setPreviewUrl1(null)
      setPreviewUrl2(null)
      setPrimaryImage(1)
    }
    setSelectedFile1(null)
    setSelectedFile2(null)
  }, [city])

  const handleFileChange = (imageSlot: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 驗證檔案類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案')
        return
      }

      // 驗證檔案大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片大小不可超過 5MB')
        return
      }

      if (imageSlot === 1) {
        setSelectedFile1(file)
      } else {
        setSelectedFile2(file)
      }

      // 建立預覽
      const reader = new FileReader()
      reader.onloadend = () => {
        if (imageSlot === 1) {
          setPreviewUrl1(reader.result as string)
        } else {
          setPreviewUrl2(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!city || (!selectedFile1 && !selectedFile2 && city.primary_image === primaryImage)) return

    setUploading(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const updateData: any = {}

      // 上傳圖片 1
      if (selectedFile1) {
        const filename = `${city.id}-1.jpg`
        const { error } = await supabase.storage
          .from('city-backgrounds')
          .upload(filename, selectedFile1, {
            contentType: selectedFile1.type,
            upsert: true,
          })

        if (error) throw error

        const { data: urlData } = supabase.storage.from('city-backgrounds').getPublicUrl(filename)

        updateData.background_image_url = urlData.publicUrl
      }

      // 上傳圖片 2
      if (selectedFile2) {
        const filename = `${city.id}-2.jpg`
        const { error } = await supabase.storage
          .from('city-backgrounds')
          .upload(filename, selectedFile2, {
            contentType: selectedFile2.type,
            upsert: true,
          })

        if (error) throw error

        const { data: urlData } = supabase.storage.from('city-backgrounds').getPublicUrl(filename)

        updateData.background_image_url_2 = urlData.publicUrl
      }

      // 更新主要圖片設定
      updateData.primary_image = primaryImage

      // 更新資料庫
      await onUpdate(city.id, updateData)

      alert('圖片上傳成功！')
      onClose()
    } catch (error) {
      alert('圖片上傳失敗，請稍後再試')
    } finally {
      setUploading(false)
    }
  }

  if (!city) return null

  const hasChanges = selectedFile1 || selectedFile2 || city.primary_image !== primaryImage

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title={`編輯城市圖片 - ${city.name}`}
      onSubmit={handleUpload}
      onCancel={onClose}
      submitLabel={uploading ? '上傳中...' : '儲存變更'}
      loading={uploading}
      submitDisabled={!hasChanges}
      maxWidth="4xl"
      contentClassName="max-h-[75vh] overflow-y-auto"
    >
      {/* 主要圖片選擇 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={20} className="text-amber-500" />
          <h3 className="font-semibold text-morandi-primary">主要顯示圖片</h3>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="primary-image"
              checked={primaryImage === 1}
              onChange={() => setPrimaryImage(1)}
              className="w-4 h-4 text-amber-600"
            />
            <span className="text-sm text-morandi-primary">圖片 1</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="primary-image"
              checked={primaryImage === 2}
              onChange={() => setPrimaryImage(2)}
              className="w-4 h-4 text-amber-600"
            />
            <span className="text-sm text-morandi-primary">圖片 2</span>
          </label>
        </div>
        <p className="text-xs text-morandi-secondary mt-2">主要圖片會在行程封面和城市列表中顯示</p>
      </div>

      {/* 兩個圖片區域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 圖片 1 */}
        <div
          className={`space-y-3 p-4 rounded-lg border-2 transition-all ${
            primaryImage === 1
              ? 'border-amber-400 bg-amber-50/50 shadow-md'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-morandi-primary flex items-center gap-2">
              圖片 1
              {primaryImage === 1 && <Star size={16} className="text-amber-500 fill-amber-500" />}
            </h3>
          </div>

          {/* 預覽區域 1 */}
          <div className="aspect-video w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            {previewUrl1 ? (
              <img
                src={previewUrl1}
                alt={`${city.name} 圖片 1`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <p className="text-sm">尚無背景圖</p>
              </div>
            )}
          </div>

          {/* 上傳按鈕 1 */}
          <div className="flex gap-2">
            <input
              ref={fileInput1Ref}
              type="file"
              accept="image/*"
              onChange={handleFileChange(1)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput1Ref.current?.click()}
              className="flex-1"
              disabled={uploading}
            >
              <Upload size={16} className="mr-2" />
              選擇圖片
            </Button>
          </div>

          {selectedFile1 && (
            <p className="text-xs text-morandi-secondary">
              已選擇: {selectedFile1.name} ({(selectedFile1.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* 圖片 2 */}
        <div
          className={`space-y-3 p-4 rounded-lg border-2 transition-all ${
            primaryImage === 2
              ? 'border-amber-400 bg-amber-50/50 shadow-md'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-morandi-primary flex items-center gap-2">
              圖片 2
              {primaryImage === 2 && <Star size={16} className="text-amber-500 fill-amber-500" />}
            </h3>
          </div>

          {/* 預覽區域 2 */}
          <div className="aspect-video w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            {previewUrl2 ? (
              <img
                src={previewUrl2}
                alt={`${city.name} 圖片 2`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <p className="text-sm">尚無背景圖</p>
              </div>
            )}
          </div>

          {/* 上傳按鈕 2 */}
          <div className="flex gap-2">
            <input
              ref={fileInput2Ref}
              type="file"
              accept="image/*"
              onChange={handleFileChange(2)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput2Ref.current?.click()}
              className="flex-1"
              disabled={uploading}
            >
              <Upload size={16} className="mr-2" />
              選擇圖片
            </Button>
          </div>

          {selectedFile2 && (
            <p className="text-xs text-morandi-secondary">
              已選擇: {selectedFile2.name} ({(selectedFile2.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>
    </FormDialog>
  )
}
