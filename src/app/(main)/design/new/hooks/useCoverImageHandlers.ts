/**
 * 封面圖片處理 Hook
 * 處理封面圖片上傳和位置編輯
 */

import { useCallback, useState } from 'react'
import * as fabric from 'fabric'
import { logger } from '@/lib/utils/logger'
import type { CanvasPage, ImagePositionSettings } from '@/features/designer/components/types'
import type { StyleSeries, TemplateData } from '@/features/designer/templates/engine'
import { generatePageFromTemplate } from '@/features/designer/templates/engine'
import type { ImageEditorSettings } from '@/components/ui/image-editor'

interface UseCoverImageHandlersProps {
  canvas: fabric.Canvas | null
  canvasWidth: number
  selectedStyle: StyleSeries | null
  templateData: Record<string, unknown> | null
  setTemplateData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
  generatedPages: CanvasPage[]
  setGeneratedPages: React.Dispatch<React.SetStateAction<CanvasPage[]>>
  currentPageIndex: number
  loadCanvasPage: (page: CanvasPage) => Promise<void>
}

export function useCoverImageHandlers({
  canvas,
  canvasWidth,
  selectedStyle,
  templateData,
  setTemplateData,
  generatedPages,
  setGeneratedPages,
  currentPageIndex,
  loadCanvasPage,
}: UseCoverImageHandlersProps) {
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)

  // 封面圖片上傳 - 步驟1：上傳後開啟位置編輯器
  const handleImageUploaded = useCallback((imageUrl: string) => {
    setPendingImageUrl(imageUrl)
    setShowCoverUpload(false)
    setShowImageEditor(true)
  }, [])

  // 封面圖片位置編輯完成 - 步驟2：套用圖片和位置
  const handleImagePositionSaved = useCallback(async (settings: ImageEditorSettings) => {
    if (!selectedStyle || !pendingImageUrl) return

    const position: ImagePositionSettings = {
      x: settings.x,
      y: settings.y,
      scale: settings.scale,
    }

    const newTemplateData = {
      ...templateData,
      coverImage: pendingImageUrl,
      coverImagePosition: position,
    }
    setTemplateData(newTemplateData)

    const currentPage = generatedPages[currentPageIndex]
    if (currentPage && canvas) {
      const templateKey = currentPage.templateKey
      if (templateKey === 'cover' || templateKey === 'toc') {
        const coverImageElement = canvas.getObjects().find(obj => {
          const namedObj = obj as fabric.FabricObject & { name?: string }
          return namedObj.name === '封面圖片' || namedObj.name === '封面背景'
        }) as fabric.Image | undefined

        if (coverImageElement && pendingImageUrl) {
          try {
            const targetWidth = coverImageElement.width ?? (canvasWidth - 64)
            const targetHeight = coverImageElement.height ?? 350

            const htmlImg = new window.Image()
            if (!pendingImageUrl.startsWith('data:') && !pendingImageUrl.startsWith('blob:')) {
              htmlImg.crossOrigin = 'anonymous'
            }

            await new Promise<void>((resolve, reject) => {
              htmlImg.onload = () => resolve()
              htmlImg.onerror = () => reject(new Error('Image load failed'))
              htmlImg.src = pendingImageUrl
            })

            const originalWidth = htmlImg.naturalWidth || 1
            const originalHeight = htmlImg.naturalHeight || 1

            let scale = Math.max(
              targetWidth / originalWidth,
              targetHeight / originalHeight
            )
            scale *= position.scale

            const scaledWidth = originalWidth * scale
            const scaledHeight = originalHeight * scale

            const maxOffsetX = targetWidth - scaledWidth
            const maxOffsetY = targetHeight - scaledHeight
            const offsetX = (position.x / 100) * maxOffsetX
            const offsetY = (position.y / 100) * maxOffsetY

            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = targetWidth
            tempCanvas.height = targetHeight
            const ctx = tempCanvas.getContext('2d')!
            ctx.drawImage(htmlImg, offsetX, offsetY, scaledWidth, scaledHeight)

            const croppedDataUrl = tempCanvas.toDataURL('image/png')
            const newImage = await fabric.Image.fromURL(croppedDataUrl)

            const originalName = (coverImageElement as fabric.Image & { name?: string }).name || '封面圖片'
            newImage.set({
              left: coverImageElement.left ?? 32,
              top: coverImageElement.top ?? 140,
              opacity: coverImageElement.opacity ?? 1,
              originX: 'left',
              originY: 'top',
            })
            ;(newImage as fabric.Image & { name: string; id: string }).name = originalName
            ;(newImage as fabric.Image & { name: string; id: string }).id = 'el-cover-image'

            const oldIndex = canvas.getObjects().indexOf(coverImageElement)

            canvas.remove(coverImageElement)
            canvas.add(newImage)

            if (oldIndex >= 0 && oldIndex < canvas.getObjects().length) {
              const objects = canvas.getObjects()
              canvas.remove(newImage)
              objects.splice(oldIndex, 0, newImage)
              canvas.renderAll()
            }

            canvas.renderAll()
          } catch (err) {
            logger.error('Failed to update cover image:', err)
          }
        } else if (pendingImageUrl) {
          const templateId = selectedStyle.templates[templateKey as keyof typeof selectedStyle.templates]
          if (templateId) {
            const newPage = generatePageFromTemplate(templateId, newTemplateData as Parameters<typeof generatePageFromTemplate>[1])
            newPage.id = currentPage.id
            newPage.name = currentPage.name
            const newPages = [...generatedPages]
            newPages[currentPageIndex] = newPage
            setGeneratedPages(newPages)
            await loadCanvasPage(newPage)
          }
        }
      }
    }

    setPendingImageUrl(null)
    setShowImageEditor(false)
  }, [selectedStyle, templateData, canvas, canvasWidth, loadCanvasPage, generatedPages, currentPageIndex, pendingImageUrl, setTemplateData, setGeneratedPages])

  // 開啟封面位置調整（使用現有圖片）
  const handleAdjustCoverPosition = useCallback(() => {
    const existingCoverImage = templateData?.coverImage as string | undefined
    if (existingCoverImage) {
      setPendingImageUrl(existingCoverImage)
      setShowImageEditor(true)
    }
  }, [templateData])

  // 清理狀態
  const handleCloseImageEditor = useCallback(() => {
    setShowImageEditor(false)
    setPendingImageUrl(null)
  }, [])

  return {
    showCoverUpload,
    setShowCoverUpload,
    showImageEditor,
    pendingImageUrl,
    handleImageUploaded,
    handleImagePositionSaved,
    handleAdjustCoverPosition,
    handleCloseImageEditor,
  }
}
