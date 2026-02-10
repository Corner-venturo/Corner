/**
 * Designer 對話框群組
 * 包含封面圖片、每日封面圖片、遮罩填充、區塊元件庫等對話框
 */

'use client'

import * as fabric from 'fabric'
import { ImagePickerDialog } from '@/components/ui/image-uploader'
import { ImageEditor, type ImageEditorSettings } from '@/components/ui/image-editor'
import { ImageMaskFillDialog } from '@/features/designer/components/ImageMaskFill'
import { BlockLibrary } from '@/features/designer/components/BlockLibrary'
import type { CanvasElement, TextElement, ShapeElement, ImageElement } from '@/features/designer/components/types'

interface DesignerDialogsProps {
  // 封面圖片
  showCoverUpload: boolean
  setShowCoverUpload: (show: boolean) => void
  coverImage: string | undefined
  onCoverImageSelect: (url: string) => void
  // 封面圖片編輯器
  showImageEditor: boolean
  pendingImageUrl: string | null
  coverImagePosition: ImageEditorSettings | undefined
  onCloseImageEditor: () => void
  onSaveImagePosition: (settings: ImageEditorSettings) => void
  // 每日封面圖片
  showDailyCoverUpload: boolean
  setShowDailyCoverUpload: (show: boolean) => void
  dailyCoverImage: string | undefined
  onDailyCoverImageSelect: (url: string) => void
  // 每日封面圖片編輯器
  showDailyImageEditor: boolean
  dailyPendingImageUrl: string | null
  dailyCoverImagePosition: ImageEditorSettings | undefined
  onCloseDailyImageEditor: () => void
  onSaveDailyImagePosition: (settings: ImageEditorSettings) => void
  // 遮罩填充
  showImageMaskFill: boolean
  setShowImageMaskFill: (show: boolean) => void
  canvas: fabric.Canvas | null
  maskTargetShape: fabric.FabricObject | null
  setMaskTargetShape: (shape: fabric.FabricObject | null) => void
  // 區塊元件庫
  showBlockLibrary: boolean
  setShowBlockLibrary: (show: boolean) => void
  onInsertBlock: (elements: CanvasElement[]) => void
}

export function DesignerDialogs({
  // 封面圖片
  showCoverUpload,
  setShowCoverUpload,
  coverImage,
  onCoverImageSelect,
  // 封面圖片編輯器
  showImageEditor,
  pendingImageUrl,
  coverImagePosition,
  onCloseImageEditor,
  onSaveImagePosition,
  // 每日封面圖片
  showDailyCoverUpload,
  setShowDailyCoverUpload,
  dailyCoverImage,
  onDailyCoverImageSelect,
  // 每日封面圖片編輯器
  showDailyImageEditor,
  dailyPendingImageUrl,
  dailyCoverImagePosition,
  onCloseDailyImageEditor,
  onSaveDailyImagePosition,
  // 遮罩填充
  showImageMaskFill,
  setShowImageMaskFill,
  canvas,
  maskTargetShape,
  setMaskTargetShape,
  // 區塊元件庫
  showBlockLibrary,
  setShowBlockLibrary,
  onInsertBlock,
}: DesignerDialogsProps) {
  return (
    <>
      {/* 封面圖片選擇對話框 */}
      <ImagePickerDialog
        open={showCoverUpload}
        onOpenChange={setShowCoverUpload}
        title="選擇封面圖片"
        description="上傳圖片或從 Unsplash 搜尋免費圖片，之後可調整顯示位置。"
        value={coverImage}
        onSelect={onCoverImageSelect}
        bucket="city-backgrounds"
        filePrefix="brochure-cover"
        aspectRatio={495 / 350}
      />

      {/* 封面圖片編輯器 */}
      {pendingImageUrl && (
        <ImageEditor
          open={showImageEditor}
          onClose={onCloseImageEditor}
          imageSrc={pendingImageUrl}
          aspectRatio={495 / 350}
          initialSettings={coverImagePosition}
          onSave={onSaveImagePosition}
          showAi={false}
        />
      )}

      {/* 每日行程封面圖片選擇對話框 */}
      <ImagePickerDialog
        open={showDailyCoverUpload}
        onOpenChange={setShowDailyCoverUpload}
        title="選擇當日封面圖片"
        description="上傳圖片或從 Unsplash 搜尋免費圖片，作為當日行程的封面。"
        value={dailyCoverImage}
        onSelect={onDailyCoverImageSelect}
        bucket="city-backgrounds"
        filePrefix="brochure-daily-cover"
        aspectRatio={16 / 9}
      />

      {/* 每日行程封面圖片編輯器 */}
      {dailyPendingImageUrl && (
        <ImageEditor
          open={showDailyImageEditor}
          onClose={onCloseDailyImageEditor}
          imageSrc={dailyPendingImageUrl}
          aspectRatio={16 / 9}
          initialSettings={dailyCoverImagePosition}
          onSave={onSaveDailyImagePosition}
          showAi={false}
        />
      )}

      {/* 圖片遮罩填充對話框 */}
      <ImageMaskFillDialog
        open={showImageMaskFill}
        onOpenChange={setShowImageMaskFill}
        canvas={canvas}
        targetShape={maskTargetShape}
        onComplete={() => {
          setMaskTargetShape(null)
        }}
      />

      {/* 區塊元件庫 */}
      <BlockLibrary
        isOpen={showBlockLibrary}
        onClose={() => setShowBlockLibrary(false)}
        onInsertBlock={onInsertBlock}
      />
    </>
  )
}

// 區塊插入處理函數
export function createBlockInsertHandler(canvas: fabric.Canvas | null) {
  return (elements: CanvasElement[]) => {
    if (!canvas) return

    elements.forEach(el => {
      if (el.type === 'text') {
        const textEl = el as TextElement
        const text = new fabric.Textbox(textEl.content || '', {
          left: textEl.x,
          top: textEl.y,
          width: textEl.width,
          fontSize: textEl.style?.fontSize || 12,
          fontFamily: textEl.style?.fontFamily || 'Noto Sans TC',
          fontWeight: textEl.style?.fontWeight || 'normal',
          fill: textEl.style?.color || '#000',
          textAlign: textEl.style?.textAlign || 'left',
        })
        canvas.add(text)
      } else if (el.type === 'shape') {
        const shapeEl = el as ShapeElement
        const rect = new fabric.Rect({
          left: shapeEl.x,
          top: shapeEl.y,
          width: shapeEl.width,
          height: shapeEl.height,
          fill: shapeEl.fill || '#ccc',
          stroke: shapeEl.stroke,
          strokeWidth: shapeEl.strokeWidth || 0,
        })
        canvas.add(rect)
      } else if (el.type === 'image') {
        const imgEl = el as ImageElement
        const placeholder = new fabric.Rect({
          left: imgEl.x,
          top: imgEl.y,
          width: imgEl.width,
          height: imgEl.height,
          fill: '#e8e4df',
          stroke: '#c9aa7c',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        })
        ;(placeholder as fabric.Rect & { isImagePlaceholder: boolean }).isImagePlaceholder = true
        canvas.add(placeholder)
      }
    })
    canvas.renderAll()
  }
}
