/**
 * 每日行程封面圖片處理 Hook
 * 處理每日行程封面圖片上傳和位置編輯
 */

import { useCallback, useState } from 'react'
import * as fabric from 'fabric'
import { logger } from '@/lib/utils/logger'
import type { CanvasPage, ImagePositionSettings } from '@/features/designer/components/types'
import type { StyleSeries } from '@/features/designer/templates/engine'
import type { ImageEditorSettings } from '@/components/ui/image-editor'

interface UseDailyImageHandlersProps {
  canvas: fabric.Canvas | null
  canvasWidth: number
  canvasHeight: number
  selectedStyle: StyleSeries | null
  templateData: Record<string, unknown> | null
  setTemplateData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
  generatedPages: CanvasPage[]
  setGeneratedPages: React.Dispatch<React.SetStateAction<CanvasPage[]>>
  currentPageIndex: number
  currentDayIndex: number | undefined
  addImage: (url: string, options?: { x?: number; y?: number }) => Promise<void>
}

export function useDailyImageHandlers({
  canvas,
  canvasWidth,
  canvasHeight,
  selectedStyle,
  templateData,
  setTemplateData,
  generatedPages,
  setGeneratedPages,
  currentPageIndex,
  currentDayIndex,
  addImage,
}: UseDailyImageHandlersProps) {
  const [showDailyCoverUpload, setShowDailyCoverUpload] = useState(false)
  const [showDailyImageEditor, setShowDailyImageEditor] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)

  // 每日行程封面圖片上傳 - 步驟1：上傳後開啟位置編輯器
  const handleDailyImageUploaded = useCallback((imageUrl: string) => {
    setPendingImageUrl(imageUrl)
    setShowDailyCoverUpload(false)
    setShowDailyImageEditor(true)
  }, [])

  // 每日行程封面圖片位置編輯完成 - 步驟2：套用圖片和位置
  const handleDailyImagePositionSaved = useCallback(async (settings: ImageEditorSettings) => {
    if (!selectedStyle || !pendingImageUrl || currentDayIndex === undefined) return

    const position: ImagePositionSettings = {
      x: settings.x,
      y: settings.y,
      scale: settings.scale,
    }

    const dailyDetails = (templateData?.dailyDetails as Array<{
      dayNumber: number
      date: string
      title: string
      coverImage?: string
      coverImagePosition?: ImagePositionSettings
      timeline: Array<{ time: string; activity: string; isHighlight?: boolean }>
      meals: { breakfast?: string; lunch?: string; dinner?: string }
    }>) || []

    const newDailyDetails = [...dailyDetails]
    while (newDailyDetails.length <= currentDayIndex) {
      newDailyDetails.push({
        dayNumber: newDailyDetails.length + 1,
        date: '',
        title: '',
        timeline: [],
        meals: {},
      })
    }
    newDailyDetails[currentDayIndex] = {
      ...newDailyDetails[currentDayIndex],
      coverImage: pendingImageUrl,
      coverImagePosition: position,
    }

    const newTemplateData = {
      ...templateData,
      dailyDetails: newDailyDetails,
      currentDayIndex: currentDayIndex,
    }
    setTemplateData(newTemplateData)

    const currentPage = generatedPages[currentPageIndex]
    if (currentPage && canvas) {
      const coverImageElement = canvas.getObjects().find(obj => {
        const namedObj = obj as fabric.FabricObject & { name?: string }
        return namedObj.name === '當日封面'
      }) as fabric.Image | undefined

      if (coverImageElement && pendingImageUrl) {
        try {
          const targetWidth = canvasWidth
          const targetHeight = Math.floor(canvasHeight * 0.42)

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

          newImage.set({
            left: coverImageElement.left ?? 0,
            top: coverImageElement.top ?? 0,
            opacity: coverImageElement.opacity ?? 0.85,
            originX: 'left',
            originY: 'top',
          })
          ;(newImage as fabric.Image & { name: string; id: string }).name = '當日封面'
          ;(newImage as fabric.Image & { name: string; id: string }).id = `el-daily-cover-d${currentDayIndex}`

          const oldIndex = canvas.getObjects().indexOf(coverImageElement)

          canvas.remove(coverImageElement)
          canvas.add(newImage)

          if (oldIndex === 0) {
            canvas.sendObjectToBack(newImage)
          }

          canvas.renderAll()
        } catch (err) {
          logger.error('Failed to update cover image:', err)
        }
      } else if (pendingImageUrl) {
        await addImage(pendingImageUrl, { x: 0, y: 0 })
      }

      const newPages = [...generatedPages]
      const pageWithDayIndex = currentPage as CanvasPage & { dayIndex?: number }
      newPages[currentPageIndex] = { ...currentPage } as CanvasPage
      Object.assign(newPages[currentPageIndex], { dayIndex: pageWithDayIndex.dayIndex ?? currentDayIndex })
      setGeneratedPages(newPages)
    }

    setPendingImageUrl(null)
    setShowDailyImageEditor(false)
  }, [selectedStyle, templateData, generatedPages, currentPageIndex, pendingImageUrl, currentDayIndex, canvas, canvasWidth, canvasHeight, addImage, setTemplateData, setGeneratedPages])

  // 開啟每日封面位置調整（使用現有圖片）
  const handleAdjustDailyCoverPosition = useCallback(() => {
    if (currentDayIndex === undefined) return
    const dailyDetails = (templateData?.dailyDetails as Array<{ coverImage?: string }>) || []
    const existingCoverImage = dailyDetails[currentDayIndex]?.coverImage
    if (existingCoverImage) {
      setPendingImageUrl(existingCoverImage)
      setShowDailyImageEditor(true)
    }
  }, [templateData, currentDayIndex])

  // 清理狀態
  const handleCloseDailyImageEditor = useCallback(() => {
    setShowDailyImageEditor(false)
    setPendingImageUrl(null)
  }, [])

  return {
    showDailyCoverUpload,
    setShowDailyCoverUpload,
    showDailyImageEditor,
    dailyPendingImageUrl: pendingImageUrl,
    handleDailyImageUploaded,
    handleDailyImagePositionSaved,
    handleAdjustDailyCoverPosition,
    handleCloseDailyImageEditor,
  }
}
