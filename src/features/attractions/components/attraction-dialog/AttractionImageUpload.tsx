'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, ChevronUp, ChevronDown, Minus, Wand2 } from 'lucide-react'
import { prompt, alert } from '@/lib/ui/alert-dialog'
import { ImagePosition } from '../../hooks/useAttractionForm'
import { useAuthStore } from '@/stores/auth-store'
import { isFeatureAvailable } from '@/lib/feature-restrictions'
import { logger } from '@/lib/utils/logger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 圖片編輯動作類型
type EditAction =
  | 'clean_scene'
  | 'landscape_pro'
  | 'travel_magazine'
  | 'food_delicious'
  | 'architecture_dramatic'
  | 'golden_hour'
  | 'blue_hour'
  | 'season_spring'
  | 'season_summer'
  | 'season_autumn'
  | 'season_winter'

// 分組顯示的動作列表
const EDIT_ACTION_GROUPS: { group: string; actions: { action: EditAction; label: string; description: string }[] }[] = [
  {
    group: '場景處理',
    actions: [
      { action: 'clean_scene', label: '淨空場景', description: '去人物+清理雜物' },
    ],
  },
  {
    group: '攝影風格',
    actions: [
      { action: 'landscape_pro', label: '風景大師', description: '國家地理風格' },
      { action: 'travel_magazine', label: '旅遊雜誌', description: '雜誌封面質感' },
      { action: 'food_delicious', label: '美食攝影', description: '米其林質感' },
      { action: 'architecture_dramatic', label: '建築攝影', description: '戲劇性建築' },
    ],
  },
  {
    group: '光線時刻',
    actions: [
      { action: 'golden_hour', label: '黃金時刻', description: '日落金色光線' },
      { action: 'blue_hour', label: '藍調時刻', description: '黃昏藍色調' },
    ],
  },
  {
    group: '四季變化',
    actions: [
      { action: 'season_spring', label: '春季櫻花', description: '春暖花開' },
      { action: 'season_summer', label: '盛夏風情', description: '綠意盎然' },
      { action: 'season_autumn', label: '秋楓紅葉', description: '楓紅層染' },
      { action: 'season_winter', label: '冬季雪景', description: '銀白世界' },
    ],
  },
]

interface ImagePositionAdjusterProps {
  url: string
  position: ImagePosition
  onPositionChange: (pos: ImagePosition) => void
  onRemove: () => void
  onReplace?: (newUrl: string) => void
  showAiEdit?: boolean
}

function ImagePositionAdjuster({
  url,
  position,
  onPositionChange,
  onRemove,
  onReplace,
  showAiEdit = false,
}: ImagePositionAdjusterProps) {
  const [isEditing, setIsEditing] = useState(false)

  const positionStyles: Record<ImagePosition, string> = {
    top: 'object-top',
    center: 'object-center',
    bottom: 'object-bottom',
  }

  // 執行 AI 圖片編輯
  const handleAiEdit = async (action: EditAction) => {
    if (!onReplace) return

    setIsEditing(true)
    try {
      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, action }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '編輯失敗')
      }

      // 將 base64 圖片上傳到 Supabase Storage
      const uploadResult = await uploadBase64ToStorage(result.data.image)
      if (uploadResult.success && uploadResult.url) {
        onReplace(uploadResult.url)
        void alert(`${result.data.actionLabel} 完成`, 'success')
      } else {
        throw new Error('上傳編輯後圖片失敗')
      }
    } catch (error) {
      logger.error('AI 圖片編輯失敗:', error)
      void alert(error instanceof Error ? error.message : '編輯失敗', 'error')
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="relative group">
      {/* 編輯中遮罩 */}
      {isEditing && (
        <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-1">
            <Loader2 size={20} className="animate-spin text-white" />
            <span className="text-white text-xs">AI 處理中...</span>
          </div>
        </div>
      )}

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

      {/* AI 美化按鈕 */}
      {showAiEdit && onReplace && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isEditing}
              className="absolute right-1 top-1 bg-morandi-gold text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-morandi-gold-hover disabled:opacity-50"
              title="AI 美化"
            >
              <Wand2 size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1.5 text-xs font-medium text-morandi-secondary">
              AI 美化
            </div>
            {EDIT_ACTION_GROUPS.map((group, groupIndex) => (
              <div key={group.group}>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-[10px] font-medium text-morandi-muted">
                  {group.group}
                </div>
                {group.actions.map((item) => (
                  <DropdownMenuItem
                    key={item.action}
                    onClick={() => handleAiEdit(item.action)}
                    className="text-xs"
                  >
                    {item.label}
                    <span className="ml-auto text-morandi-muted text-[10px]">{item.description}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 刪除按鈕 */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-status-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// 上傳 base64 圖片到 Supabase Storage
async function uploadBase64ToStorage(
  base64Data: string
): Promise<{ success: boolean; url?: string }> {
  try {
    // 使用動態 import 避免循環依賴
    const { supabase } = await import('@/lib/supabase/client')

    // 解析 base64 數據
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return { success: false }
    }

    const mimeType = matches[1]
    const base64 = matches[2]
    const ext = mimeType.split('/')[1] || 'png'

    // 轉換為 Blob
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    // 上傳到 Supabase
    const fileName = `ai-edited/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(fileName, blob)

    if (uploadError) {
      logger.error('上傳編輯圖片失敗:', uploadError)
      return { success: false }
    }

    const { data } = supabase.storage.from('workspace-files').getPublicUrl(fileName)
    return { success: true, url: data.publicUrl }
  } catch (error) {
    logger.error('uploadBase64ToStorage 錯誤:', error)
    return { success: false }
  }
}

interface AttractionImageUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  dropZoneRef: React.RefObject<HTMLDivElement | null>
  isUploading: boolean
  uploadedImages: string[]
  imagePositions: Record<string, ImagePosition>
  isDragOver: boolean
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  onPositionChange: (url: string, position: ImagePosition) => void
  onAddUrlImage: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onReplaceImage?: (index: number, newUrl: string) => void
}

export function AttractionImageUpload({
  fileInputRef,
  dropZoneRef,
  isUploading,
  uploadedImages,
  imagePositions,
  isDragOver,
  onImageUpload,
  onRemoveImage,
  onPositionChange,
  onAddUrlImage,
  onDragOver,
  onDragLeave,
  onDrop,
  onReplaceImage,
}: AttractionImageUploadProps) {
  const { user } = useAuthStore()
  const showAiEdit = isFeatureAvailable('ai_suggest', user?.workspace_code)

  return (
    <div>
      <label className="text-sm font-medium">景點圖片</label>

      {/* 上傳按鈕區 */}
      <div className="flex gap-2 mt-2 mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
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
          onClick={onAddUrlImage}
        >
          貼上網址
        </Button>
      </div>

      {/* 已上傳圖片預覽 + 拖放區 */}
      <div
        ref={dropZoneRef}
        className={`min-h-[120px] rounded-md transition-all ${
          isDragOver ? 'bg-morandi-gold/10 border-2 border-dashed border-morandi-gold' : ''
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {isDragOver && (
          <div className="flex items-center justify-center h-[120px]">
            <div className="text-morandi-gold font-medium">放開以上傳圖片</div>
          </div>
        )}
        {!isDragOver && uploadedImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {uploadedImages.map((url, index) => (
              <ImagePositionAdjuster
                key={`${url}-${index}`}
                url={url}
                position={imagePositions[url] || 'center'}
                onPositionChange={(pos) => onPositionChange(url, pos)}
                onRemove={() => onRemoveImage(index)}
                onReplace={onReplaceImage ? (newUrl) => onReplaceImage(index, newUrl) : undefined}
                showAiEdit={showAiEdit}
              />
            ))}
          </div>
        ) : !isDragOver ? (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center text-morandi-muted cursor-pointer hover:border-morandi-gold/50 transition-colors">
            <Upload size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">拖曳圖片到此處，或點擊上方按鈕上傳</p>
          </div>
        ) : null}
      </div>
      <p className="text-xs text-morandi-muted mt-2">
        滑鼠移到圖片上可調整顯示位置（頂部/中間/底部）。建議尺寸 1920x1080，支援 JPG、PNG 格式
      </p>
    </div>
  )
}
