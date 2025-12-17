import { useState, useEffect, useRef } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Attraction, AttractionFormData } from '../types'
import type { Country, Region, City } from '@/stores/region-store'
import { supabase } from '@/lib/supabase/client'
import { Upload, X, Loader2, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { prompt, alert } from '@/lib/ui/alert-dialog'

// 圖片位置類型
type ImagePosition = 'top' | 'center' | 'bottom'

// 圖片位置調整組件
function ImagePositionAdjuster({
  url,
  position,
  onPositionChange,
  onRemove,
}: {
  url: string
  position: ImagePosition
  onPositionChange: (pos: ImagePosition) => void
  onRemove: () => void
}) {
  const positionStyles: Record<ImagePosition, string> = {
    top: 'object-top',
    center: 'object-center',
    bottom: 'object-bottom',
  }

  return (
    <div className="relative group">
      <img
        src={url}
        alt="景點圖片"
        className={`w-full h-24 object-cover rounded-md border border-border ${positionStyles[position]}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'
        }}
      />
      {/* 位置調整按鈕 */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onPositionChange('top')}
          className={`p-1 rounded ${position === 'top' ? 'bg-morandi-gold text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
          title="顯示頂部"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={() => onPositionChange('center')}
          className={`p-1 rounded ${position === 'center' ? 'bg-morandi-gold text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
          title="顯示中間"
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={() => onPositionChange('bottom')}
          className={`p-1 rounded ${position === 'bottom' ? 'bg-morandi-gold text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
          title="顯示底部"
        >
          <ChevronDown size={12} />
        </button>
      </div>
      {/* 刪除按鈕 */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ============================================
// 景點對話框組件（新增/編輯共用）
// ============================================

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
  const [formData, setFormData] = useState<AttractionFormData>(initialFormData)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [imagePositions, setImagePositions] = useState<Record<string, ImagePosition>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 解析 notes 中儲存的圖片位置資訊
  const parseImagePositions = (notes: string | undefined): Record<string, ImagePosition> => {
    if (!notes) return {}
    const match = notes.match(/\[IMAGE_POSITIONS:(.*?)\]/)
    if (!match) return {}
    try {
      return JSON.parse(match[1])
    } catch {
      return {}
    }
  }

  // 將圖片位置資訊合併到 notes
  const mergePositionsToNotes = (notes: string, positions: Record<string, ImagePosition>): string => {
    // 移除舊的位置資訊
    const cleanNotes = notes.replace(/\[IMAGE_POSITIONS:.*?\]/g, '').trim()
    if (Object.keys(positions).length === 0) return cleanNotes
    const positionStr = `[IMAGE_POSITIONS:${JSON.stringify(positions)}]`
    return cleanNotes ? `${cleanNotes}\n${positionStr}` : positionStr
  }

  // 編輯模式：載入景點資料
  useEffect(() => {
    if (attraction) {
      setFormData({
        name: attraction.name || '',
        name_en: attraction.name_en || '',
        description: attraction.description || '',
        country_id: attraction.country_id || '',
        region_id: attraction.region_id || '',
        city_id: attraction.city_id || '',
        category: attraction.category || '景點',
        tags: attraction.tags?.join(', ') || '',
        duration_minutes: attraction.duration_minutes || 60,
        address: attraction.address || '',
        phone: attraction.phone || '',
        website: attraction.website || '',
        images: attraction.images?.join(', ') || '',
        notes: attraction.notes || '',
        is_active: attraction.is_active,
      })
      // 載入已有的圖片
      setUploadedImages(attraction.images || [])
      // 載入圖片位置設定
      setImagePositions(parseImagePositions(attraction.notes))
    } else {
      setFormData(initialFormData)
      setUploadedImages([])
      setImagePositions({})
    }
  }, [attraction, initialFormData])

  // 上傳圖片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[景點圖片上傳] 開始處理')
    const files = e.target.files
    if (!files || files.length === 0) {
      console.log('[景點圖片上傳] 沒有選擇檔案')
      return
    }

    console.log('[景點圖片上傳] 選擇了', files.length, '個檔案')
    setIsUploading(true)
    try {
      const newUrls: string[] = []

      for (const file of Array.from(files)) {
        console.log('[景點圖片上傳] 處理檔案:', file.name, file.type, file.size)

        // 檢查檔案類型
        if (!file.type.startsWith('image/')) {
          console.log('[景點圖片上傳] 非圖片檔案:', file.name)
          void alert(`${file.name} 不是圖片檔案`, 'warning')
          continue
        }

        // 生成唯一檔名
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `attractions/${fileName}`
        console.log('[景點圖片上傳] 準備上傳到:', filePath)

        // 上傳到 Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('workspace-files')
          .upload(filePath, file)

        if (uploadError) {
          console.error('[景點圖片上傳] 上傳失敗:', uploadError)
          void alert(`${file.name} 上傳失敗: ${uploadError.message}`, 'error')
          continue
        }

        console.log('[景點圖片上傳] 上傳成功:', uploadData)

        // 取得公開 URL
        const { data } = supabase.storage
          .from('workspace-files')
          .getPublicUrl(filePath)

        console.log('[景點圖片上傳] 公開 URL:', data.publicUrl)
        newUrls.push(data.publicUrl)
      }

      // 更新圖片列表
      if (newUrls.length > 0) {
        const allImages = [...uploadedImages, ...newUrls]
        console.log('[景點圖片上傳] 更新圖片列表:', allImages.length, '張')
        setUploadedImages(allImages)
        setFormData(prev => ({ ...prev, images: allImages.join(', ') }))
      }
    } catch (error) {
      console.error('[景點圖片上傳] 意外錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setIsUploading(false)
      // 清空 input，讓同一檔案可以再次上傳
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      console.log('[景點圖片上傳] 處理完成')
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
  const handlePositionChange = (url: string, position: ImagePosition) => {
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

  const handleSubmit = async () => {
    // 將圖片位置資訊合併到 notes 中儲存
    const updatedNotes = mergePositionsToNotes(formData.notes, imagePositions)
    const result = await onSubmit({ ...formData, notes: updatedNotes })
    if (result.success) {
      onClose()
      if (!attraction) {
        // 只在新增模式重置表單
        setFormData(initialFormData)
        setImagePositions({})
      }
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
      submitDisabled={!formData.name || !formData.country_id || !formData.region_id}
      maxWidth="2xl"
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* 中文名稱 */}
        <div>
          <label className="text-sm font-medium">中文名稱 *</label>
          <Input
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如: 太宰府天滿宮"
            required
          />
        </div>

        {/* 英文名稱 */}
        <div>
          <label className="text-sm font-medium">英文名稱</label>
          <Input
            value={formData.name_en}
            onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
            placeholder="例如: Dazaifu Tenmangu"
          />
        </div>
      </div>

      {/* 描述 */}
      <div>
        <label className="text-sm font-medium">描述</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="景點簡介..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]"
        />
      </div>

      {/* 地點選擇 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">國家 *</label>
          <select
            value={formData.country_id}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                country_id: e.target.value,
                region_id: '',
                city_id: '',
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            required
          >
            <option value="">請選擇</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>

        {availableRegions.length > 0 && (
          <div>
            <label className="text-sm font-medium">地區 *</label>
            <select
              value={formData.region_id}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  region_id: e.target.value,
                  city_id: '',
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              required
            >
              <option value="">請選擇</option>
              {availableRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">城市（選填）</label>
          <select
            value={formData.city_id}
            onChange={e => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="">不指定</option>
            {availableCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 類別與標籤 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">類別</label>
          <select
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="景點">景點</option>
            <option value="餐廳">餐廳</option>
            <option value="住宿">住宿</option>
            <option value="購物">購物</option>
            <option value="交通">交通</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">標籤（逗號分隔）</label>
          <Input
            value={formData.tags}
            onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="例如: 文化,神社,歷史"
          />
        </div>
      </div>

      {/* 建議停留時間 */}
      <div>
        <label className="text-sm font-medium">建議停留時間（分鐘）</label>
        <Input
          type="number"
          value={formData.duration_minutes}
          onChange={e =>
            setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))
          }
          min={0}
        />
      </div>

      {/* 聯絡資訊 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">電話</label>
          <Input
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+81-92-123-4567"
          />
        </div>

        <div>
          <label className="text-sm font-medium">官網</label>
          <Input
            value={formData.website}
            onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* 地址 */}
      <div>
        <label className="text-sm font-medium">地址</label>
        <Input
          value={formData.address}
          onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="完整地址..."
        />
      </div>

      {/* 圖片上傳 */}
      <div>
        <label className="text-sm font-medium">景點圖片</label>

        {/* 上傳按鈕區 */}
        <div className="flex gap-2 mt-2 mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('[景點] 上傳按鈕被點擊')
              console.log('[景點] fileInputRef.current:', fileInputRef.current)
              fileInputRef.current?.click()
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                上傳中...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                上傳圖片
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddUrlImage}
          >
            貼上網址
          </Button>
        </div>

        {/* 已上傳圖片預覽 */}
        {uploadedImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {uploadedImages.map((url, index) => (
              <ImagePositionAdjuster
                key={`${url}-${index}`}
                url={url}
                position={imagePositions[url] || 'center'}
                onPositionChange={(pos) => handlePositionChange(url, pos)}
                onRemove={() => handleRemoveImage(index)}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center text-morandi-muted">
            <Upload size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">尚無圖片，點擊上方按鈕上傳或貼上網址</p>
          </div>
        )}
        <p className="text-xs text-morandi-muted mt-2">
          滑鼠移到圖片上可調整顯示位置（頂部/中間/底部）。建議尺寸 1920x1080，支援 JPG、PNG 格式
        </p>
      </div>

      {/* 備註 */}
      <div>
        <label className="text-sm font-medium">內部備註</label>
        <textarea
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="內部使用備註..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[60px]"
        />
      </div>

      {/* 啟用狀態 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4"
        />
        <label className="text-sm">啟用此景點</label>
      </div>
    </FormDialog>
  )
}
