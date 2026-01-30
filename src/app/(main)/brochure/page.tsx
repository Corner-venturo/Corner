'use client'

/**
 * Designer - 通用設計工具
 *
 * 完整功能：
 * - 設計類型選擇（手冊、IG圖文、布條等）
 * - 左側元素庫面板
 * - 頂部工具列（圖層、對齊、複製貼上等）
 * - 右側屬性面板
 * - 中央畫布編輯區
 *
 * 支援的 URL 參數：
 * - tour_id: 開團後的手冊
 * - package_id: 提案階段的手冊
 * - itinerary_id: 行程表的手冊
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useRouter } from 'next/navigation'
import * as fabric from 'fabric'
import {
  Save,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  PanelLeftClose,
  PanelRightClose,
  Upload,
  LayoutList,
  Layers,
  Columns2,
  FileDown,
  Printer,
  X,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentStore, type BrochureEntityType } from '@/stores/document-store'
import { supabase } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageUploader, ImagePickerDialog } from '@/components/ui/image-uploader'
import { ImageEditor, type ImageEditorSettings } from '@/components/ui/image-editor'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_WIDTH_EXPANDED_PX,
  SIDEBAR_WIDTH_COLLAPSED_PX,
} from '@/lib/constants/layout'

// Designer 元件
import { useBrochureEditorV2 } from '@/features/designer/hooks/useBrochureEditorV2'
import { useMaskEditMode } from '@/features/designer/hooks/useMaskEditMode'
import { LoadingOverlay, SavingIndicator, UnsavedIndicator } from '@/features/designer/components/LoadingOverlay'
import { ElementLibrary } from '@/features/designer/components/ElementLibrary'
import { EditorToolbar } from '@/features/designer/components/EditorToolbar'
import { PropertiesPanel } from '@/features/designer/components/PropertiesPanel'
import { ImageMaskFillDialog } from '@/features/designer/components/ImageMaskFill'
import { LayerPanel } from '@/features/designer/components/LayerPanel'
import { TemplateDataPanel } from '@/features/designer/components/TemplateDataPanel'
import { TemplateSelector } from '@/features/designer/components/TemplateSelector'
import { PageListSidebar } from '@/features/designer/components/PageListSidebar'
import { CanvasWithRulers } from '@/features/designer/components/CanvasWithRulers'
import { DesignTypeSelector, DESIGN_TYPES, type DesignType } from '@/features/designer/components/DesignTypeSelector'
import { DualPagePreview } from '@/features/designer/components/DualPagePreview'
import { STICKER_PATHS } from '@/features/designer/components/core/sticker-paths'
import { renderPageOnCanvas } from '@/features/designer/components/core/renderer'

// Designer 工具和類型
import { needsScaling, calculateScaleFactor, scaleFabricData, NEW_A5_WIDTH, NEW_A5_HEIGHT } from '@/features/designer/utils/scaling'
import { calculatePageNumber, formatPageNumber } from '@/features/designer/utils/page-number'
import { generatePageFromTemplate, styleSeries, getTemplateById, itineraryToTemplateData } from '@/features/designer/templates/engine'
import { getMemoSettingsByCountry, getCountryCodeFromName } from '@/features/designer/templates/definitions/country-presets'
import { generateBrochurePDF } from '@/lib/pdf/brochure-pdf-generator'

// 類型
import type { CanvasPage, CanvasElement, ImagePositionSettings } from '@/features/designer/components/types'
import type { StyleSeries, TemplateData } from '@/features/designer/templates/engine'
import type { MemoPageContent } from '@/features/designer/components/PageListSidebar'
import type { MemoItem, SeasonInfo, MemoInfoItem, MemoSettings } from '@/features/designer/templates/definitions/types'

// 已移至 @/features/designer 模組

// DESIGN_TYPES 已移至 @/features/designer/components/DesignTypeSelector

// DesignTypeSelector, DualPagePreview, PageThumbnail 已移至 @/features/designer/components/

// ============================================
// 主頁面
// ============================================
export default function DesignerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // 支援多種參數格式（URL 參數）
  const urlTourId = searchParams.get('tour_id') || searchParams.get('tourId')
  const urlPackageId = searchParams.get('package_id') || searchParams.get('packageId')
  const urlItineraryId = searchParams.get('itinerary_id') || searchParams.get('itineraryId')

  const { user, sidebarCollapsed, _hasHydrated } = useAuthStore()
  const workspaceId = user?.workspace_id

  // 手動選擇的團/行程（當沒有 URL 參數時使用）
  const [manualTourId, setManualTourId] = useState<string | null>(null)
  const [manualItineraryId, setManualItineraryId] = useState<string | null>(null)

  // 實際使用的團/行程 ID（URL 參數優先）
  const tourId = urlTourId || manualTourId
  const packageId = urlPackageId
  const itineraryId = urlItineraryId || manualItineraryId

  // 決定使用哪個 entity
  const { entityId, entityType } = useMemo((): { entityId: string | null; entityType: BrochureEntityType } => {
    if (tourId) return { entityId: tourId, entityType: 'tour' }
    if (packageId) return { entityId: packageId, entityType: 'package' }
    if (itineraryId) return { entityId: itineraryId, entityType: 'itinerary' }
    return { entityId: null, entityType: 'tour' }
  }, [tourId, packageId, itineraryId])

  // UI 狀態
  const [selectedDesignType, setSelectedDesignType] = useState<DesignType | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  // 追蹤是否正在檢查現有存檔（用於編輯模式避免閃爍）
  const [isCheckingExisting, setIsCheckingExisting] = useState(!!urlTourId)
  const [generatedPages, setGeneratedPages] = useState<CanvasPage[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [templateData, setTemplateData] = useState<Record<string, unknown> | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleSeries | null>(null)
  const [showPageList, setShowPageList] = useState(true)
  const [showLeftPanel, setShowLeftPanel] = useState(false)  // 預設關閉元素庫
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showLayerPanel, setShowLayerPanel] = useState(false)  // 預設關閉圖層
  const [isDualPageMode, setIsDualPageMode] = useState(false)
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
  const [showImageMaskFill, setShowImageMaskFill] = useState(false)
  const [maskTargetShape, setMaskTargetShape] = useState<fabric.FabricObject | null>(null)
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [showDailyCoverUpload, setShowDailyCoverUpload] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showDailyImageEditor, setShowDailyImageEditor] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)

  // Pan mode state (Space + drag to pan)
  const [isPanMode, setIsPanMode] = useState(false)
  const panStateRef = useRef<{ isPanning: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Document store
  const {
    document: storeDocument,
    currentVersion,
    isLoading,
    loadingStage,
    loadingProgress,
    isDirty,
    isSaving,
    error,
    loadOrCreateDocument,
    saveVersion,
    setLoadingStage,
  } = useDocumentStore()

  // Canvas editor
  const canvasWidth = selectedDesignType?.width ?? 559
  const canvasHeight = selectedDesignType?.height ?? 794

  // ============================================
  // 文字編輯雙向綁定：Canvas → templateData
  // ============================================
  const handleTextEdit = useCallback((event: { elementId: string; elementName: string; newContent: string }) => {
    const { elementId, elementName, newContent } = event

    // 根據元素 ID 或 name 判斷對應的資料欄位
    // 格式：el-day-{N}-content → dailyItineraries[N-1].title
    // 格式：el-day-{N}-meal-{type}-text → dailyItineraries[N-1].meals.{type}

    // 解析每日行程內容
    const dayContentMatch = (elementId || elementName).match(/el-day-(\d+)-content/)
    if (dayContentMatch) {
      const dayIndex = parseInt(dayContentMatch[1], 10) - 1
      setTemplateData(prev => {
        if (!prev) return prev
        const dailyItineraries = [...((prev.dailyItineraries as Array<Record<string, unknown>>) || [])]
        const dailyDetails = [...((prev.dailyDetails as Array<Record<string, unknown>>) || [])]

        // 更新 dailyItineraries
        if (dailyItineraries[dayIndex]) {
          dailyItineraries[dayIndex] = { ...dailyItineraries[dayIndex], title: newContent }
        }
        // 同步更新 dailyDetails
        if (dailyDetails[dayIndex]) {
          dailyDetails[dayIndex] = { ...dailyDetails[dayIndex], title: newContent }
        }

        return { ...prev, dailyItineraries, dailyDetails }
      })
      return
    }

    // 解析餐食文字
    const mealMatch = (elementId || elementName).match(/el-day-(\d+)-meal-(breakfast|lunch|dinner)-text/)
    if (mealMatch) {
      const dayIndex = parseInt(mealMatch[1], 10) - 1
      const mealType = mealMatch[2] as 'breakfast' | 'lunch' | 'dinner'
      setTemplateData(prev => {
        if (!prev) return prev
        const dailyItineraries = [...((prev.dailyItineraries as Array<Record<string, unknown>>) || [])]
        const dailyDetails = [...((prev.dailyDetails as Array<Record<string, unknown>>) || [])]

        // 更新 dailyItineraries
        if (dailyItineraries[dayIndex]) {
          const meals = { ...((dailyItineraries[dayIndex].meals as Record<string, string>) || {}) }
          meals[mealType] = newContent
          dailyItineraries[dayIndex] = { ...dailyItineraries[dayIndex], meals }
        }
        // 同步更新 dailyDetails
        if (dailyDetails[dayIndex]) {
          const meals = { ...((dailyDetails[dayIndex].meals as Record<string, string>) || {}) }
          meals[mealType] = newContent
          dailyDetails[dayIndex] = { ...dailyDetails[dayIndex], meals }
        }

        return { ...prev, dailyItineraries, dailyDetails }
      })
      return
    }

    // 解析住宿文字
    const accommodationMatch = (elementId || elementName).match(/el-day-(\d+)-accommodation/)
    if (accommodationMatch) {
      const dayIndex = parseInt(accommodationMatch[1], 10) - 1
      setTemplateData(prev => {
        if (!prev) return prev
        const dailyItineraries = [...((prev.dailyItineraries as Array<Record<string, unknown>>) || [])]

        if (dailyItineraries[dayIndex]) {
          dailyItineraries[dayIndex] = { ...dailyItineraries[dayIndex], accommodation: newContent }
        }

        return { ...prev, dailyItineraries }
      })
      return
    }

    // 其他欄位可以繼續擴展...
    // 例如：el-main-title → mainTitle, el-subtitle → subtitle
    const simpleFieldMap: Record<string, string> = {
      'el-main-title': 'mainTitle',
      'el-subtitle': 'subtitle',
      'el-destination': 'destination',
      'el-meeting-text': 'meetingTime', // 可能需要更複雜的解析
      'el-leader-text': 'leaderName',
    }

    for (const [pattern, field] of Object.entries(simpleFieldMap)) {
      if ((elementId || elementName).includes(pattern)) {
        setTemplateData(prev => prev ? { ...prev, [field]: newContent } : prev)
        return
      }
    }
  }, [setTemplateData])

  const {
    canvasRef,
    canvas,
    isCanvasReady,
    initCanvas,
    loadCanvasData,
    loadCanvasPage,
    exportCanvasData,
    addText,
    addRectangle,
    addCircle,
    addEllipse,
    addTriangle,
    addLine,
    addImage,
    addSticker,
    addIcon,
    addIllustration,
    addTimeline,
    addTimelinePoint,
    selectedObjectIds,
    deleteSelected,
    copySelected,
    pasteClipboard,
    cutSelected,
    moveSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    getObjects,
    selectObjectById,
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    distributeH,
    distributeV,
    groupSelected,
    ungroupSelected,
    flipHorizontal,
    flipVertical,
    toggleLock,
    undo,
    redo,
    canUndo,
    canRedo,
    saveCurrentPageHistory,
    loadPageHistory,
    initPageHistory,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
    updateElementByName,
    removeObjectByName,
    getObjectByName,
  } = useBrochureEditorV2({
    width: canvasWidth,
    height: canvasHeight,
    onTextEdit: handleTextEdit,
  })

  // 遮罩編輯模式（雙擊遮罩圖片進入，可拖曳調整圖片位置）
  const { isEditingMask } = useMaskEditMode({
    canvas,
    onUpdate: () => {
      // 標記為有變更
    },
  })

  // 畫布容器 ref（用於自動適應縮放）
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // 側邊欄寬度
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX

  // 取得當前每日行程頁對應的天數索引
  // 優先使用頁面自己存的 dayIndex，如果沒有才根據位置計算
  const currentDayIndex = useMemo(() => {
    const currentPage = generatedPages[currentPageIndex] as CanvasPage & { dayIndex?: number }
    if (!currentPage || currentPage.templateKey !== 'daily') return undefined

    // 優先使用頁面自己記錄的 dayIndex（複製時會保留正確的天數）
    if (typeof currentPage.dayIndex === 'number') {
      return currentPage.dayIndex
    }

    // 回退：根據頁面位置計算（舊行為，向後相容）
    let dailyCount = 0
    for (let i = 0; i < currentPageIndex; i++) {
      if (generatedPages[i]?.templateKey === 'daily') {
        dailyCount++
      }
    }
    return dailyCount
  }, [generatedPages, currentPageIndex])

  // ============================================
  // 監聽選取變化，更新 selectedObject
  // ============================================
  useEffect(() => {
    if (!canvas) return

    const handleSelection = () => {
      const activeObject = canvas.getActiveObject()
      setSelectedObject(activeObject || null)
    }

    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => setSelectedObject(null))

    return () => {
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared')
    }
  }, [canvas])

  // ============================================
  // 頁面切換後更新頁碼
  // 規則：
  // - 封面不顯示頁碼
  // - 目錄前的空白頁不顯示頁碼
  // - 目錄開始算 p.01
  // - 目錄後的所有頁面（含空白頁）都顯示頁碼
  // ============================================
  useEffect(() => {
    if (!canvas || !isCanvasReady) return

    // 延遲執行，確保頁面已完全載入
    const timer = setTimeout(() => {
      // 計算頁碼（可能為 null，表示不顯示）
      const pageNumber = calculatePageNumber(currentPageIndex, generatedPages)

      if (pageNumber === null) {
        // 不應顯示頁碼的頁面：設為空字串
        const updated = updateElementByName('頁碼', { text: '' })
        if (updated) {
          logger.log('Page number hidden for page:', currentPageIndex)
        }
      } else {
        // 應顯示頁碼的頁面：格式化並顯示
        const pageNumberStr = formatPageNumber(pageNumber)
        const updated = updateElementByName('頁碼', { text: pageNumberStr })
        if (updated) {
          logger.log('Updated page number to:', pageNumberStr)
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [canvas, isCanvasReady, currentPageIndex, generatedPages, updateElementByName])

  // ============================================
  // 雙擊封面占位框時開啟上傳對話框
  // ============================================
  useEffect(() => {
    if (!canvas) return

    const handleDoubleClick = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      const target = e.target
      if (!target) return

      // 檢查是否為封面占位框（沒有圖片時）
      const elementData = (target as fabric.FabricObject & { data?: { elementId?: string } }).data
      if (elementData?.elementId === 'el-cover-placeholder') {
        // 沒有圖片，開啟上傳對話框
        setShowCoverUpload(true)
      }
    }

    canvas.on('mouse:dblclick', handleDoubleClick)

    return () => {
      canvas.off('mouse:dblclick', handleDoubleClick)
    }
  }, [canvas])

  // ============================================
  // 封面圖片上傳 - 步驟1：上傳後開啟位置編輯器
  // ============================================
  const handleImageUploaded = useCallback((imageUrl: string) => {
    setPendingImageUrl(imageUrl)
    setShowCoverUpload(false)
    setShowImageEditor(true)
  }, [])

  // ============================================
  // 封面圖片位置編輯完成 - 步驟2：套用圖片和位置
  // ============================================
  const handleImagePositionSaved = useCallback(async (settings: ImageEditorSettings) => {
    if (!selectedStyle || !pendingImageUrl) return

    // 從 ImageEditorSettings 取出位置設定
    const position: ImagePositionSettings = {
      x: settings.x,
      y: settings.y,
      scale: settings.scale,
    }

    // 更新 templateData 中的封面圖片和位置
    const newTemplateData = {
      ...templateData,
      coverImage: pendingImageUrl,
      coverImagePosition: position,
    }
    setTemplateData(newTemplateData)

    // 不要重新生成整個頁面！只更新當前頁面的封面圖片元素
    // 這樣可以保留用戶對其他元素的位置調整
    const currentPage = generatedPages[currentPageIndex]
    if (currentPage && canvas) {
      const templateKey = currentPage.templateKey
      // 只有 cover 和 toc 頁面有主封面圖片
      if (templateKey === 'cover' || templateKey === 'toc') {
        // 找到封面圖片元素並更新（元素名稱為「封面圖片」或「封面背景」）
        const coverImageElement = canvas.getObjects().find(obj => {
          const namedObj = obj as fabric.FabricObject & { name?: string }
          return namedObj.name === '封面圖片' || namedObj.name === '封面背景'
        }) as fabric.Image | undefined

        if (coverImageElement && pendingImageUrl) {
          // 使用與渲染器相同的 objectFit: cover 裁切邏輯
          try {
            // 使用舊圖片的尺寸作為目標尺寸（已經是裁切後的正確尺寸）
            const targetWidth = coverImageElement.width ?? (canvasWidth - 64)
            const targetHeight = coverImageElement.height ?? 350
            // position 已在函數開頭定義

            // 1. 載入原始圖片
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

            // 2. 計算 objectFit: cover 的縮放（圖片完全覆蓋容器）
            let scale = Math.max(
              targetWidth / originalWidth,
              targetHeight / originalHeight
            )
            // 套用用戶設定的位置縮放
            scale *= position.scale

            const scaledWidth = originalWidth * scale
            const scaledHeight = originalHeight * scale

            // 3. 計算位置偏移（position.x/y 是 0-100 的百分比，50 = 置中）
            const maxOffsetX = targetWidth - scaledWidth
            const maxOffsetY = targetHeight - scaledHeight
            const offsetX = (position.x / 100) * maxOffsetX
            const offsetY = (position.y / 100) * maxOffsetY

            // 4. 用臨時 canvas 裁切圖片
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = targetWidth
            tempCanvas.height = targetHeight
            const ctx = tempCanvas.getContext('2d')!
            ctx.drawImage(htmlImg, offsetX, offsetY, scaledWidth, scaledHeight)

            // 5. 將裁切後的圖片載入 Fabric.js
            const croppedDataUrl = tempCanvas.toDataURL('image/png')
            const newImage = await fabric.Image.fromURL(croppedDataUrl)

            // 保持原有的位置和透明度
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

            // 記住舊圖片的 zIndex
            const oldIndex = canvas.getObjects().indexOf(coverImageElement)

            // 移除舊的，添加新的
            canvas.remove(coverImageElement)
            canvas.add(newImage)

            // 將新圖片移到與舊圖片相同的層級
            if (oldIndex >= 0 && oldIndex < canvas.getObjects().length) {
              // 移動到正確位置
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
          // 如果找不到現有的封面圖片元素，回退到重新生成頁面
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

    // 清理狀態
    setPendingImageUrl(null)
    setShowImageEditor(false)
  }, [selectedStyle, templateData, canvas, canvasWidth, loadCanvasPage, generatedPages, currentPageIndex, pendingImageUrl, generatePageFromTemplate])

  // ============================================
  // 每日行程封面圖片上傳 - 步驟1：上傳後開啟位置編輯器
  // ============================================
  const handleDailyImageUploaded = useCallback((imageUrl: string) => {
    setPendingImageUrl(imageUrl)
    setShowDailyCoverUpload(false)
    setShowDailyImageEditor(true)
  }, [])

  // ============================================
  // 每日行程封面圖片位置編輯完成 - 步驟2：套用圖片和位置
  // ============================================
  const handleDailyImagePositionSaved = useCallback(async (settings: ImageEditorSettings) => {
    if (!selectedStyle || !pendingImageUrl || currentDayIndex === undefined) return

    // 從 ImageEditorSettings 取出位置設定
    const position: ImagePositionSettings = {
      x: settings.x,
      y: settings.y,
      scale: settings.scale,
    }

    // 取得現有的 dailyDetails
    const dailyDetails = (templateData?.dailyDetails as Array<{
      dayNumber: number
      date: string
      title: string
      coverImage?: string
      coverImagePosition?: ImagePositionSettings
      timeline: Array<{ time: string; activity: string; isHighlight?: boolean }>
      meals: { breakfast?: string; lunch?: string; dinner?: string }
    }>) || []

    // 更新當日的封面圖片
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

    // 更新 templateData
    const newTemplateData = {
      ...templateData,
      dailyDetails: newDailyDetails,
      currentDayIndex: currentDayIndex,
    }
    setTemplateData(newTemplateData)

    // 不要重新生成整個頁面！只更新圖片元素
    // 這樣可以保留用戶對其他元素的位置調整
    const currentPage = generatedPages[currentPageIndex]
    if (currentPage && canvas) {
      // 找到封面圖片元素並更新
      const coverImageElement = canvas.getObjects().find(obj => {
        const namedObj = obj as fabric.FabricObject & { name?: string }
        return namedObj.name === '當日封面'
      }) as fabric.Image | undefined

      if (coverImageElement && pendingImageUrl) {
        // 使用與渲染器相同的 objectFit: cover 裁切邏輯
        try {
          // 計算目標尺寸（封面高度是 42% 的頁面高度）
          const targetWidth = canvasWidth
          const targetHeight = Math.floor(canvasHeight * 0.42)
          // position 已在函數開頭定義

          // 1. 載入原始圖片
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

          // 2. 計算 objectFit: cover 的縮放（圖片完全覆蓋容器）
          let scale = Math.max(
            targetWidth / originalWidth,
            targetHeight / originalHeight
          )
          // 套用用戶設定的位置縮放
          scale *= position.scale

          const scaledWidth = originalWidth * scale
          const scaledHeight = originalHeight * scale

          // 3. 計算位置偏移（position.x/y 是 0-100 的百分比，50 = 置中）
          const maxOffsetX = targetWidth - scaledWidth
          const maxOffsetY = targetHeight - scaledHeight
          const offsetX = (position.x / 100) * maxOffsetX
          const offsetY = (position.y / 100) * maxOffsetY

          // 4. 用臨時 canvas 裁切圖片
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = targetWidth
          tempCanvas.height = targetHeight
          const ctx = tempCanvas.getContext('2d')!
          ctx.drawImage(htmlImg, offsetX, offsetY, scaledWidth, scaledHeight)

          // 5. 將裁切後的圖片載入 Fabric.js
          const croppedDataUrl = tempCanvas.toDataURL('image/png')
          const newImage = await fabric.Image.fromURL(croppedDataUrl)

          // 保持原有的位置和透明度
          newImage.set({
            left: coverImageElement.left ?? 0,
            top: coverImageElement.top ?? 0,
            opacity: coverImageElement.opacity ?? 0.85,
            originX: 'left',
            originY: 'top',
          })
          ;(newImage as fabric.Image & { name: string; id: string }).name = '當日封面'
          ;(newImage as fabric.Image & { name: string; id: string }).id = `el-daily-cover-d${currentDayIndex}`

          // 記住舊圖片的 zIndex
          const oldIndex = canvas.getObjects().indexOf(coverImageElement)

          // 移除舊的，添加新的
          canvas.remove(coverImageElement)
          canvas.add(newImage)

          // 將新圖片移到與舊圖片相同的層級（通常是最底層）
          if (oldIndex === 0) {
            canvas.sendObjectToBack(newImage)
          }

          canvas.renderAll()
        } catch (err) {
          logger.error('Failed to update cover image:', err)
        }
      } else if (pendingImageUrl) {
        // 如果找不到現有的封面圖片元素，添加一個新的
        await addImage(pendingImageUrl, { x: 0, y: 0 })
      }

      // 更新 generatedPages（保留 dayIndex）
      const newPages = [...generatedPages]
      const pageWithDayIndex = currentPage as CanvasPage & { dayIndex?: number }
      newPages[currentPageIndex] = {
        ...currentPage,
        // 保留或設置 dayIndex
      } as CanvasPage
      // 使用 Object.assign 來添加 dayIndex（避免類型錯誤）
      Object.assign(newPages[currentPageIndex], { dayIndex: pageWithDayIndex.dayIndex ?? currentDayIndex })
      setGeneratedPages(newPages)
    }

    // 清理狀態
    setPendingImageUrl(null)
    setShowDailyImageEditor(false)
  }, [selectedStyle, templateData, generatedPages, currentPageIndex, pendingImageUrl, currentDayIndex, canvas, canvasWidth, canvasHeight, addImage])

  // ============================================
  // 頁面管理功能
  // ============================================
  const handleSelectPage = useCallback(async (index: number) => {
    if (index < 0 || index >= generatedPages.length) return
    if (index === currentPageIndex) return // 已經在這頁了

    // 保存當前頁面的歷史記錄
    saveCurrentPageHistory()

    // 先保存當前頁面的畫布資料
    const currentCanvasData = exportCanvasData() as Record<string, unknown>
    const updatedPages = generatedPages.map((page, i) => {
      if (i === currentPageIndex) {
        return {
          ...page,
          fabricData: currentCanvasData,
        }
      }
      return page
    })
    setGeneratedPages(updatedPages as CanvasPage[])

    // 切換到新頁面
    setCurrentPageIndex(index)
    const targetPage = updatedPages[index] as CanvasPage & { fabricData?: Record<string, unknown> }

    // 2025-01-22 修改：放寬 fabricData 有效性判斷
    // 只要 fabricData 存在且有 objects 陣列結構，就使用它（即使 objects 為空）
    // 這樣可以保留用戶刪除所有元素後的空白頁面狀態，以及元素位置調整
    const hasValidFabricData = targetPage?.fabricData &&
      typeof targetPage.fabricData === 'object' &&
      Array.isArray((targetPage.fabricData as { objects?: unknown[] }).objects)

    // 如果目標頁面有 fabricData，優先使用它（保留用戶的所有編輯）
    if (hasValidFabricData && targetPage.fabricData) {
      await loadCanvasData(targetPage.fabricData)
      // 載入該頁面的歷史記錄
      loadPageHistory(targetPage.id)
    } else if (targetPage) {
      // 否則使用原始元素重新渲染（首次載入或沒有 fabricData 的頁面）
      await loadCanvasPage(targetPage)
      // 初始化該頁面的歷史（新頁面）
      initPageHistory(targetPage.id)
    }
  }, [generatedPages, currentPageIndex, exportCanvasData, loadCanvasData, loadCanvasPage, saveCurrentPageHistory, loadPageHistory, initPageHistory])

  const handleAddPage = useCallback(async (templateKey: string) => {
    // 保存當前頁面的歷史
    saveCurrentPageHistory()

    let newPage: CanvasPage

    if (templateKey === 'blank') {
      // 空白頁面：不需要模板，直接建立空白頁
      newPage = {
        id: `blank-${crypto.randomUUID()}`,
        name: '空白頁',
        templateKey: 'blank',
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff',
        elements: [],
      }
    } else {
      // 其他頁面：需要模板
      if (!selectedStyle || !templateData) return

      // 根據模板 key 找到對應的模板 ID
      const templateId = selectedStyle.templates[templateKey as keyof typeof selectedStyle.templates]
      if (!templateId) return

      // 生成新頁面（使用現有的 templateData）
      newPage = generatePageFromTemplate(templateId, templateData as TemplateData)
    }

    // 加到頁面列表
    setGeneratedPages(prev => [...prev, newPage])

    // 切換到新頁面
    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    await loadCanvasPage(newPage)

    // 初始化新頁面的歷史
    initPageHistory(newPage.id)
  }, [selectedStyle, templateData, generatedPages.length, loadCanvasPage, saveCurrentPageHistory, initPageHistory, canvasWidth, canvasHeight])

  // 一次新增所有天的每日行程頁面
  const handleAddDailyPages = useCallback(async () => {
    if (!selectedStyle || !templateData) return

    const templateId = selectedStyle.templates.daily
    if (!templateId) return

    // 取得總天數
    const data = templateData as TemplateData
    const totalDays = data.dailyItineraries?.length || 0
    if (totalDays === 0) return

    // 保存當前頁面的歷史
    saveCurrentPageHistory()

    // 生成所有天的頁面
    const newPages: (CanvasPage & { dayIndex: number })[] = []
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      // 設定 currentDayIndex 來指定第幾天
      const dataWithDay = {
        ...data,
        currentDayIndex: dayIndex,
      }
      const newPage = generatePageFromTemplate(templateId, dataWithDay) as CanvasPage & { dayIndex: number }
      // 修改頁面名稱以顯示是第幾天
      newPage.name = `第 ${dayIndex + 1} 天行程`
      // 在頁面上記錄它對應的天數索引（複製時會保留）
      newPage.dayIndex = dayIndex
      newPages.push(newPage)
    }

    // 加到頁面列表
    setGeneratedPages(prev => [...prev, ...newPages])

    // 切換到第一個新增的頁面
    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    if (newPages[0]) {
      await loadCanvasPage(newPages[0])
      initPageHistory(newPages[0].id)
    }
  }, [selectedStyle, templateData, generatedPages.length, loadCanvasPage, saveCurrentPageHistory, initPageHistory])

  // 計算備忘錄設定（基於目的地國家）
  const memoSettings = useMemo(() => {
    if (!templateData) return null
    const data = templateData as TemplateData
    // 優先使用 countryCode，如果沒有則從 destination 推斷
    const countryCode = data.countryCode || getCountryCodeFromName(data.destination || '')
    return getMemoSettingsByCountry(countryCode)
  }, [templateData])

  // 計算已使用的備忘錄項目 ID（從所有備忘錄頁面收集）
  const usedMemoItemIds = useMemo(() => {
    const usedIds: string[] = []
    for (const page of generatedPages) {
      // 檢查頁面是否有 memoPageContent
      const pageWithMemo = page as { memoPageContent?: MemoPageContent }
      if (pageWithMemo.memoPageContent?.items) {
        for (const item of pageWithMemo.memoPageContent.items) {
          if (item.id && !usedIds.includes(item.id)) {
            usedIds.push(item.id)
          }
        }
      }
    }
    return usedIds
  }, [generatedPages])

  // 新增備忘錄頁面（帶選擇的內容）
  const handleAddMemoPage = useCallback(async (content: MemoPageContent) => {
    if (!selectedStyle || !memoSettings) return

    const templateId = selectedStyle.templates.memo
    if (!templateId) return

    // 保存當前頁面的歷史
    saveCurrentPageHistory()

    // 計算新頁面的索引（用於頁碼）
    const existingMemoPages = generatedPages.filter((p) => p.templateKey === 'memo')
    const memoPageIndex = existingMemoPages.length

    // 準備模板資料，包含選擇的內容
    const memoTemplateData: TemplateData = {
      ...templateData as TemplateData,
      memoSettings,
      currentMemoPageIndex: memoPageIndex,
      // 自訂備忘錄內容（新的方式）
      memoPageContent: content,
    } as TemplateData & { memoPageContent: MemoPageContent }

    // 生成備忘錄頁面
    const newPage = generatePageFromTemplate(templateId, memoTemplateData)
    newPage.name = content.isWeatherPage ? '天氣/緊急資訊' : `旅遊提醒 ${memoPageIndex + 1}`

    // 在頁面上保存 memoPageContent 以追蹤使用的項目
    const pageWithMemo = newPage as CanvasPage & { memoPageContent?: MemoPageContent }
    pageWithMemo.memoPageContent = content

    // 加到頁面列表
    setGeneratedPages((prev) => [...prev, pageWithMemo as CanvasPage])

    // 切換到新頁面
    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    await loadCanvasPage(newPage)

    // 初始化新頁面的歷史
    initPageHistory(newPage.id)
  }, [selectedStyle, memoSettings, templateData, generatedPages, loadCanvasPage, saveCurrentPageHistory, initPageHistory])

  const handleDeletePage = useCallback((index: number) => {
    // 不能刪除封面（index 0）
    if (index <= 0 || index >= generatedPages.length) return

    setGeneratedPages(prev => prev.filter((_, i) => i !== index))

    // 如果刪除的是當前頁面，切換到前一頁
    if (currentPageIndex >= index) {
      const newIndex = Math.max(0, currentPageIndex - 1)
      setCurrentPageIndex(newIndex)
      const page = generatedPages[newIndex === index ? newIndex - 1 : newIndex]
      if (page) {
        loadCanvasPage(page)
      }
    }
  }, [generatedPages, currentPageIndex, loadCanvasPage])

  const handleDuplicatePage = useCallback(async (index: number) => {
    if (index < 0 || index >= generatedPages.length) return

    const pageToDuplicate = generatedPages[index]

    // 保存當前頁面的畫布資料（如果正在編輯要複製的頁面）
    let fabricDataToCopy: Record<string, unknown> | undefined
    if (index === currentPageIndex) {
      saveCurrentPageHistory()
      fabricDataToCopy = exportCanvasData() as Record<string, unknown>
    } else {
      fabricDataToCopy = (pageToDuplicate as { fabricData?: Record<string, unknown> }).fabricData
    }

    // 計算原始頁面的 dayIndex（如果是 daily 頁面且沒有 dayIndex）
    let sourceDayIndex: number | undefined
    const pageWithDayIndex = pageToDuplicate as CanvasPage & { dayIndex?: number }
    if (pageToDuplicate.templateKey === 'daily') {
      if (typeof pageWithDayIndex.dayIndex === 'number') {
        sourceDayIndex = pageWithDayIndex.dayIndex
      } else {
        // 計算原始頁面應該是第幾天
        let dailyCount = 0
        for (let i = 0; i < index; i++) {
          if (generatedPages[i]?.templateKey === 'daily') {
            dailyCount++
          }
        }
        sourceDayIndex = dailyCount
      }
    }

    // 建立複製的頁面（使用新 ID，確保唯一性）
    const duplicatedPage: CanvasPage = {
      ...pageToDuplicate,
      id: `${pageToDuplicate.templateKey || 'page'}-${crypto.randomUUID()}`,
      name: `${pageToDuplicate.name} (複製)`,
      elements: [...pageToDuplicate.elements], // 淺複製元素陣列
    }

    // 設定複製頁面的 dayIndex（與原始頁面相同）
    if (pageToDuplicate.templateKey === 'daily' && typeof sourceDayIndex === 'number') {
      (duplicatedPage as CanvasPage & { dayIndex?: number }).dayIndex = sourceDayIndex
    }

    // 如果有 fabricData，也要複製
    if (fabricDataToCopy) {
      (duplicatedPage as { fabricData?: Record<string, unknown> }).fabricData = JSON.parse(JSON.stringify(fabricDataToCopy))
    }

    // 插入複製的頁面，並為舊文檔的 daily 頁面補上 dayIndex
    setGeneratedPages(prev => {
      // 先為所有沒有 dayIndex 的 daily 頁面補上正確的 dayIndex（在插入前）
      let dailyCount = 0
      const pagesWithFixedDayIndex = prev.map((page) => {
        if (page.templateKey === 'daily') {
          const p = page as CanvasPage & { dayIndex?: number }
          if (typeof p.dayIndex !== 'number') {
            // 舊文檔沒有 dayIndex，補上
            return { ...page, dayIndex: dailyCount++ }
          }
          dailyCount++
        }
        return page
      })
      
      // 插入複製的頁面（dayIndex 與原始頁面相同）
      const newPages = [...pagesWithFixedDayIndex]
      newPages.splice(index + 1, 0, duplicatedPage)
      return newPages
    })

    // 切換到新複製的頁面
    const newIndex = index + 1
    setCurrentPageIndex(newIndex)
    if (fabricDataToCopy) {
      await loadCanvasData(fabricDataToCopy)
    } else {
      await loadCanvasPage(duplicatedPage)
    }

    // 初始化新頁面的歷史
    initPageHistory(duplicatedPage.id)
  }, [generatedPages, currentPageIndex, exportCanvasData, loadCanvasData, loadCanvasPage, saveCurrentPageHistory, initPageHistory])

  const handleReorderPages = useCallback((fromIndex: number, toIndex: number) => {
    // 封面不可移動
    if (fromIndex <= 0 || toIndex <= 0) return

    setGeneratedPages(prev => {
      const newPages = [...prev]
      const [removed] = newPages.splice(fromIndex, 1)
      newPages.splice(toIndex, 0, removed)
      return newPages
    })

    // 更新當前頁面索引
    if (currentPageIndex === fromIndex) {
      setCurrentPageIndex(toIndex)
    } else if (fromIndex < currentPageIndex && toIndex >= currentPageIndex) {
      setCurrentPageIndex(currentPageIndex - 1)
    } else if (fromIndex > currentPageIndex && toIndex <= currentPageIndex) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }, [currentPageIndex])

  // 套用目錄變更到目錄頁
  const handleApplyToc = useCallback(async () => {
    if (!selectedStyle || !templateData) return

    // 找到目錄頁的索引
    const tocPageIndex = generatedPages.findIndex((p) => p.templateKey === 'toc')
    if (tocPageIndex < 0) return

    // 取得 tocItems
    const tocItems = (templateData.tocItems as Array<{
      pageId: string
      displayName: string
      icon: string
      enabled: boolean
      pageNumber: number
    }>) || []

    // 過濾出啟用的項目
    const enabledItems = tocItems.filter((item) => item.enabled)

    // 組合目錄內容給模板
    const tocContent = enabledItems.map((item) => ({
      name: item.displayName,
      page: item.pageNumber,
      icon: item.icon,
    }))

    // 更新 templateData 中的 tocContent
    const newTemplateData = {
      ...templateData,
      tocContent,
    }
    setTemplateData(newTemplateData)

    // 重新生成目錄頁
    const templateId = selectedStyle.templates.toc
    if (!templateId) return

    const newTocPage = generatePageFromTemplate(templateId, newTemplateData as Parameters<typeof generatePageFromTemplate>[1])

    // 更新 generatedPages
    const newPages = [...generatedPages]
    newPages[tocPageIndex] = newTocPage
    setGeneratedPages(newPages)

    // 如果當前頁面是目錄頁，重新載入畫布
    if (currentPageIndex === tocPageIndex) {
      await loadCanvasPage(newTocPage)
    }
  }, [selectedStyle, templateData, generatedPages, currentPageIndex, loadCanvasPage])

  // ============================================
  // 自動載入已存在的文件（頁面重新整理時）
  // ============================================
  useEffect(() => {
    // 等待 auth store hydration 完成
    if (!_hasHydrated) return
    // 如果已選擇設計類型，不需要自動載入
    if (selectedDesignType) return
    // 需要有 entityId 才能載入
    if (!entityId || !workspaceId) return

    const autoLoadDocument = async () => {
      try {
        // 嘗試載入現有文件
        await loadOrCreateDocument('brochure', entityId, workspaceId, entityType)

        const { document: loadedDoc, currentVersion: loadedVersion } = useDocumentStore.getState()

        if (loadedVersion) {
          // 有存檔，自動設定設計類型並跳過選擇器
          // 從存檔資料中取得手冊尺寸
          const versionData = loadedVersion.data as Record<string, unknown>
          const pages = versionData.pages as Array<{ width?: number; height?: number; templateKey?: string }> | undefined
          const firstPage = pages?.[0]

          // 根據尺寸找到對應的設計類型
          let matchedType: DesignType | undefined

          // 1. 如果有有效的尺寸，嘗試精確匹配
          if (firstPage?.width && firstPage?.height) {
            matchedType = DESIGN_TYPES.find(dt =>
              dt.width === firstPage.width &&
              dt.height === firstPage.height
            )
          }

          // 2. 如果沒有精確匹配，根據 templateKey 判斷是否為手冊類型
          if (!matchedType) {
            const isBrochureDocument = pages?.some(p =>
              p.templateKey && ['cover', 'toc', 'daily', 'itinerary', 'memo', 'hotel', 'vehicle', 'table'].includes(p.templateKey)
            )
            // 手冊類型默認 A5，其他類型默認第一個
            matchedType = isBrochureDocument
              ? DESIGN_TYPES.find(dt => dt.id === 'brochure-a5') || DESIGN_TYPES[0]
              : DESIGN_TYPES[0]
          }

          setSelectedDesignType(matchedType)
          // currentVersion 會在另一個 useEffect 中被處理並載入畫布
        }
        // 如果沒有存檔版本，不做任何事，讓使用者看到設計類型選擇器
      } catch (err) {
        logger.error('Failed to auto-load document:', err)
      } finally {
        // 檢查完成，不論有無存檔都要結束檢查狀態
        setIsCheckingExisting(false)
      }
    }

    autoLoadDocument()
  }, [_hasHydrated, entityId, workspaceId, entityType, selectedDesignType, loadOrCreateDocument])

  // ============================================
  // 選擇設計類型（非手冊類型）
  // ============================================
  const handleSelectDesignType = useCallback(async (type: DesignType) => {
    setSelectedDesignType(type)

    // 其他類型直接進入編輯器，建立新的文件
    if (entityId && workspaceId) {
      try {
        await loadOrCreateDocument('brochure', entityId, workspaceId, entityType, undefined, true)
      } catch (err) {
        logger.error('Failed to create document:', err)
      }
    }
  }, [entityId, entityType, workspaceId, loadOrCreateDocument])

  // ============================================
  // 手冊類型開始設計（整合團、行程、模板選擇）
  // ============================================
  const handleBrochureStart = useCallback(async (
    type: DesignType,
    selectedTourId: string,
    selectedItineraryId: string | null,
    styleId: string
  ) => {
    // 設定手動選擇的團/行程
    setManualTourId(selectedTourId)
    setManualItineraryId(selectedItineraryId)
    setSelectedDesignType(type)

    // 取得風格
    const style = styleSeries.find(s => s.id === styleId) || styleSeries[0]
    setSelectedStyle(style)

    const effectiveEntityId = selectedTourId

    // 每次都建立新的手冊，載入行程資料並生成封面頁
    try {
      let data: TemplateData = {
        mainTitle: '旅遊手冊',
        companyName: 'Corner Travel',
      }

      // 載入行程資料
      if (selectedItineraryId) {
        const { data: itineraryData } = await supabase
          .from('itineraries')
          .select('*')
          .eq('id', selectedItineraryId)
          .single()

        if (itineraryData) {
          data = itineraryToTemplateData({
            title: itineraryData.title ?? undefined,
            subtitle: itineraryData.subtitle ?? undefined,
            tour_code: itineraryData.tour_code ?? undefined,
            cover_image: itineraryData.cover_image ?? undefined,
            country: itineraryData.country ?? undefined,
            city: itineraryData.city ?? undefined,
            departure_date: itineraryData.departure_date ?? undefined,
            return_date: (itineraryData as { return_date?: string | null }).return_date ?? undefined,
            duration_days: itineraryData.duration_days ?? undefined,
            meeting_info: (itineraryData.meeting_info as Record<string, unknown>) ?? undefined,
            leader: (itineraryData.leader as Record<string, unknown>) ?? undefined,
            outbound_flight: (itineraryData.outbound_flight as Record<string, unknown>) ?? undefined,
            return_flight: (itineraryData.return_flight as Record<string, unknown>) ?? undefined,
            daily_itinerary: (itineraryData.daily_itinerary as Array<Record<string, unknown>>) ?? undefined,
          })
        }
      } else if (selectedTourId) {
        // 只有團，沒有行程
        const { data: tourData } = await supabase
          .from('tours')
          .select('*')
          .eq('id', selectedTourId)
          .single()

        if (tourData) {
          // 計算天數
          let durationDays = 1
          if (tourData.departure_date && tourData.return_date) {
            try {
              const start = new Date(tourData.departure_date)
              const end = new Date(tourData.return_date)
              durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            } catch {
              durationDays = 1
            }
          }

          data = itineraryToTemplateData({
            title: tourData.name ?? undefined,
            tour_code: tourData.code ?? undefined,
            departure_date: tourData.departure_date ?? undefined,
            return_date: tourData.return_date ?? undefined,
            duration_days: durationDays,
            outbound_flight: (tourData.outbound_flight as Record<string, unknown>) ?? undefined,
            return_flight: (tourData.return_flight as Record<string, unknown>) ?? undefined,
          })
        }
      }

      // 生成封面頁
      const coverTemplateId = style.templates.cover
      const coverPage = generatePageFromTemplate(coverTemplateId, data)

      setGeneratedPages([coverPage])
      setCurrentPageIndex(0)
      setTemplateData(data as Record<string, unknown>)

      // 建立新的手冊文件（每次都建立新的副本）
      if (effectiveEntityId && workspaceId) {
        await loadOrCreateDocument('brochure', effectiveEntityId, workspaceId, 'tour', undefined, true)
      }
    } catch (err) {
      logger.error('Failed to start brochure:', err)
    }
  }, [workspaceId, loadOrCreateDocument])

  // ============================================
  // 模板選擇完成
  // ============================================
  const handleTemplateComplete = useCallback(async (
    pages: CanvasPage[],
    itineraryTemplateData: Record<string, unknown> | null,
    style: StyleSeries,
  ) => {
    setGeneratedPages(pages)
    setCurrentPageIndex(0) // 重置到第一頁
    setTemplateData(itineraryTemplateData)
    setSelectedStyle(style)
    setShowTemplateSelector(false)

    // 如果有 entityId，建立新的手冊文件
    if (entityId && workspaceId) {
      try {
        await loadOrCreateDocument('brochure', entityId, workspaceId, entityType, undefined, true)
      } catch (err) {
        logger.error('Failed to create document:', err)
      }
    }
  }, [entityId, entityType, workspaceId, loadOrCreateDocument])

  // ============================================
  // Initialize Canvas & Load Data
  // ============================================
  useEffect(() => {
    // 如果還在顯示模板選擇器，不初始化畫布
    if (showTemplateSelector) return
    if (!selectedDesignType) return

    // 沒有 entityId 時（純編輯模式）
    if (!storeDocument && !entityId) {
      initCanvas()
      setLoadingStage('idle', 100)
      return
    }

    // 等待文件載入
    if (!storeDocument || isLoading) return

    initCanvas()

    if (!currentVersion) {
      setLoadingStage('idle', 100)
    }
  }, [showTemplateSelector, selectedDesignType, storeDocument, isLoading, initCanvas, currentVersion, setLoadingStage, entityId])

  // ============================================
  // 自動適應畫布縮放
  // ============================================
  useEffect(() => {
    if (!isCanvasReady || !canvasContainerRef.current) return

    // 取得容器尺寸並計算適合的縮放
    // padding 44 = 32px 原本邊距 + 12px 額外空間（因為尺規佔 24px，而 padding 會乘 2）
    const container = canvasContainerRef.current
    const { clientWidth, clientHeight } = container
    fitToContainer(clientWidth, clientHeight, 44)

    // 監聽視窗大小變化
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current
        fitToContainer(clientWidth, clientHeight, 44)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isCanvasReady, fitToContainer])

  useEffect(() => {
    if (!isCanvasReady || !currentVersion) return

    setLoadingStage('rendering_canvas', 90)

    // 檢查是否為多頁格式
    const versionData = currentVersion.data as Record<string, unknown>
    if (versionData.version === 1 && Array.isArray(versionData.pages)) {
      // 新格式：多頁文件
      interface SavedPage {
        id: string
        name: string
        templateKey?: string
        width: number
        height: number
        backgroundColor: string
        elements: CanvasElement[]
        fabricData?: Record<string, unknown>
        memoPageContent?: MemoPageContent // 備忘錄內容
        dayIndex?: number // 每日行程的天數索引
      }
      const savedPages = versionData.pages as SavedPage[]
      const savedPageIndex = typeof versionData.currentPageIndex === 'number' ? versionData.currentPageIndex : 0
      const savedTemplateData = versionData.templateData as Record<string, unknown> | null
      const savedStyleId = versionData.styleId as string | null

      // 還原頁面資料（偵測舊尺寸並自動縮放）
      const restoredPages = savedPages.map(page => {
        // 修正舊資料的 templateKey
        let fixedTemplateKey = page.templateKey
        // 行程總覽原本錯誤設為 'daily'
        if (page.name?.includes('行程總覽') && page.templateKey === 'daily') {
          fixedTemplateKey = 'itinerary'
        }
        // 目錄原本錯誤設為 'general'
        if (page.name?.includes('目錄') && page.templateKey === 'general') {
          fixedTemplateKey = 'toc'
        }

        // 檢測是否需要縮放到標準 A5 尺寸（300 DPI）
        const shouldScale = needsScaling(page.width, page.height)
        const scaleFactor = shouldScale ? calculateScaleFactor(page.width) : 1
        const scaledWidth = shouldScale ? NEW_A5_WIDTH : page.width
        const scaledHeight = shouldScale ? NEW_A5_HEIGHT : page.height
        const scaledFabricData = shouldScale && page.fabricData
          ? scaleFabricData(page.fabricData, scaleFactor)
          : page.fabricData

        // 縮放 elements（如果有的話）
        const scaledElements = shouldScale
          ? page.elements.map((el): CanvasElement => {
              // 使用 spread + 類型斷言來處理 union type 的動態屬性修改
              const scaled = { ...el } as CanvasElement & {
                width?: number
                height?: number
                style?: { fontSize: number; [key: string]: unknown }
                size?: number
                cornerRadius?: number
                strokeWidth?: number
              }
              scaled.x = el.x * scaleFactor
              scaled.y = el.y * scaleFactor
              // 縮放有寬高的元素
              if ('width' in el && el.width) scaled.width = el.width * scaleFactor
              if ('height' in el && el.height) scaled.height = el.height * scaleFactor
              // 縮放文字元素的字體大小
              if (el.type === 'text' && 'style' in el) {
                scaled.style = { ...el.style, fontSize: el.style.fontSize * scaleFactor }
              }
              // 縮放圖標元素的尺寸
              if (el.type === 'icon' && 'size' in el) {
                scaled.size = el.size * scaleFactor
              }
              // 縮放形狀元素的圓角和邊框
              if (el.type === 'shape') {
                if ('cornerRadius' in el && el.cornerRadius) scaled.cornerRadius = el.cornerRadius * scaleFactor
                if ('strokeWidth' in el && el.strokeWidth) scaled.strokeWidth = el.strokeWidth * scaleFactor
              }
              return scaled as CanvasElement
            })
          : page.elements

        if (shouldScale) {
          logger.log(`[Auto Scale] 頁面 "${page.name}" 從 ${page.width}x${page.height} 縮放到 ${scaledWidth}x${scaledHeight} (縮放因子: ${scaleFactor.toFixed(3)})`)
        }

        const restoredPage: CanvasPage & { dayIndex?: number; memoPageContent?: MemoPageContent } = {
          id: page.id,
          name: page.name,
          templateKey: fixedTemplateKey,
          width: scaledWidth,
          height: scaledHeight,
          backgroundColor: page.backgroundColor,
          elements: scaledElements,
          fabricData: scaledFabricData, // 縮放後的畫布資料
        }
        // 還原備忘錄內容
        if (page.memoPageContent) {
          restoredPage.memoPageContent = page.memoPageContent
        }
        // 還原每日行程的天數索引
        if (typeof page.dayIndex === 'number') {
          restoredPage.dayIndex = page.dayIndex
        }
        return restoredPage
      }) as CanvasPage[]

      // 自動修復缺少 dayIndex 的 daily 頁面（舊文檔相容）
      let dailyCount = 0
      for (const page of restoredPages) {
        if (page.templateKey === 'daily') {
          const pageWithDayIndex = page as CanvasPage & { dayIndex?: number }
          if (typeof pageWithDayIndex.dayIndex !== 'number') {
            pageWithDayIndex.dayIndex = dailyCount
          }
          dailyCount++
        }
      }

      setGeneratedPages(restoredPages)
      setCurrentPageIndex(savedPageIndex)
      if (savedTemplateData) {
        setTemplateData(savedTemplateData)
        // 注意：不從資料庫更新內容，手冊保存後內容就固定了
      }

      // 還原選擇的風格
      if (savedStyleId) {
        const style = styleSeries.find(s => s.id === savedStyleId)
        if (style) {
          setSelectedStyle(style)
        }
      }

      // 載入當前頁面的畫布資料（使用縮放後的 restoredPages）
      const currentPageData = restoredPages[savedPageIndex]
      // 2025-01-22 修改：放寬 fabricData 有效性判斷
      // 只要 fabricData 存在且有 objects 陣列結構，就使用它（即使 objects 為空）
      const hasValidFabricData = currentPageData?.fabricData &&
        typeof currentPageData.fabricData === 'object' &&
        Array.isArray((currentPageData.fabricData as { objects?: unknown[] }).objects)

      if (hasValidFabricData && currentPageData.fabricData) {
        // 使用縮放後的 fabricData（保留用戶的所有編輯，包括位置調整）
        loadCanvasData(currentPageData.fabricData).then(() => {
          setLoadingStage('idle', 100)
          // 初始化當前頁面的歷史記錄
          initPageHistory(currentPageData.id)
        })
      } else if (restoredPages[savedPageIndex]) {
        // 如果沒有 fabricData，使用 elements 重新渲染（首次載入）
        loadCanvasPage(restoredPages[savedPageIndex]).then(() => {
          setLoadingStage('idle', 100)
          // 初始化當前頁面的歷史記錄
          initPageHistory(restoredPages[savedPageIndex].id)
        })
      } else {
        setLoadingStage('idle', 100)
      }
    } else {
      // 舊格式：單頁文件（向後相容）
      loadCanvasData(versionData).then(() => {
        setLoadingStage('idle', 100)
        // 舊格式沒有頁面 ID，使用固定值
        initPageHistory('legacy-page')
      })
    }
  }, [isCanvasReady, currentVersion, loadCanvasData, loadCanvasPage, setLoadingStage, initPageHistory, entityId, entityType])

  // ============================================
  // Load Generated Pages (初次載入)
  // ============================================
  const initialLoadDoneRef = useRef(false)
  useEffect(() => {
    if (!isCanvasReady || generatedPages.length === 0) return
    // 如果有已存的版本，不覆蓋
    if (currentVersion) return
    // 只在初次載入時執行，避免切換頁面後又重新載入第一頁
    if (initialLoadDoneRef.current) return
    initialLoadDoneRef.current = true

    // 載入第一頁到畫布（使用完整的 renderer，支援圓拱形狀遮罩等）
    const firstPage = generatedPages[0]
    if (firstPage) {
      loadCanvasPage(firstPage).then(() => {
        logger.log('Loaded generated page:', firstPage.name)
        // 初始化第一頁的歷史記錄
        initPageHistory(firstPage.id)
      })
    }
  }, [isCanvasReady, generatedPages, currentVersion, loadCanvasPage, initPageHistory])

  // ============================================
  // Save Handler (Multi-page support)
  // ============================================
  const handleSave = useCallback(async () => {
    if (!isCanvasReady || isSaving) return

    // 取得當前畫布資料（當前頁面的最新狀態）
    const currentCanvasData = exportCanvasData() as Record<string, unknown>

    // 更新當前頁面的 fabricData
    const updatedPages = generatedPages.map((page, index) => {
      if (index === currentPageIndex) {
        return {
          ...page,
          fabricData: currentCanvasData, // 儲存當前畫布狀態
        }
      }
      return page
    })

    // 組合完整的文件資料
    const documentData = {
      version: 1, // 版本號，方便未來升級格式
      pages: updatedPages.map(page => {
        const pageWithExtras = page as CanvasPage & {
          fabricData?: Record<string, unknown>
          memoPageContent?: MemoPageContent
          dayIndex?: number
        }
        return {
          id: page.id,
          name: page.name,
          templateKey: page.templateKey,
          width: page.width,
          height: page.height,
          backgroundColor: page.backgroundColor,
          elements: page.elements, // 原始元素資料
          fabricData: pageWithExtras.fabricData, // Fabric.js 畫布資料
          memoPageContent: pageWithExtras.memoPageContent, // 備忘錄內容
          dayIndex: pageWithExtras.dayIndex, // 每日行程的天數索引
        }
      }),
      currentPageIndex,
      templateData: templateData || null,
      styleId: selectedStyle?.id || null,
    }

    // 將設計類型 ID 轉換為資料庫格式 (brochure-a5 -> brochure_a5)
    const dbDesignType = selectedDesignType?.id?.replace(/-/g, '_')

    await saveVersion(
      documentData as unknown as Parameters<typeof saveVersion>[0],
      undefined,
      dbDesignType
    )

    // 更新本地的 generatedPages（包含 fabricData）
    setGeneratedPages(updatedPages as CanvasPage[])
  }, [isCanvasReady, isSaving, exportCanvasData, saveVersion, generatedPages, currentPageIndex, templateData, selectedStyle, selectedDesignType])

  // ============================================
  // Print/PDF Export Handler - 開啟列印預覽
  // ============================================
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = useCallback(async () => {
    if (generatedPages.length === 0 || isExporting) return

    setIsExporting(true)

    try {
      logger.log(`[PDF Export] Starting vector PDF export for ${generatedPages.length} pages`)

      // 生成向量 PDF
      const blob = await generateBrochurePDF(generatedPages, {
        filename: `${storeDocument?.name || '手冊'}.pdf`,
        onProgress: (current, total) => {
          logger.log(`[PDF Export] Progress: ${current}/${total}`)
        },
      })

      // 開啟預覽視窗
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')

      if (!printWindow) {
        // 如果無法開啟新視窗，直接下載
        const a = document.createElement('a')
        a.href = url
        a.download = `${storeDocument?.name || '手冊'}.pdf`
        a.click()
      }

      logger.log(`[PDF Export] Generated PDF: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
    } catch (error) {
      logger.error('[PDF Export] Failed:', error)
      alert('PDF 匯出失敗，請稍後再試')
    } finally {
      setIsExporting(false)
    }
  }, [generatedPages, isExporting, storeDocument?.name])

  // ============================================
  // Template Data Change Handler
  // 直接更新畫布上的元素，不重新生成頁面（Canva 模式）
  // ============================================
  const handleTemplateDataChange = useCallback((newData: Record<string, unknown>) => {
    const oldData = templateData || {}
    setTemplateData(newData)

    // 如果畫布未準備好，只更新 state
    if (!isCanvasReady) return

    // 取得當前頁面
    const currentPage = generatedPages[currentPageIndex]

    // 檢查是否為分車/分桌頁面，需要重新生成頁面
    if (currentPage?.templateKey === 'vehicle' || currentPage?.templateKey === 'table') {
      const oldVehicles = (oldData.vehicles as Array<Record<string, unknown>>) || []
      const newVehicles = (newData.vehicles as Array<Record<string, unknown>>) || []
      const oldSettings = oldData.vehicleColumnSettings as Record<string, unknown> | undefined
      const newSettings = newData.vehicleColumnSettings as Record<string, unknown> | undefined

      // vehicles 資料或排版設定有變化就重新生成頁面
      const vehiclesChanged = JSON.stringify(oldVehicles) !== JSON.stringify(newVehicles)
      const settingsChanged = JSON.stringify(oldSettings) !== JSON.stringify(newSettings)

      if ((vehiclesChanged || settingsChanged) && selectedStyle?.id) {
        const templateKey = currentPage.templateKey as 'vehicle' | 'table'
        const templateId = selectedStyle.templates[templateKey]
        if (templateId) {
          const newPage = generatePageFromTemplate(templateId, newData as TemplateData)

          if (newPage) {
            // 保留原始頁面 ID 和名稱
            newPage.id = currentPage.id
            newPage.name = currentPage.name

            // 更新頁面列表
            setGeneratedPages(prev => {
              const updated = [...prev]
              updated[currentPageIndex] = newPage
              return updated
            })

            // 重新載入畫布
            loadCanvasPage(newPage)
          }
        }
        return // 已重新生成頁面，不需要繼續處理其他欄位
      }
    }

    // 檢查是否為備忘錄頁面，需要重新生成頁面並自動分頁
    if (currentPage?.templateKey === 'memo') {
      const oldMemoSettings = oldData.memoSettings as MemoSettings | undefined
      const newMemoSettings = newData.memoSettings as (MemoSettings & { unifiedOrder?: string[] }) | undefined

      // memoSettings 有變化就重新生成頁面
      const memoSettingsChanged = JSON.stringify(oldMemoSettings) !== JSON.stringify(newMemoSettings)

      if (memoSettingsChanged && selectedStyle?.id) {
        const templateId = selectedStyle.templates.memo
        if (templateId && newMemoSettings) {
          // 季節名稱對照（用於轉換成 MemoItem）
          const seasonLabels: Record<string, { title: string; titleZh: string }> = {
            spring: { title: 'Spring Weather', titleZh: '春季氣候' },
            summer: { title: 'Summer Weather', titleZh: '夏季氣候' },
            autumn: { title: 'Autumn Weather', titleZh: '秋季氣候' },
            winter: { title: 'Winter Weather', titleZh: '冬季氣候' },
          }

          // 建立統一的項目列表（將 items、seasons、infoItems 都轉換成 MemoItem 格式）
          type UnifiedItem = {
            id: string
            type: 'item' | 'season' | 'info'
            memoItem: MemoItem
          }

          const unifiedItems: UnifiedItem[] = []

          // 加入一般項目
          newMemoSettings.items?.forEach((item) => {
            if (item.enabled) {
              unifiedItems.push({
                id: item.id,
                type: 'item',
                memoItem: item,
              })
            }
          })

          // 將季節轉換成 MemoItem 格式
          newMemoSettings.seasons?.forEach((season) => {
            if (season.enabled) {
              const labels = seasonLabels[season.season] || { title: season.season, titleZh: season.season }
              unifiedItems.push({
                id: `season-${season.season}`,
                type: 'season',
                memoItem: {
                  id: `season-${season.season}`,
                  category: 'weather',
                  icon: season.icon,
                  title: labels.title,
                  titleZh: labels.titleZh,
                  content: `${season.months}\n${season.description}`,
                  enabled: true,
                },
              })
            }
          })

          // 將緊急聯絡轉換成 MemoItem 格式
          newMemoSettings.infoItems?.forEach((info) => {
            if (info.enabled) {
              unifiedItems.push({
                id: info.id,
                type: 'info',
                memoItem: {
                  id: info.id,
                  category: 'practical',
                  icon: info.icon,
                  title: info.title,
                  titleZh: info.title,
                  content: info.content,
                  enabled: true,
                },
              })
            }
          })

          // 如果有儲存的排序，按照 unifiedOrder 排序
          if (newMemoSettings.unifiedOrder && newMemoSettings.unifiedOrder.length > 0) {
            const orderMap = new Map(newMemoSettings.unifiedOrder.map((id, idx) => [id, idx]))
            unifiedItems.sort((a, b) => {
              const orderA = orderMap.get(a.id) ?? 999
              const orderB = orderMap.get(b.id) ?? 999
              return orderA - orderB
            })
          }

          // 取出排序後的 MemoItem 列表
          const enabledItems = unifiedItems.map(u => u.memoItem)

          const itemsPerPage = 7
          const itemPagesNeeded = Math.max(1, Math.ceil(enabledItems.length / itemsPerPage))

          // 取得現有的備忘錄頁面資訊
          const memoPageIndices: number[] = []
          generatedPages.forEach((p, idx) => {
            if (p.templateKey === 'memo') memoPageIndices.push(idx)
          })
          const firstMemoIndex = memoPageIndices.length > 0 ? memoPageIndices[0] : currentPageIndex

          // 生成新的備忘錄頁面
          const newMemoPages: CanvasPage[] = []

          // 生成項目頁面（包含一般項目、季節、緊急聯絡）
          for (let i = 0; i < itemPagesNeeded; i++) {
            const pageItems = enabledItems.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
            const pageData: TemplateData = {
              ...newData as TemplateData,
              memoSettings: newMemoSettings,
              currentMemoPageIndex: i,
              memoPageContent: {
                items: pageItems.length > 0 ? pageItems : undefined,
                isWeatherPage: false,
              },
            }

            const newPage = generatePageFromTemplate(templateId, pageData)
            if (newPage) {
              newPage.name = itemPagesNeeded > 1 ? `旅遊提醒 ${i + 1}` : '旅遊提醒'
              // 保存 memoPageContent 到頁面
              const pageWithMemo = newPage as CanvasPage & { memoPageContent?: MemoPageContent }
              pageWithMemo.memoPageContent = {
                items: pageItems.length > 0 ? pageItems : undefined,
                isWeatherPage: false,
              }
              newMemoPages.push(newPage)
            }
          }

          // 更新頁面列表
          setGeneratedPages(prev => {
            // 分離非備忘錄頁面
            const beforeMemo = prev.slice(0, firstMemoIndex)
            // 取得最後一個備忘錄頁面之後的非備忘錄頁面
            const lastMemoIndex = memoPageIndices.length > 0 ? memoPageIndices[memoPageIndices.length - 1] : firstMemoIndex - 1
            const afterMemo = prev.slice(lastMemoIndex + 1).filter(p => p.templateKey !== 'memo')

            // 重組頁面列表
            return [...beforeMemo, ...newMemoPages, ...afterMemo]
          })

          // 計算新的當前頁面索引
          const newCurrentPageIndex = Math.min(currentPageIndex, firstMemoIndex + newMemoPages.length - 1)

          // 延遲載入頁面以等待 state 更新
          setTimeout(() => {
            setCurrentPageIndex(newCurrentPageIndex)
            if (newMemoPages[newCurrentPageIndex - firstMemoIndex]) {
              loadCanvasPage(newMemoPages[newCurrentPageIndex - firstMemoIndex])
            } else if (newMemoPages[0]) {
              loadCanvasPage(newMemoPages[0])
            }
          }, 50)
        }
        return // 已重新生成頁面，不需要繼續處理其他欄位
      }
    }

    // 檢查是否為飯店介紹頁面，需要重新生成頁面
    if (currentPage?.templateKey === 'hotel' || currentPage?.templateKey === 'hotelMulti') {
      const oldHotels = (oldData.hotels as Array<Record<string, unknown>>) || []
      const newHotels = (newData.hotels as Array<Record<string, unknown>>) || []
      const oldHotelIndex = oldData.currentHotelIndex as number | undefined
      const newHotelIndex = newData.currentHotelIndex as number | undefined

      // hotels 資料或 currentHotelIndex 有變化就重新生成頁面
      const hotelsChanged = JSON.stringify(oldHotels) !== JSON.stringify(newHotels)
      const hotelIndexChanged = oldHotelIndex !== newHotelIndex

      if ((hotelsChanged || hotelIndexChanged) && selectedStyle?.id) {
        const templateKey = currentPage.templateKey as 'hotel' | 'hotelMulti'
        const templateId = selectedStyle.templates[templateKey]
        if (templateId) {
          const newPage = generatePageFromTemplate(templateId, newData as TemplateData)

          if (newPage) {
            // 保留原始頁面 ID 和名稱
            newPage.id = currentPage.id
            newPage.name = currentPage.name

            // 更新頁面列表
            setGeneratedPages(prev => {
              const updated = [...prev]
              updated[currentPageIndex] = newPage
              return updated
            })

            // 重新載入畫布
            loadCanvasPage(newPage)
          }
        }
        return // 已重新生成頁面，不需要繼續處理其他欄位
      }
    }

    // 檢查是否為行程總覽頁面，且集合/領隊資訊有變化（從無到有需要重新生成頁面）
    if (currentPage?.templateKey === 'itinerary') {
      const hadMeetingInfo = Boolean(oldData.meetingTime || oldData.meetingPlace)
      const hasMeetingInfo = Boolean(newData.meetingTime || newData.meetingPlace)
      const hadLeaderInfo = Boolean(oldData.leaderName)
      const hasLeaderInfo = Boolean(newData.leaderName)

      // 從無到有，需要重新生成頁面以創建新元素
      const meetingInfoAdded = !hadMeetingInfo && hasMeetingInfo
      const leaderInfoAdded = !hadLeaderInfo && hasLeaderInfo
      // 從有到無，也需要重新生成頁面以移除元素
      const meetingInfoRemoved = hadMeetingInfo && !hasMeetingInfo
      const leaderInfoRemoved = hadLeaderInfo && !hasLeaderInfo

      if ((meetingInfoAdded || leaderInfoAdded || meetingInfoRemoved || leaderInfoRemoved) && selectedStyle?.id) {
        const templateId = selectedStyle.templates.itinerary
        if (templateId) {
          const newPage = generatePageFromTemplate(templateId, newData as TemplateData)

          if (newPage) {
            // 保留原始頁面 ID 和名稱
            newPage.id = currentPage.id
            newPage.name = currentPage.name

            // 更新頁面列表
            setGeneratedPages(prev => {
              const updated = [...prev]
              updated[currentPageIndex] = newPage
              return updated
            })

            // 重新載入畫布
            loadCanvasPage(newPage)
          }
        }
        return // 已重新生成頁面，不需要繼續處理其他欄位
      }
    }

    // 檢查是否為每日行程頁面，且 dailyDetails 有變化（時間軸編輯）
    if (currentPage?.templateKey === 'daily' && currentDayIndex !== undefined) {
      const oldDetails = (oldData.dailyDetails as Array<Record<string, unknown>>) || []
      const newDetails = (newData.dailyDetails as Array<Record<string, unknown>>) || []
      const oldDayData = oldDetails[currentDayIndex]
      const newDayData = newDetails[currentDayIndex]

      const oldTimeline = (oldDayData?.timeline as Array<Record<string, unknown>>) || []
      const newTimeline = (newDayData?.timeline as Array<Record<string, unknown>>) || []

      // 計算縮放因子（如果畫布是 300 DPI 版本）
      const scale = canvasWidth > 1000 ? NEW_A5_WIDTH / 559 : 1

      // 時間軸常量（需要根據縮放因子調整）
      const TIMELINE_ITEM_GAP = 36 * scale // 每項間距
      const TIMELINE_COLORS = {
        ink: '#3e3a36',
        primary: '#8e8070',
      }

      // 時間軸數量變化 - 使用增量更新（不重新生成頁面）
      if (oldTimeline.length !== newTimeline.length && canvas) {
        const oldLen = oldTimeline.length
        const newLen = newTimeline.length

        if (newLen > oldLen) {
          // === 新增項目：在最後一個項目下方添加新元素（單獨元素，不使用群組） ===
          // 優先使用圓點位置作為錨點（比時間文字更可靠，因為圓點是視覺中心）
          const lastDotObj = oldLen > 0 ? getObjectByName(`圓點${oldLen}`) : null
          const lastTimeObj = oldLen > 0 ? getObjectByName(`時間${oldLen}`) : null

          // 調試日誌
          logger.log('Adding timeline item:', {
            oldLen,
            newLen,
            lastDot: lastDotObj ? { left: (lastDotObj as fabric.FabricObject).left, top: (lastDotObj as fabric.FabricObject).top } : null,
            lastTime: lastTimeObj ? { left: (lastTimeObj as fabric.FabricObject).left, top: (lastTimeObj as fabric.FabricObject).top } : null,
          })

          // 計算新項目的起始位置
          // 往回搜尋找到第一個在有效位置的圓點作為錨點
          let baseY: number = 430 * scale  // 預設值
          let timelineX: number = 48 * scale  // 預設值

          const isValidPosition = (x: number, y: number) => {
            return x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight
          }

          let foundValidAnchor = false
          let anchorIndex = oldLen  // 從最後一個開始往回找

          // 往回搜尋有效的圓點錨點
          while (anchorIndex > 0 && !foundValidAnchor) {
            const dotObj = getObjectByName(`圓點${anchorIndex}`)
            if (dotObj && 'left' in dotObj && 'top' in dotObj) {
              const dotLeft = dotObj.left as number
              const dotTop = dotObj.top as number

              if (isValidPosition(dotLeft, dotTop)) {
                // 找到有效的圓點，計算新項目位置
                // 新項目應該在這個圓點下方 (newLen - anchorIndex) 個間距
                const stepsFromAnchor = newLen - anchorIndex
                timelineX = dotLeft - 50 * scale  // 從圓點反推時間文字 X
                baseY = (dotTop - 5 * scale) + stepsFromAnchor * TIMELINE_ITEM_GAP
                foundValidAnchor = true
                logger.log('Found valid anchor at dot', anchorIndex, ':', { dotLeft, dotTop, stepsFromAnchor, timelineX, baseY })
              } else {
                logger.log('Dot', anchorIndex, 'invalid position:', { dotLeft, dotTop })
              }
            }
            anchorIndex--
          }

          if (!foundValidAnchor) {
            // 沒找到有效錨點，使用預設值
            baseY = 430 * scale
            timelineX = 48 * scale // contentPadding(40) + 8
            logger.log('No valid anchor found, using default:', { baseY, timelineX, scale })
          }

          // 添加新的時間軸項目（單獨元素，所有尺寸都需要縮放）
          for (let idx = oldLen; idx < newLen; idx++) {
            const item = newTimeline[idx] as Record<string, unknown>
            const itemY = baseY + (idx - oldLen) * TIMELINE_ITEM_GAP

            // 計算各元素的絕對位置
            const timeLeft = timelineX
            const dotLeft = timelineX + 50 * scale
            const dotTop = itemY + 5 * scale
            const activityLeft = timelineX + 64 * scale

            logger.log(`Creating timeline item ${idx + 1}:`, {
              timelineX,
              itemY,
              scale,
              timeLeft,
              dotLeft,
              dotTop,
              activityLeft,
              dotRadius: 3 * scale,
            })

            // 時間文字
            const timeText = new fabric.Textbox(String(item.time || ''), {
              left: timeLeft,
              top: itemY,
              width: 45 * scale,
              fontSize: 10 * scale,
              fontFamily: 'Noto Sans TC',
              fontWeight: '500',
              fill: TIMELINE_COLORS.primary,
              textAlign: 'right',
              lineHeight: 1.6,
              originX: 'left',
              originY: 'top',
            })
            ;(timeText as fabric.Textbox & { name: string }).name = `時間${idx + 1}`
            canvas.add(timeText)

            // 圓點（與模板渲染器一致：使用 originX/Y = 'left'/'top'）
            const isHighlight = (item as { isHighlight?: boolean }).isHighlight
            const dot = new fabric.Circle({
              left: dotLeft,
              top: dotTop,
              radius: 3 * scale,
              fill: TIMELINE_COLORS.primary,
              stroke: 'transparent',
              strokeWidth: 0,
              opacity: isHighlight ? 1 : 0.6,
              originX: 'left',
              originY: 'top',
            })
            ;(dot as fabric.Circle & { name: string }).name = `圓點${idx + 1}`
            canvas.add(dot)

            logger.log(`Added dot ${idx + 1}:`, { left: dot.left, top: dot.top, radius: dot.radius })

            // 活動文字
            const activityText = new fabric.Textbox(String(item.activity || ''), {
              left: timelineX + 64 * scale,
              top: itemY,
              width: 350 * scale,
              fontSize: 11 * scale,
              fontFamily: 'Noto Sans TC',
              fontWeight: '400',
              fill: TIMELINE_COLORS.ink,
              textAlign: 'left',
              lineHeight: 1.5,
              originX: 'left',
              originY: 'top',
            })
            ;(activityText as fabric.Textbox & { name: string }).name = `活動${idx + 1}`
            canvas.add(activityText)
          }

          // 更新時間軸線的高度（如果不存在則創建）
          let timelineLineObj = getObjectByName('時間軸線')
          if (timelineLineObj && 'height' in timelineLineObj) {
            timelineLineObj.set('height', newLen * TIMELINE_ITEM_GAP)
          } else {
            // 時間軸線不存在，創建一個新的
            // 時間軸線位置：在圓點左邊 2px（timelineX + 50 是圓點位置，線在 timelineX + 52）
            const lineX = timelineX + 52 * scale
            const lineY = baseY + 12 * scale  // 起始點向下偏移 12px
            const timelineLine = new fabric.Rect({
              left: lineX,
              top: lineY,
              width: 1 * scale,
              height: newLen * TIMELINE_ITEM_GAP,
              fill: TIMELINE_COLORS.primary,
              stroke: 'transparent',
              strokeWidth: 0,
              opacity: 0.25,
              originX: 'left',
              originY: 'top',
              selectable: false,
            })
            ;(timelineLine as fabric.Rect & { name: string }).name = '時間軸線'
            canvas.add(timelineLine)
            // 把線移到底層，讓圓點在線上面
            canvas.sendObjectToBack(timelineLine)
            logger.log('Created new timeline line:', { lineX, lineY, height: newLen * TIMELINE_ITEM_GAP })
          }
          canvas.renderAll()

        } else if (newLen < oldLen) {
          // === 刪除項目：移除單獨元素 ===
          for (let idx = newLen; idx < oldLen; idx++) {
            removeObjectByName(`時間${idx + 1}`)
            removeObjectByName(`圓點${idx + 1}`)
            removeObjectByName(`活動${idx + 1}`)
          }

          // 更新時間軸線的高度（最小高度也需要縮放）
          const timelineLineObj = getObjectByName('時間軸線')
          if (timelineLineObj && 'height' in timelineLineObj) {
            timelineLineObj.set('height', Math.max(newLen * TIMELINE_ITEM_GAP, 36 * scale))
            canvas.renderAll()
          }
        }

        canvas.renderAll()
      }

      // 2025-01-22 修改：不再自動更新畫布上的時間軸文字
      // 原因：用戶希望「載入行程後，畫布內容就固定了」
      // 如果需要更新，用戶應該手動在畫布上編輯或重新生成頁面
      // 保留：新增時間軸項目的邏輯（上方的 newLen > oldLen 處理）
    }

    // 2025-01-22 修改：停止自動同步 templateData 到畫布元素
    // 原因：用戶明確要求「載入行程就只有這麼一次，不要再不斷地幫我把版本回朔」
    // 畫布上的編輯應該被保留，不被 templateData 覆蓋
    //
    // 原本的邏輯會在 templateData 變化時自動更新畫布元素文字：
    // - 每日標題、餐食、封面資訊、集合/領隊資訊等
    // 現在這些都不再自動更新，用戶的畫布編輯會被保留
    //
    // 如果用戶想重新從行程載入資料，應該：
    // 1. 刪除該頁面
    // 2. 重新添加相同類型的頁面
    // 或
    // 1. 手動在畫布上編輯文字
  }, [templateData, isCanvasReady, updateElementByName, generatedPages, currentPageIndex, currentDayIndex, selectedStyle, loadCanvasPage])

  // ============================================
  // Image Upload Handler
  // ============================================
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        await addImage(dataUrl)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [addImage])

  // ============================================
  // Keyboard Shortcuts
  // ============================================
  useEffect(() => {
    if (!selectedDesignType) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        redo()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        copySelected()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteClipboard()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault()
        cutSelected()
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
        return
      }

      // 方向鍵移動選取的元素
      const moveStep = e.shiftKey ? 10 : 1 // Shift 按住時移動 10px
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveSelected(0, -moveStep)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveSelected(0, moveStep)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        moveSelected(-moveStep, 0)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        moveSelected(moveStep, 0)
        return
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        zoomIn()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        zoomOut()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        resetZoom()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedDesignType, handleSave, undo, redo, copySelected, pasteClipboard, cutSelected, deleteSelected, moveSelected, zoomIn, zoomOut, resetZoom])

  // ============================================
  // 滾輪縮放（Ctrl/Cmd + 滾輪）
  // ============================================
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container || !selectedDesignType) return

    const handleWheel = (e: WheelEvent) => {
      // 只有按住 Ctrl/Cmd 時才縮放
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        setZoom(zoom + delta)
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [selectedDesignType, zoom, setZoom])

  // ============================================
  // Space + 拖曳平移畫面
  // ============================================
  useEffect(() => {
    if (!selectedDesignType) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 在輸入框中不觸發
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      // 按下 Space 進入平移模式
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsPanMode(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // 放開 Space 退出平移模式
      if (e.code === 'Space') {
        setIsPanMode(false)
        panStateRef.current.isPanning = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedDesignType])

  // Pan mode 滑鼠拖曳處理
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || !isPanMode) return

    const handleMouseDown = (e: MouseEvent) => {
      // 只在平移模式下且是左鍵點擊
      if (!isPanMode || e.button !== 0) return

      e.preventDefault()
      panStateRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: scrollContainer.scrollLeft,
        scrollTop: scrollContainer.scrollTop,
      }
      scrollContainer.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!panStateRef.current.isPanning) return

      const dx = e.clientX - panStateRef.current.startX
      const dy = e.clientY - panStateRef.current.startY
      scrollContainer.scrollLeft = panStateRef.current.scrollLeft - dx
      scrollContainer.scrollTop = panStateRef.current.scrollTop - dy
    }

    const handleMouseUp = () => {
      panStateRef.current.isPanning = false
      scrollContainer.style.cursor = isPanMode ? 'grab' : ''
    }

    scrollContainer.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    // 進入平移模式時改變游標
    scrollContainer.style.cursor = 'grab'

    return () => {
      scrollContainer.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      scrollContainer.style.cursor = ''
    }
  }, [isPanMode])

  // ============================================
  // Unsaved Changes Warning
  // ============================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '有未儲存的變更，確定要離開嗎？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // ============================================
  // 尚未選擇設計類型：顯示選擇器或載入中
  // ============================================
  if (!selectedDesignType) {
    // 如果正在檢查是否有現有存檔，顯示載入畫面
    // 這樣編輯現有設計時不會閃過選擇器頁面
    if (isCheckingExisting) {
      return (
        <div
          className="fixed inset-0 flex items-center justify-center bg-background transition-all duration-300"
          style={{ left: sidebarWidth }}
        >
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-morandi-secondary">載入設計中...</p>
          </div>
        </div>
      )
    }

    return (
      <DesignTypeSelector
        onSelect={handleSelectDesignType}
        onBrochureStart={handleBrochureStart}
        sidebarWidth={sidebarWidth}
        workspaceId={workspaceId}
        preselectedTourId={urlTourId}
        preselectedItineraryId={urlItineraryId}
      />
    )
  }

  // ============================================
  // 手冊類型：顯示模板選擇器（已整合到上方，保留用於編輯現有設計）
  // ============================================
  if (showTemplateSelector) {
    return (
      <TemplateSelector
        itineraryId={itineraryId}
        tourId={tourId}
        onBack={() => {
          setShowTemplateSelector(false)
          setSelectedDesignType(null)
        }}
        onComplete={(pages, itinData, style) => handleTemplateComplete(pages, itinData as Record<string, unknown> | null, style)}
        sidebarWidth={sidebarWidth}
      />
    )
  }

  // ============================================
  // Error Display
  // ============================================
  if (error) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-background"
        style={{ left: sidebarWidth }}
      >
        <div className="text-center">
          <p className="text-morandi-red mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重新載入</Button>
        </div>
      </div>
    )
  }

  // ============================================
  // 計算縮放以適應畫面
  // ============================================
  // zoom 是用戶控制的縮放比例（從 hook 來）
  // 我們直接使用 zoom 作為顯示縮放，不再乘以 fitZoom
  // 這樣縮放百分比顯示才會正確
  const displayZoom = zoom

  // ============================================
  // Render Editor
  // ============================================
  return (
    <div
      className="fixed inset-0 flex flex-col bg-morandi-container/30 transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      {/* Loading Overlay */}
      <LoadingOverlay
        isLoading={isLoading}
        stage={loadingStage}
        progress={loadingProgress}
        isSaving={isSaving}
        documentName={storeDocument?.name}
      />

      {/* Saving Indicator */}
      <SavingIndicator isSaving={isSaving} />

      {/* Header - 72px */}
      <header className="h-[72px] bg-card border-b border-border px-4 flex items-center gap-3 shrink-0">
        {/* 返回按鈕 - 回到設計列表 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/design')}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          返回
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Logo & Title */}
        <div className="flex items-center gap-2">
          <Palette size={20} className="text-morandi-gold" />
          <span className="font-semibold text-morandi-primary">{selectedDesignType.name}</span>
          <span className="text-sm text-morandi-secondary">{selectedDesignType.description}</span>
          <UnsavedIndicator isDirty={isDirty} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* 面板切換 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPageList(!showPageList)}
          className={cn(!showPageList && 'text-morandi-muted')}
          title="頁面列表"
        >
          <LayoutList size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          className={cn(!showLeftPanel && 'text-morandi-muted')}
          title="元素庫"
        >
          <PanelLeftClose size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRightPanel(!showRightPanel)}
          className={cn(!showRightPanel && 'text-morandi-muted')}
          title="屬性面板"
        >
          <PanelRightClose size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={cn(!showLayerPanel && 'text-morandi-muted')}
          title="圖層面板"
        >
          <Layers size={16} />
        </Button>

        {/* 雙頁模式切換（只在手冊類型且有多頁時顯示） */}
        {selectedDesignType?.id.startsWith('brochure-') && generatedPages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDualPageMode(!isDualPageMode)}
            className={cn(isDualPageMode && 'bg-morandi-gold/10 text-morandi-gold')}
            title="雙頁預覽模式"
          >
            <Columns2 size={16} />
          </Button>
        )}

        <div className="w-px h-6 bg-border" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm text-morandi-secondary w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty || !entityId}
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Save size={14} />
            儲存
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={generatedPages.length === 0}
            className="gap-1"
          >
            <FileDown size={14} />
            列印/匯出
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar
        selectedElementId={selectedObjectIds[0] || null}
        selectedElement={selectedObject as unknown as CanvasElement}
        selectedCount={selectedObjectIds.length}
        clipboard={[]}
        onAddText={addText}
        onAddRectangle={addRectangle}
        onAddCircle={addCircle}
        onAddEllipse={addEllipse}
        onAddTriangle={addTriangle}
        onAddLine={addLine}
        onAddImage={async (file: File) => {
          // 將 File 轉換為 dataURL 再呼叫 addImage
          const reader = new FileReader()
          reader.onload = async () => {
            const dataUrl = reader.result as string
            await addImage(dataUrl)
          }
          reader.readAsDataURL(file)
        }}
        onCopy={copySelected}
        onPaste={pasteClipboard}
        onCut={cutSelected}
        onDelete={deleteSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onToggleLock={toggleLock}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onAlignLeft={alignLeft}
        onAlignCenterH={alignCenterH}
        onAlignRight={alignRight}
        onAlignTop={alignTop}
        onAlignCenterV={alignCenterV}
        onAlignBottom={alignBottom}
        onDistributeH={distributeH}
        onDistributeV={distributeV}
        onFlipHorizontal={flipHorizontal}
        onFlipVertical={flipVertical}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page List Sidebar - 手冊類型且開啟時顯示 */}
        {showPageList && selectedDesignType?.id.startsWith('brochure-') && generatedPages.length > 0 && (
          <PageListSidebar
            pages={generatedPages}
            currentPageIndex={currentPageIndex}
            selectedStyle={selectedStyle}
            totalDays={(templateData as TemplateData | null)?.dailyItineraries?.length || 0}
            memoSettings={memoSettings}
            usedMemoItemIds={usedMemoItemIds}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onAddMemoPage={handleAddMemoPage}
            onAddDailyPages={handleAddDailyPages}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
            onReorderPages={handleReorderPages}
          />
        )}

        {/* Left Panel - Element Library */}
        {showLeftPanel && (
          <ElementLibrary
            onAddLine={addLine}
            onAddShape={(type) => {
              if (type === 'rectangle') addRectangle()
              else if (type === 'circle') addCircle()
            }}
            onAddText={addText}
            onAddSticker={(stickerId) => {
              const sticker = STICKER_PATHS[stickerId]
              if (sticker) {
                addSticker(sticker.path, {
                  fill: sticker.defaultColor,
                  viewBox: sticker.viewBox,
                })
              }
            }}
            onAddIcon={(iconName) => {
              addIcon(iconName)
            }}
            onAddImage={(imageUrl) => {
              addImage(imageUrl)
            }}
            onAddColorfulIcon={(iconName) => {
              // 彩色圖標保持原色且使用較大的尺寸
              addIcon(iconName, { size: 80, keepOriginalColor: true })
            }}
            onAddQRCode={(dataUrl) => {
              // QR Code 直接作為圖片插入
              addImage(dataUrl)
            }}
            onAddTimeline={addTimeline}
            onAddTimelinePoint={addTimelinePoint}
            isTimelineSelected={
              selectedObject != null &&
              (selectedObject as unknown as { data?: { timelineId?: string } }).data?.timelineId != null
            }
          />
        )}

        {/* Canvas Area */}
        <main ref={canvasContainerRef} className="flex-1 relative overflow-hidden bg-morandi-container/20">
          {/* Canvas Container - 可滾動容器 */}
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-auto"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* 內部包裝 - 使用 inline-flex 讓容器跟隨內容大小擴展 */}
            <div
              style={{
                display: 'inline-flex',
                minWidth: '100%',
                minHeight: '100%',
                padding: '32px',
                boxSizing: 'border-box',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
            {isDualPageMode ? (
              /* 雙頁預覽模式 */
              <DualPagePreview
                pages={generatedPages}
                currentPageIndex={currentPageIndex}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                zoom={displayZoom * 0.6}
                onSelectPage={(index) => {
                  setIsDualPageMode(false)
                  handleSelectPage(index)
                }}
              />
            ) : (
              /* 單頁編輯模式 */
              <CanvasWithRulers
                canvas={canvas}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                zoom={displayZoom}
                printMode={selectedDesignType?.category === 'print'}
                dpi={300}
              >
                <div
                  className="bg-white shadow-lg rounded"
                  style={{
                    width: canvasWidth,
                    height: canvasHeight,
                    transform: `scale(${displayZoom})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <canvas ref={canvasRef} />
                </div>
              </CanvasWithRulers>
            )}
            </div>
          </div>

          {/* Mask Edit Mode Indicator */}
          {isEditingMask && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-morandi-gold text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
              <span className="font-medium">遮罩編輯模式</span>
              <span className="ml-2 opacity-80">拖曳移動圖片 · 滾輪縮放 · Esc 退出</span>
            </div>
          )}

          {/* Quick Actions (bottom left) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImageUpload}
              className="gap-1 bg-white"
            >
              <Upload size={14} />
              上傳圖片
            </Button>
          </div>

          {/* Canvas Info (bottom right) */}
          <div className="absolute bottom-4 right-4 bg-card rounded-lg shadow-lg border border-border px-3 py-2 text-sm text-morandi-secondary">
            {selectedDesignType?.category === 'print' ? (
              <>
                {selectedDesignType?.id === 'brochure-a5' ? '148 × 210 mm (A5)' : '210 × 297 mm (A4)'}
                <span className="text-xs ml-1 opacity-60">含出血</span>
              </>
            ) : (
              `${canvasWidth} × ${canvasHeight} px`
            )}
          </div>
        </main>

        {/* Right Panel - Properties & Template Data */}
        {showRightPanel && (
          <div className="w-64 h-full bg-white border-l border-border flex flex-col">
            <Tabs defaultValue={selectedObject ? 'properties' : 'template'} className="flex-1 min-h-0 flex flex-col">
              <TabsList className="grid grid-cols-2 mx-2 mt-2">
                <TabsTrigger value="properties" className="text-xs">元素屬性</TabsTrigger>
                <TabsTrigger value="template" className="text-xs">模板數據</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="flex-1 min-h-0 overflow-hidden m-0">
                <PropertiesPanel
                  canvas={canvas}
                  selectedObject={selectedObject}
                  onUpdate={() => {}}
                  onImageFill={(obj) => {
                    setMaskTargetShape(obj)
                    setShowImageMaskFill(true)
                  }}
                />
              </TabsContent>

              <TabsContent value="template" className="flex-1 min-h-0 overflow-hidden m-0">
                <TemplateDataPanel
                  templateData={templateData}
                  onTemplateDataChange={handleTemplateDataChange}
                  onUploadCoverImage={() => setShowCoverUpload(true)}
                  onAdjustCoverPosition={() => {
                    const existingCoverImage = templateData?.coverImage as string | undefined
                    if (existingCoverImage) {
                      setPendingImageUrl(existingCoverImage)
                      setShowImageEditor(true)
                    }
                  }}
                  onUploadDailyCoverImage={() => setShowDailyCoverUpload(true)}
                  onAdjustDailyCoverPosition={() => {
                    if (currentDayIndex === undefined) return
                    const dailyDetails = (templateData?.dailyDetails as Array<{ coverImage?: string }>) || []
                    const existingCoverImage = dailyDetails[currentDayIndex]?.coverImage
                    if (existingCoverImage) {
                      setPendingImageUrl(existingCoverImage)
                      setShowDailyImageEditor(true)
                    }
                  }}
                  currentPageType={generatedPages[currentPageIndex]?.templateKey}
                  currentDayIndex={currentDayIndex}
                  pages={generatedPages.map(p => ({ id: p.id, name: p.name, templateKey: p.templateKey }))}
                  onApplyToc={handleApplyToc}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Layer Panel */}
        {showLayerPanel && (
          <LayerPanel
            canvas={canvas}
            selectedObjectIds={selectedObjectIds}
            onSelectObject={selectObjectById}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
          />
        )}
      </div>

      {/* 封面圖片選擇對話框 */}
      <ImagePickerDialog
        open={showCoverUpload}
        onOpenChange={setShowCoverUpload}
        title="選擇封面圖片"
        description="上傳圖片或從 Unsplash 搜尋免費圖片，之後可調整顯示位置。"
        value={templateData?.coverImage as string | undefined}
        onSelect={handleImageUploaded}
        bucket="city-backgrounds"
        filePrefix="brochure-cover"
        aspectRatio={495 / 350}
      />

      {/* 封面圖片編輯器 */}
      {pendingImageUrl && (
        <ImageEditor
          open={showImageEditor}
          onClose={() => {
            setShowImageEditor(false)
            setPendingImageUrl(null)
          }}
          imageSrc={pendingImageUrl}
          aspectRatio={495 / 350}
          initialSettings={templateData?.coverImagePosition as ImageEditorSettings | undefined}
          onSave={handleImagePositionSaved}
          showAi={false}
        />
      )}

      {/* 每日行程封面圖片選擇對話框 */}
      <ImagePickerDialog
        open={showDailyCoverUpload}
        onOpenChange={setShowDailyCoverUpload}
        title="選擇當日封面圖片"
        description="上傳圖片或從 Unsplash 搜尋免費圖片，作為當日行程的封面。"
        value={currentDayIndex !== undefined
          ? ((templateData?.dailyDetails as Array<{ coverImage?: string }>) || [])[currentDayIndex]?.coverImage
          : undefined
        }
        onSelect={handleDailyImageUploaded}
        bucket="city-backgrounds"
        filePrefix="brochure-daily-cover"
        aspectRatio={16 / 9}
      />

      {/* 每日行程封面圖片編輯器 */}
      {pendingImageUrl && (
        <ImageEditor
          open={showDailyImageEditor}
          onClose={() => {
            setShowDailyImageEditor(false)
            setPendingImageUrl(null)
          }}
          imageSrc={pendingImageUrl}
          aspectRatio={16 / 9}
          initialSettings={
            currentDayIndex !== undefined
              ? ((templateData?.dailyDetails as Array<{ coverImagePosition?: ImageEditorSettings }>) || [])[currentDayIndex]?.coverImagePosition
              : undefined
          }
          onSave={handleDailyImagePositionSaved}
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

    </div>
  )
}

// BrochurePrintPreview 已移除 - 改用 handleExportPDF 直接開新視窗
