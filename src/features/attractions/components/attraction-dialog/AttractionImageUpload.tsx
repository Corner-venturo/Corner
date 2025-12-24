'use client'

import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { prompt } from '@/lib/ui/alert-dialog'
import { ImagePosition } from '../../hooks/useAttractionForm'

interface ImagePositionAdjusterProps {
  url: string
  position: ImagePosition
  onPositionChange: (pos: ImagePosition) => void
  onRemove: () => void
}

function ImagePositionAdjuster({ url, position, onPositionChange, onRemove }: ImagePositionAdjusterProps) {
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

interface AttractionImageUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  dropZoneRef: React.RefObject<HTMLDivElement>
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
}: AttractionImageUploadProps) {
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
