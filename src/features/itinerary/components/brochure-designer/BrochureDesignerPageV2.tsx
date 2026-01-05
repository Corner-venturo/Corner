'use client'

/**
 * Brochure Designer Page V2
 * 使用 Schema Store 和統一渲染引擎的新版手冊設計器
 *
 * 核心改進：
 * 1. Schema 驅動 - 所有狀態集中在 useBrochureSchema
 * 2. 統一渲染 - 預覽和編輯使用相同的渲染邏輯
 * 3. WYSIWYG - 確保預覽和輸出一致
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Save,
  FileDown,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Pencil,
  RefreshCw,
  Layers,
} from 'lucide-react'
import { useItineraries } from '@/hooks/cloud-hooks'
import { useAuthStore } from '@/stores/auth-store'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { BrochureSidebar } from './BrochureSidebar'
import { DEFAULT_COVER_DATA, type BrochureCoverData } from './types'
import {
  CanvasEditor,
  ReadOnlyCanvas,
  ElementLibrary,
  LayerPanel,
  useCanvasEditor,
  type CanvasElement,
  type DecorationCategory,
} from './canvas-editor'
import { BleedGuides, GuideControls, A5_WIDTH, A5_HEIGHT } from './canvas-editor/BleedGuides'

// Schema 和 Renderer 導入
import { useBrochureSchema, useCurrentPage, usePages, useIsDirty } from './stores/useBrochureSchema'
import { PagesPreview } from './renderers' // 保留 PagesPreview 用於縮圖列表（效能考量）
import type { TextElement, ImageElement, ShapeElement } from './canvas-editor/types'

import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Itinerary } from '@/stores/types'

// ============================================================================
// 類型定義
// ============================================================================

type EditorMode = 'canvas' | 'preview'

// ============================================================================
// 輔助函數
// ============================================================================

function stripHtml(str: string | undefined | null): string {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

function itineraryToCoverData(itinerary: Itinerary): BrochureCoverData {
  const formatDateRange = () => {
    if (!itinerary.departure_date) return ''
    const startDate = new Date(itinerary.departure_date)
    const days = itinerary.daily_itinerary?.length || 1
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days - 1)
    const formatDate = (d: Date) =>
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  const parseAirportCode = () => {
    if (itinerary.tour_code) {
      const match = itinerary.tour_code.match(/^([A-Z]{3})/)
      if (match) return match[1]
    }
    return ''
  }

  return {
    clientName: stripHtml(itinerary.tagline) || stripHtml(itinerary.title) || '',
    country: stripHtml(itinerary.country)?.toUpperCase() || '',
    city: stripHtml(itinerary.city)?.toUpperCase() || '',
    airportCode: parseAirportCode(),
    travelDates: formatDateRange(),
    coverImage: itinerary.cover_image || '',
    coverImagePosition: undefined,
    companyName: '角落旅行社',
    emergencyContact: itinerary.leader?.domesticPhone || '+886 2-2345-6789',
    emergencyEmail: 'service@corner.travel',
  }
}

// ============================================================================
// 主組件
// ============================================================================

export function BrochureDesignerPageV2() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itineraryId = searchParams.get('id')
  const { sidebarCollapsed } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // 編輯模式
  const [editorMode, setEditorMode] = useState<EditorMode>('canvas')
  const [showLayerPanel, setShowLayerPanel] = useState(true)

  // 參考線顯示
  const [showBleed, setShowBleed] = useState(true)
  const [showSafety, setShowSafety] = useState(true)
  const [showCenter, setShowCenter] = useState(true)

  // 行程表資料
  const { items: itineraries, isLoading, update } = useItineraries()
  const [coverData, setCoverData] = useState<BrochureCoverData>(DEFAULT_COVER_DATA)
  const [isSaving, setIsSaving] = useState(false)

  // Schema Store
  const {
    schema,
    initializeFromItinerary,
    selectPage,
    updatePageElements,
    refreshAllPagesFromSource,
    markAsSaved,
  } = useBrochureSchema()

  const currentPage = useCurrentPage()
  const pages = usePages()
  const isDirty = useIsDirty()

  // Canvas Editor
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false)

  const {
    editorState,
    elements,
    snapGuides,
    canvasWidth,
    canvasHeight,
    isCanvasReady,
    setEditorState,
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    deleteSelected,
    bringToFront,
    sendToBack,
    setZoom,
    loadElements,
    toggleElementVisibility,
    toggleElementLock,
  } = useCanvasEditor({
    containerRef: canvasContainerRef,
    onElementSelect: setSelectedElementId,
    onElementChange: useCallback((changedElement: CanvasElement) => {
      // 同步變更到 Schema - 保留原始元素的樣式屬性，只更新位置/尺寸
      if (schema && currentPage) {
        const updatedElements = currentPage.elements.map(originalEl => {
          if (originalEl.id !== changedElement.id) return originalEl

          // 合併變更：保留原始的樣式資訊，更新幾何屬性
          const baseUpdates = {
            x: changedElement.x,
            y: changedElement.y,
            width: changedElement.width,
            height: changedElement.height,
            rotation: changedElement.rotation,
            opacity: changedElement.opacity,
          }

          // 根據元素類型合併完整更新
          switch (originalEl.type) {
            case 'text':
              return {
                ...originalEl,
                ...baseUpdates,
                content: (changedElement as TextElement).content || (originalEl as TextElement).content,
              } as TextElement

            case 'image':
              return {
                ...originalEl,
                ...baseUpdates,
              } as ImageElement

            case 'shape':
              return {
                ...originalEl,
                ...baseUpdates,
              } as ShapeElement

            default:
              return { ...originalEl, ...baseUpdates }
          }
        })
        updatePageElements(currentPage.id, updatedElements)
        logger.log('[BrochureDesignerV2] Synced element change to schema:', changedElement.id)
      }
    }, [schema, currentPage, updatePageElements]),
  })

  // 取得當前行程表
  const currentItinerary = useMemo(() => {
    return itineraries.find((i) => i.id === itineraryId) || null
  }, [itineraries, itineraryId])

  // 當前頁面索引
  const currentPageIndex = useMemo(() => {
    if (!schema || !schema.currentPageId) return 0
    return pages.findIndex(p => p.id === schema.currentPageId)
  }, [schema, pages])

  // ============================================================================
  // 初始化
  // ============================================================================

  // 載入行程表資料並初始化 Schema
  useEffect(() => {
    if (!itineraryId || isLoading || !currentItinerary) return
    if (schema && schema.itineraryId === itineraryId) return // 已經初始化

    setCoverData(itineraryToCoverData(currentItinerary))
    initializeFromItinerary(currentItinerary, `${currentItinerary.city || '旅遊'} 手冊`)

    logger.log('[BrochureDesignerV2] Initialized schema from itinerary:', itineraryId)
  }, [itineraryId, currentItinerary, isLoading, schema, initializeFromItinerary])

  // 追蹤上一次載入的頁面 ID 和元素數量，用於檢測外部變更
  const lastLoadedPageRef = useRef<{ id: string; elementCount: number } | null>(null)

  // 當頁面切換或 Canvas 準備好時，載入元素
  useEffect(() => {
    if (!isCanvasReady || !currentPage) return

    // 檢查是否需要重新載入（頁面變更或元素數量變更）
    const needsReload =
      !isCanvasLoaded ||
      lastLoadedPageRef.current?.id !== currentPage.id ||
      lastLoadedPageRef.current?.elementCount !== currentPage.elements.length

    if (!needsReload) return

    const loadPageElements = async () => {
      try {
        logger.log('[BrochureDesignerV2] Loading elements for page:', currentPage.name, currentPage.elements.length, 'elements')
        await loadElements(currentPage.elements)
        setIsCanvasLoaded(true)
        lastLoadedPageRef.current = {
          id: currentPage.id,
          elementCount: currentPage.elements.length,
        }
      } catch (error) {
        logger.error('[BrochureDesignerV2] Failed to load elements:', error)
        toast.error('頁面載入失敗')
      }
    }

    loadPageElements()
  }, [isCanvasReady, currentPage, isCanvasLoaded, loadElements])

  // 當選擇不同頁面時重置 Canvas 載入狀態
  useEffect(() => {
    setIsCanvasLoaded(false)
    lastLoadedPageRef.current = null
  }, [currentPage?.id])

  // ============================================================================
  // 事件處理
  // ============================================================================

  // 頁面導航
  const goToPrev = useCallback(() => {
    if (currentPageIndex > 0 && pages[currentPageIndex - 1]) {
      selectPage(pages[currentPageIndex - 1].id)
    }
  }, [currentPageIndex, pages, selectPage])

  const goToNext = useCallback(() => {
    if (currentPageIndex < pages.length - 1 && pages[currentPageIndex + 1]) {
      selectPage(pages[currentPageIndex + 1].id)
    }
  }, [currentPageIndex, pages, selectPage])

  const goToPage = useCallback((pageId: string) => {
    selectPage(pageId)
  }, [selectPage])

  // 刷新資料
  const handleRefresh = useCallback(() => {
    if (!currentItinerary) return
    refreshAllPagesFromSource(currentItinerary)
    // 重置載入狀態以觸發 Canvas 重新載入
    setIsCanvasLoaded(false)
    lastLoadedPageRef.current = null
    toast.success('已從行程表刷新資料')
    logger.log('[BrochureDesignerV2] Refreshed all pages from itinerary source')
  }, [currentItinerary, refreshAllPagesFromSource])

  // 更新封面資料
  const handleCoverChange = useCallback((changes: Partial<BrochureCoverData>) => {
    setCoverData((prev) => ({ ...prev, ...changes }))
  }, [])

  // 更新行程表資料
  const handleItineraryChange = useCallback((changes: Partial<Itinerary>) => {
    if (!itineraryId || !currentItinerary) return
    update(itineraryId, changes)
  }, [itineraryId, currentItinerary, update])

  // 儲存
  const handleSave = async () => {
    if (!itineraryId) return
    setIsSaving(true)
    try {
      await update(itineraryId, {
        tagline: coverData.clientName,
        country: coverData.country,
        city: coverData.city,
        cover_image: coverData.coverImage,
        leader: { domesticPhone: coverData.emergencyContact },
      } as Partial<Itinerary>)
      markAsSaved()
      toast.success('手冊設定已儲存')
    } catch (error) {
      logger.error('儲存手冊設定失敗:', error)
      toast.error('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  // 匯出 PDF
  const handleExportPDF = useCallback(() => {
    toast.info('PDF 匯出功能即將推出')
  }, [])

  // 返回
  const handleBack = () => {
    if (isDirty && !window.confirm('有未儲存的變更，確定要離開嗎？')) return
    router.back()
  }

  // ============================================================================
  // Canvas 元素操作
  // ============================================================================

  const handleAddText = useCallback(() => {
    addTextElement('新增文字', 100, 100)
  }, [addTextElement])

  const handleAddRectangle = useCallback(() => {
    addRectangle(100, 100, 150, 100)
  }, [addRectangle])

  const handleAddCircle = useCallback(() => {
    addCircle(150, 150, 50)
  }, [addCircle])

  const handleAddTriangle = useCallback(() => {
    addRectangle(100, 100, 100, 100)
  }, [addRectangle])

  const handleAddLine = useCallback(() => {
    addRectangle(100, 200, 200, 2)
  }, [addRectangle])

  const handleAddImageClick = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      await addImage(url, 100, 100, 300, 200)
    }
    input.click()
  }, [addImage])

  const handleAddDecoration = useCallback((category: DecorationCategory, assetId: string) => {
    addRectangle(100, 100, 60, 60)
    toast.info(`已添加 ${category} 裝飾`)
  }, [addRectangle])

  const handleAddSpotCard = useCallback(() => {
    addRectangle(50, 50, 200, 250)
    addTextElement('景點名稱', 60, 220)
  }, [addRectangle, addTextElement])

  const handleAddItineraryItem = useCallback(() => {
    addRectangle(50, 50, 300, 80)
    addTextElement('Day 1 - 行程項目', 60, 70)
  }, [addRectangle, addTextElement])

  const handleAddFlightInfo = useCallback(() => {
    addRectangle(50, 50, 250, 100)
    addTextElement('航班資訊', 60, 80)
  }, [addRectangle, addTextElement])

  const handleAddAccommodationCard = useCallback(() => {
    addRectangle(50, 50, 200, 150)
    addTextElement('飯店名稱', 60, 170)
  }, [addRectangle, addTextElement])

  const handleAddDayHeader = useCallback(() => {
    addRectangle(50, 50, 300, 60)
    addTextElement('Day 1', 60, 70)
  }, [addRectangle, addTextElement])

  const handleUploadAsset = useCallback(() => {
    toast.info('素材上傳功能即將推出')
  }, [])

  // 圖層操作
  const handleLayerSelect = useCallback((id: string) => {
    setSelectedElementId(id)
  }, [])

  const handleLayerMultiSelect = useCallback((ids: string[]) => {
    setEditorState((prev) => ({ ...prev, selectedIds: ids }))
  }, [setEditorState])

  const handleToggleVisibility = useCallback((id: string) => {
    toggleElementVisibility(id)
  }, [toggleElementVisibility])

  const handleToggleLock = useCallback((id: string) => {
    toggleElementLock(id)
  }, [toggleElementLock])

  const handleDeleteElement = useCallback(() => {
    deleteSelected()
  }, [deleteSelected])

  const handleDuplicateElement = useCallback((id: string) => {
    toast.info('複製功能即將推出')
  }, [])

  const handleRenameElement = useCallback((id: string, newName: string) => {
    if (!schema || !currentPage) return
    const updatedElements = currentPage.elements.map(el =>
      el.id === id ? { ...el, name: newName } : el
    )
    updatePageElements(currentPage.id, updatedElements)
  }, [schema, currentPage, updatePageElements])

  // ============================================================================
  // 渲染
  // ============================================================================

  if (!itineraryId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-morandi-secondary">請先選擇行程表</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-morandi-gold" size={32} />
      </div>
    )
  }

  return (
    <>
      {/* 手機版頂部標題列 */}
      <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* 主內容區域 */}
      <main
        className={cn(
          'fixed right-0 bottom-0 overflow-hidden flex flex-col bg-morandi-background',
          'top-14 left-0',
          'lg:top-0',
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-[190px]'
        )}
      >
        {/* 頂部工具列 */}
        <header className="h-[72px] flex-shrink-0 relative bg-background">
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              marginLeft: '24px',
              marginRight: '24px',
              borderTop: '1px solid var(--border)',
              height: '1px',
            }}
          />

          <div className="h-full flex items-center justify-between px-6">
            {/* 左側：返回 + 標題 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-morandi-gold" />
                <h1 className="text-lg font-bold text-morandi-primary">
                  {schema?.name || '手冊設計'}
                </h1>
                {isDirty && (
                  <span className="text-xs text-morandi-secondary">（未儲存）</span>
                )}
              </div>
            </div>

            {/* 中間：頁面切換器 */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={goToPrev}
                  disabled={currentPageIndex === 0}
                >
                  <ChevronLeft size={14} />
                </Button>
                <div className="flex gap-0.5 overflow-x-auto max-w-[400px] scrollbar-hide px-1">
                  {pages.map((page, index) => (
                    <button
                      key={page.id}
                      onClick={() => goToPage(page.id)}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0',
                        currentPageIndex === index
                          ? 'bg-white text-morandi-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      {index + 1}. {page.name}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={goToNext}
                  disabled={currentPageIndex === pages.length - 1}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>

            {/* 右側：操作按鈕 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 刷新按鈕 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                title="從行程表刷新資料"
              >
                <RefreshCw size={16} />
              </Button>

              {/* 模式切換 */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    editorMode === 'canvas'
                      ? 'bg-white text-morandi-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  onClick={() => setEditorMode('canvas')}
                >
                  <Pencil size={14} />
                  編輯
                </button>
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    editorMode === 'preview'
                      ? 'bg-white text-morandi-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  onClick={() => setEditorMode('preview')}
                >
                  <LayoutTemplate size={14} />
                  預覽
                </button>
              </div>

              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                <FileDown size={16} />
                匯出
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="gap-1.5 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                儲存
              </Button>
            </div>
          </div>
        </header>

        {/* 主要內容區 */}
        <div className="flex-1 flex gap-5 p-5 bg-morandi-background overflow-hidden">
          {/* 左側面板 */}
          <aside className="w-[280px] bg-white rounded-xl border border-border flex flex-col overflow-hidden shadow-sm">
            {editorMode === 'preview' ? (
              <>
                <div className="px-5 py-4 bg-morandi-primary/90 text-white flex-shrink-0 rounded-t-xl">
                  <h2 className="text-base font-semibold">手冊設定</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <BrochureSidebar
                    data={coverData}
                    onChange={handleCoverChange}
                    currentPageType={currentPage?.type}
                    itinerary={currentItinerary}
                    onItineraryChange={handleItineraryChange}
                  />
                </div>
              </>
            ) : (
              <ElementLibrary
                onAddText={handleAddText}
                onAddRectangle={handleAddRectangle}
                onAddCircle={handleAddCircle}
                onAddTriangle={handleAddTriangle}
                onAddLine={handleAddLine}
                onAddImage={handleAddImageClick}
                onAddDecoration={handleAddDecoration}
                onAddSpotCard={handleAddSpotCard}
                onAddItineraryItem={handleAddItineraryItem}
                onAddFlightInfo={handleAddFlightInfo}
                onAddAccommodationCard={handleAddAccommodationCard}
                onAddDayHeader={handleAddDayHeader}
                onUploadAsset={handleUploadAsset}
              />
            )}
          </aside>

          {/* 中間預覽/編輯區 */}
          <section className="flex-1 bg-white rounded-xl border-2 border-border flex flex-col overflow-hidden shadow-md">
            {editorMode === 'preview' ? (
              // 預覽模式 - 使用 ReadOnlyCanvas（與編輯模式使用相同的 Fabric.js 渲染引擎）
              <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative bg-slate-50">
                {currentPage && (
                  <ReadOnlyCanvas
                    elements={currentPage.elements}
                    scale={0.75}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                )}
              </div>
            ) : (
              // 編輯模式 - Fabric.js Canvas
              <div
                className="flex-1 flex items-center justify-center p-6 overflow-auto relative bg-slate-50"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault()
                    deleteSelected()
                  }
                }}
              >
                <div
                  className="relative shadow-lg bg-white flex-shrink-0"
                  style={{
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                    transform: `scale(${editorState.zoom * 0.75})`,
                    transformOrigin: 'center center',
                    overflow: 'visible',
                  }}
                >
                  {/* Canvas 編輯層 */}
                  <div
                    ref={canvasContainerRef}
                    className="absolute inset-0"
                    style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`,
                    }}
                  />

                  {/* 出血線 */}
                  <BleedGuides
                    width={canvasWidth}
                    height={canvasHeight}
                    showBleed={showBleed}
                    showSafety={showSafety}
                    showCenter={showCenter}
                    zoom={1}
                  />

                  {/* 智慧參考線 */}
                  {editorState.showGuides && snapGuides.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {snapGuides.map((guide, i) => (
                        <div
                          key={i}
                          className="absolute bg-morandi-gold"
                          style={
                            guide.direction === 'vertical'
                              ? { left: guide.position, top: 0, width: 1, height: '100%' }
                              : { top: guide.position, left: 0, height: 1, width: '100%' }
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 縮放控制 */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-border">
                  <button
                    className="text-xs hover:text-morandi-gold"
                    onClick={() => setZoom(editorState.zoom - 0.1)}
                  >
                    −
                  </button>
                  <span className="text-xs font-mono text-morandi-secondary min-w-[3rem] text-center">
                    {Math.round(editorState.zoom * 100)}%
                  </span>
                  <button
                    className="text-xs hover:text-morandi-gold"
                    onClick={() => setZoom(editorState.zoom + 0.1)}
                  >
                    +
                  </button>
                </div>

                {/* 選中元素提示 */}
                {editorState.selectedIds.length > 0 && (
                  <div className="absolute top-4 left-4 bg-morandi-gold/90 text-white rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-xs font-medium">
                      已選取 {editorState.selectedIds.length} 個元素
                    </span>
                  </div>
                )}

                {/* 參考線控制 */}
                <GuideControls
                  showBleed={showBleed}
                  showSafety={showSafety}
                  showCenter={showCenter}
                  onToggleBleed={() => setShowBleed(!showBleed)}
                  onToggleSafety={() => setShowSafety(!showSafety)}
                  onToggleCenter={() => setShowCenter(!showCenter)}
                />
              </div>
            )}
          </section>

          {/* 右側：圖層面板 或 頁面預覽列表 */}
          <aside className="w-[240px] bg-white rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
            {editorMode === 'canvas' ? (
              // 編輯模式：顯示圖層面板
              showLayerPanel && (
                <LayerPanel
                  elements={elements}
                  selectedIds={editorState.selectedIds}
                  onSelect={handleLayerSelect}
                  onMultiSelect={handleLayerMultiSelect}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                  onDelete={handleDeleteElement}
                  onDuplicate={handleDuplicateElement}
                  onBringForward={bringToFront}
                  onSendBackward={sendToBack}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  onRename={handleRenameElement}
                />
              )
            ) : (
              // 預覽模式：顯示頁面縮圖列表
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 border-b border-border bg-slate-50">
                  <h3 className="text-sm font-semibold text-morandi-primary flex items-center gap-2">
                    <Layers size={14} />
                    頁面列表
                  </h3>
                </div>
                <PagesPreview
                  pages={pages}
                  scale={0.15}
                  currentPageId={currentPage?.id}
                  onPageClick={goToPage}
                  gap={12}
                  direction="vertical"
                />
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  )
}
