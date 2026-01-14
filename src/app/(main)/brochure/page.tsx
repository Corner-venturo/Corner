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

import { useEffect, useCallback, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import * as fabric from 'fabric'
import {
  Save,
  Clock,
  ZoomIn,
  ZoomOut,
  Palette,
  BookOpen,
  Instagram,
  Image as ImageIcon,
  ArrowLeft,
  PanelLeftClose,
  PanelRightClose,
  Upload,
  LayoutList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentStore, type BrochureEntityType } from '@/stores/document-store'
import { useBrochureEditorV2 } from '@/features/designer/hooks/useBrochureEditorV2'
import { LoadingOverlay, SavingIndicator, UnsavedIndicator } from '@/features/designer/components/LoadingOverlay'
import { VersionHistory } from '@/features/designer/components/VersionHistory'
import { ElementLibrary } from '@/features/designer/components/ElementLibrary'
import { EditorToolbar } from '@/features/designer/components/EditorToolbar'
import { PropertiesPanel } from '@/features/designer/components/PropertiesPanel'
import { TemplateDataPanel } from '@/features/designer/components/TemplateDataPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplateSelector } from '@/features/designer/components/TemplateSelector'
import { PageListSidebar } from '@/features/designer/components/PageListSidebar'
import type { CanvasPage } from '@/features/designer/components/types'
import type { StyleSeries, TemplateData } from '@/features/designer/templates/engine'
import { generatePageFromTemplate, styleSeries, getTemplateById } from '@/features/designer/templates/engine'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageUploader } from '@/components/ui/image-uploader'
import { UnifiedImageEditor } from '@/components/designer/UnifiedImageEditor'
import type { ImagePositionSettings } from '@/features/designer/components/types'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_WIDTH_EXPANDED_PX,
  SIDEBAR_WIDTH_COLLAPSED_PX,
} from '@/lib/constants/layout'
import type { CanvasElement } from '@/features/designer/components/types'
import { STICKER_PATHS } from '@/features/designer/components/core/sticker-paths'

// ============================================
// 設計類型定義
// ============================================
interface DesignType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  width: number
  height: number
  category: 'print' | 'social' | 'banner'
}

const DESIGN_TYPES: DesignType[] = [
  {
    id: 'brochure-a5',
    name: '手冊 A5',
    description: '148 x 210 mm (直式)',
    icon: <BookOpen size={32} />,
    width: 559,
    height: 794,
    category: 'print',
  },
  {
    id: 'brochure-a4',
    name: '手冊 A4',
    description: '210 x 297 mm (直式)',
    icon: <BookOpen size={32} />,
    width: 794,
    height: 1123,
    category: 'print',
  },
  {
    id: 'ig-square',
    name: 'IG 正方形',
    description: '1080 x 1080 px',
    icon: <Instagram size={32} />,
    width: 1080,
    height: 1080,
    category: 'social',
  },
  {
    id: 'ig-portrait',
    name: 'IG 直式',
    description: '1080 x 1350 px',
    icon: <Instagram size={32} />,
    width: 1080,
    height: 1350,
    category: 'social',
  },
  {
    id: 'ig-story',
    name: 'IG 限時動態',
    description: '1080 x 1920 px',
    icon: <Instagram size={32} />,
    width: 1080,
    height: 1920,
    category: 'social',
  },
  {
    id: 'banner-wide',
    name: '橫幅布條',
    description: '1200 x 400 px',
    icon: <ImageIcon size={32} />,
    width: 1200,
    height: 400,
    category: 'banner',
  },
  {
    id: 'banner-square',
    name: '方形廣告',
    description: '800 x 800 px',
    icon: <ImageIcon size={32} />,
    width: 800,
    height: 800,
    category: 'banner',
  },
]

// ============================================
// 設計類型選擇器組件
// ============================================
function DesignTypeSelector({
  onSelect,
  sidebarWidth,
}: {
  onSelect: (type: DesignType) => void
  sidebarWidth: string
}) {
  const categories = [
    { id: 'print', name: '印刷品', description: '手冊、傳單' },
    { id: 'social', name: '社群媒體', description: 'Instagram、Facebook' },
    { id: 'banner', name: '廣告橫幅', description: '網站廣告、布條' },
  ]

  return (
    <div
      className="fixed inset-0 bg-background transition-all duration-300 overflow-auto"
      style={{ left: sidebarWidth }}
    >
      {/* Header */}
      <div className="h-[72px] bg-background border-b border-border flex items-center px-6">
        <div className="flex items-center gap-3">
          <Palette size={24} className="text-morandi-gold" />
          <h1 className="text-xl font-semibold text-morandi-primary">Venturo 設計工具</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-morandi-primary mb-2">選擇設計類型</h2>
          <p className="text-morandi-secondary">選擇您要製作的設計，我們會自動配置最佳畫布尺寸</p>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="mb-8">
            <h3 className="text-lg font-semibold text-morandi-primary mb-2">{category.name}</h3>
            <p className="text-sm text-morandi-secondary mb-4">{category.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DESIGN_TYPES.filter((t) => t.category === category.id).map((type) => (
                <button
                  key={type.id}
                  onClick={() => onSelect(type)}
                  className={cn(
                    'flex flex-col items-center p-6 rounded-xl border-2 border-border',
                    'hover:border-morandi-gold hover:bg-morandi-gold/5 transition-all',
                    'text-left group cursor-pointer'
                  )}
                >
                  <div className="text-morandi-gold mb-3 group-hover:scale-110 transition-transform">
                    {type.icon}
                  </div>
                  <h4 className="font-semibold text-morandi-primary mb-1">{type.name}</h4>
                  <p className="text-sm text-morandi-secondary">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 主頁面
// ============================================
export default function DesignerPage() {
  const searchParams = useSearchParams()

  // 支援多種參數格式
  const tourId = searchParams.get('tour_id') || searchParams.get('tourId')
  const packageId = searchParams.get('package_id') || searchParams.get('packageId')
  const itineraryId = searchParams.get('itinerary_id') || searchParams.get('itineraryId')

  // 決定使用哪個 entity
  const { entityId, entityType } = useMemo((): { entityId: string | null; entityType: BrochureEntityType } => {
    if (tourId) return { entityId: tourId, entityType: 'tour' }
    if (packageId) return { entityId: packageId, entityType: 'package' }
    if (itineraryId) return { entityId: itineraryId, entityType: 'itinerary' }
    return { entityId: null, entityType: 'tour' }
  }, [tourId, packageId, itineraryId])

  const { user, sidebarCollapsed } = useAuthStore()
  const workspaceId = user?.workspace_id

  // UI 狀態
  const [selectedDesignType, setSelectedDesignType] = useState<DesignType | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [generatedPages, setGeneratedPages] = useState<CanvasPage[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [templateData, setTemplateData] = useState<Record<string, unknown> | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleSeries | null>(null)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showPageList, setShowPageList] = useState(true)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)

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
    addLine,
    addImage,
    addSticker,
    selectedObjectIds,
    deleteSelected,
    copySelected,
    pasteClipboard,
    cutSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    toggleLock,
    undo,
    redo,
    canUndo,
    canRedo,
    saveCurrentPageHistory,
    loadPageHistory,
    initPageHistory,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useBrochureEditorV2({
    width: canvasWidth,
    height: canvasHeight,
  })

  // 側邊欄寬度
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX

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
  // 雙擊封面占位框時開啟上傳對話框/位置編輯器
  // ============================================
  useEffect(() => {
    if (!canvas) return

    const handleDoubleClick = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      const target = e.target
      if (!target) return

      // 檢查是否為封面占位框或封面圖片
      const elementData = (target as fabric.FabricObject & { data?: { elementId?: string } }).data
      if (elementData?.elementId === 'el-cover-placeholder' || elementData?.elementId === 'el-cover-image') {
        // 如果已有封面圖片，直接開啟位置編輯器
        const existingCoverImage = templateData?.coverImage as string | undefined
        if (existingCoverImage) {
          setPendingImageUrl(existingCoverImage)
          setShowImageEditor(true)
        } else {
          // 沒有圖片，開啟上傳對話框
          setShowCoverUpload(true)
        }
      }
    }

    canvas.on('mouse:dblclick', handleDoubleClick)

    return () => {
      canvas.off('mouse:dblclick', handleDoubleClick)
    }
  }, [canvas, templateData?.coverImage])

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
  const handleImagePositionSaved = useCallback(async (result: {
    position?: ImagePositionSettings
  }) => {
    if (!selectedStyle || !pendingImageUrl) return

    // 更新 templateData 中的封面圖片和位置
    const newTemplateData = {
      ...templateData,
      coverImage: pendingImageUrl,
      coverImagePosition: result.position || { x: 50, y: 50, scale: 1 },
    }
    setTemplateData(newTemplateData)

    // 重新生成所有使用 coverImage 的頁面（cover 和 toc）
    const newPages = generatedPages.map((page) => {
      // 判斷這個頁面是否需要重新生成（使用 coverImage）
      const templateKey = page.templateKey
      if (templateKey === 'cover' || templateKey === 'toc') {
        const templateId = selectedStyle.templates[templateKey as keyof typeof selectedStyle.templates]
        if (templateId) {
          return generatePageFromTemplate(templateId, newTemplateData as Parameters<typeof generatePageFromTemplate>[1])
        }
      }
      return page
    })

    // 更新 generatedPages
    setGeneratedPages(newPages)

    // 重新渲染當前頁面
    const currentPage = newPages[currentPageIndex]
    if (currentPage) {
      await loadCanvasPage(currentPage)
    }

    // 清理狀態
    setPendingImageUrl(null)
    setShowImageEditor(false)
  }, [selectedStyle, templateData, loadCanvasPage, generatedPages, currentPageIndex, pendingImageUrl])

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

    // 如果目標頁面有儲存的 fabricData，優先使用它
    if (targetPage?.fabricData) {
      await loadCanvasData(targetPage.fabricData)
      // 載入該頁面的歷史記錄
      loadPageHistory(targetPage.id)
    } else if (targetPage) {
      // 否則使用原始元素重新渲染
      await loadCanvasPage(targetPage)
      // 初始化該頁面的歷史（新頁面）
      initPageHistory(targetPage.id)
    }
  }, [generatedPages, currentPageIndex, exportCanvasData, loadCanvasData, loadCanvasPage, saveCurrentPageHistory, loadPageHistory, initPageHistory])

  const handleAddPage = useCallback(async (templateKey: string) => {
    if (!selectedStyle || !templateData) return

    // 根據模板 key 找到對應的模板 ID
    const templateId = selectedStyle.templates[templateKey as keyof typeof selectedStyle.templates]
    if (!templateId) return

    // 保存當前頁面的歷史
    saveCurrentPageHistory()

    // 生成新頁面
    const newPage = generatePageFromTemplate(templateId, templateData as Parameters<typeof generatePageFromTemplate>[1])

    // 加到頁面列表
    setGeneratedPages(prev => [...prev, newPage])

    // 切換到新頁面
    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    await loadCanvasPage(newPage)

    // 初始化新頁面的歷史
    initPageHistory(newPage.id)
  }, [selectedStyle, templateData, generatedPages.length, loadCanvasPage, saveCurrentPageHistory, initPageHistory])

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

  // ============================================
  // 選擇設計類型
  // ============================================
  const handleSelectDesignType = useCallback(async (type: DesignType) => {
    setSelectedDesignType(type)

    // 如果是手冊類型，先檢查是否有存檔
    if (type.id.startsWith('brochure-')) {
      if (entityId && workspaceId) {
        try {
          // 先嘗試載入現有文件
          await loadOrCreateDocument('brochure', entityId, workspaceId, entityType)

          // 載入完成後，檢查 store 中的 currentVersion
          // 注意：這裡需要直接從 store 取得最新狀態
          const { currentVersion: loadedVersion } = useDocumentStore.getState()

          if (loadedVersion) {
            // 有存檔，跳過模板選擇器，直接進入編輯器
            // currentVersion 會在 useEffect 中被處理並載入畫布
            return
          }
        } catch (err) {
          logger.error('Failed to load document:', err)
        }
      }

      // 沒有存檔或載入失敗，顯示模板選擇器
      setShowTemplateSelector(true)
      return
    }

    // 其他類型直接進入編輯器
    if (entityId && workspaceId) {
      try {
        await loadOrCreateDocument('brochure', entityId, workspaceId, entityType)
      } catch (err) {
        logger.error('Failed to load document:', err)
      }
    }
  }, [entityId, entityType, workspaceId, loadOrCreateDocument])

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

    // 如果有 entityId，載入或建立文件
    if (entityId && workspaceId) {
      try {
        await loadOrCreateDocument('brochure', entityId, workspaceId, entityType)
      } catch (err) {
        logger.error('Failed to load document:', err)
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
      }
      const savedPages = versionData.pages as SavedPage[]
      const savedPageIndex = typeof versionData.currentPageIndex === 'number' ? versionData.currentPageIndex : 0
      const savedTemplateData = versionData.templateData as Record<string, unknown> | null
      const savedStyleId = versionData.styleId as string | null

      // 還原頁面資料
      const restoredPages: CanvasPage[] = savedPages.map(page => ({
        id: page.id,
        name: page.name,
        templateKey: page.templateKey,
        width: page.width,
        height: page.height,
        backgroundColor: page.backgroundColor,
        elements: page.elements,
      }))

      setGeneratedPages(restoredPages)
      setCurrentPageIndex(savedPageIndex)
      if (savedTemplateData) {
        setTemplateData(savedTemplateData)
      }

      // 還原選擇的風格
      if (savedStyleId) {
        const style = styleSeries.find(s => s.id === savedStyleId)
        if (style) {
          setSelectedStyle(style)
        }
      }

      // 載入當前頁面的畫布資料
      const currentPageData = savedPages[savedPageIndex]
      if (currentPageData?.fabricData) {
        loadCanvasData(currentPageData.fabricData).then(() => {
          setLoadingStage('idle', 100)
          // 初始化當前頁面的歷史記錄
          initPageHistory(currentPageData.id)
        })
      } else if (restoredPages[savedPageIndex]) {
        // 如果沒有 fabricData，使用 elements 重新渲染
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
  }, [isCanvasReady, currentVersion, loadCanvasData, loadCanvasPage, setLoadingStage, initPageHistory])

  // ============================================
  // Load Generated Pages
  // ============================================
  useEffect(() => {
    if (!isCanvasReady || generatedPages.length === 0) return
    // 如果有已存的版本，不覆蓋
    if (currentVersion) return

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
      pages: updatedPages.map(page => ({
        id: page.id,
        name: page.name,
        templateKey: page.templateKey,
        width: page.width,
        height: page.height,
        backgroundColor: page.backgroundColor,
        elements: page.elements, // 原始元素資料
        fabricData: (page as { fabricData?: Record<string, unknown> }).fabricData, // Fabric.js 畫布資料
      })),
      currentPageIndex,
      templateData: templateData || null,
      styleId: selectedStyle?.id || null,
    }

    await saveVersion(documentData as unknown as Parameters<typeof saveVersion>[0])

    // 更新本地的 generatedPages（包含 fabricData）
    setGeneratedPages(updatedPages as CanvasPage[])
  }, [isCanvasReady, isSaving, exportCanvasData, saveVersion, generatedPages, currentPageIndex, templateData, selectedStyle])

  // ============================================
  // Template Data Change Handler
  // 當用戶修改模板數據時，重新渲染當前頁面
  // ============================================
  const handleTemplateDataChange = useCallback(async (newData: Record<string, unknown>) => {
    setTemplateData(newData)

    // 如果有選擇的模板風格，重新生成當前頁面
    if (selectedStyle && generatedPages.length > 0 && isCanvasReady) {
      const currentPage = generatedPages[currentPageIndex]
      if (!currentPage?.templateKey) return

      // 根據 templateKey 找到對應的模板 ID
      const templateKey = currentPage.templateKey as keyof typeof selectedStyle.templates
      const templateId = selectedStyle.templates[templateKey]
      if (!templateId) return

      // 重新生成頁面
      try {
        const newPage = generatePageFromTemplate(templateId, newData as TemplateData)
        if (newPage) {
          // 更新頁面列表
          const newPages = [...generatedPages]
          newPages[currentPageIndex] = {
            ...newPage,
            id: currentPage.id, // 保持原有 ID
          }
          setGeneratedPages(newPages)

          // 重新渲染畫布
          await loadCanvasPage(newPage)
        }
      } catch (err) {
        logger.error('Failed to regenerate page:', err)
      }
    }
  }, [selectedStyle, generatedPages, currentPageIndex, isCanvasReady, loadCanvasPage])

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
  }, [selectedDesignType, handleSave, undo, redo, copySelected, pasteClipboard, cutSelected, deleteSelected, zoomIn, zoomOut, resetZoom])

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
  // 尚未選擇設計類型：顯示選擇器
  // ============================================
  if (!selectedDesignType) {
    return (
      <DesignTypeSelector
        onSelect={handleSelectDesignType}
        sidebarWidth={sidebarWidth}
      />
    )
  }

  // ============================================
  // 手冊類型：顯示模板選擇器
  // ============================================
  if (showTemplateSelector) {
    return (
      <TemplateSelector
        itineraryId={itineraryId}
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
        {/* 返回按鈕 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedDesignType(null)}
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
          {entityId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              className="gap-1"
            >
              <Clock size={14} />
              版本
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty || !entityId}
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Save size={14} />
            儲存
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar
        selectedElementId={selectedObjectIds[0] || null}
        selectedElement={selectedObject as unknown as CanvasElement}
        clipboard={[]}
        onAddText={addText}
        onAddRectangle={addRectangle}
        onAddCircle={addCircle}
        onCopy={copySelected}
        onPaste={pasteClipboard}
        onCut={cutSelected}
        onDelete={deleteSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onToggleLock={toggleLock}
        onAlignLeft={alignLeft}
        onAlignCenterH={alignCenterH}
        onAlignRight={alignRight}
        onAlignTop={alignTop}
        onAlignCenterV={alignCenterV}
        onAlignBottom={alignBottom}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page List Sidebar - 手冊類型且開啟時顯示 */}
        {showPageList && selectedDesignType?.id.startsWith('brochure-') && generatedPages.length > 0 && (
          <PageListSidebar
            pages={generatedPages}
            currentPageIndex={currentPageIndex}
            selectedStyle={selectedStyle}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
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
          />
        )}

        {/* Canvas Area */}
        <main className="flex-1 relative overflow-hidden bg-morandi-container/20">
          {/* Canvas Container */}
          <div className="absolute inset-0 overflow-auto flex items-center justify-center p-8">
            <div
              style={{
                transform: `scale(${displayZoom})`,
                transformOrigin: 'center',
              }}
            >
              <div
                className="bg-white shadow-xl rounded"
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

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
            {canvasWidth} x {canvasHeight} px
          </div>
        </main>

        {/* Right Panel - Properties & Template Data */}
        {showRightPanel && (
          <div className="w-64 h-full bg-white border-l border-border flex flex-col">
            <Tabs defaultValue={selectedObject ? 'properties' : 'template'} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 mx-2 mt-2">
                <TabsTrigger value="properties" className="text-xs">元素屬性</TabsTrigger>
                <TabsTrigger value="template" className="text-xs">模板數據</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="flex-1 m-0">
                <PropertiesPanel
                  canvas={canvas}
                  selectedObject={selectedObject}
                  onUpdate={() => {}}
                />
              </TabsContent>

              <TabsContent value="template" className="flex-1 m-0">
                <TemplateDataPanel
                  templateData={templateData}
                  onTemplateDataChange={handleTemplateDataChange}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Version History Panel */}
      {showVersionHistory && (
        <VersionHistory onClose={() => setShowVersionHistory(false)} />
      )}

      {/* 封面圖片上傳對話框 */}
      <Dialog open={showCoverUpload} onOpenChange={setShowCoverUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上傳封面圖片</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-morandi-secondary">
              上傳圖片後可以調整顯示位置，圖片會套用圓拱形狀遮罩。
            </p>
            <ImageUploader
              value={templateData?.coverImage as string | undefined}
              onChange={handleImageUploaded}
              bucket="city-backgrounds"
              filePrefix="brochure-cover"
              aspectRatio={495 / 350}
              previewHeight="200px"
              placeholder="拖曳或點擊上傳封面圖片"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 封面圖片位置編輯器 */}
      {pendingImageUrl && (
        <UnifiedImageEditor
          open={showImageEditor}
          onClose={() => {
            setShowImageEditor(false)
            setPendingImageUrl(null)
          }}
          imageSrc={pendingImageUrl}
          aspectRatio={495 / 350}
          initialPosition={templateData?.coverImagePosition as ImagePositionSettings | undefined}
          onSave={handleImagePositionSaved}
          defaultMode="position"
          hideModes={['crop', 'adjust']}
        />
      )}
    </div>
  )
}
