'use client'

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
  Layers,
  Sparkles,
} from 'lucide-react'
import { useItineraries } from '@/hooks/cloud-hooks'
import { useAuthStore } from '@/stores/auth-store'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { BrochureSidebar } from './BrochureSidebar'
import { BrochureCoverPreview } from './BrochureCoverPreview'
import { BrochureTableOfContents } from './BrochureTableOfContents'
import { BrochureOverviewLeft } from './BrochureOverviewLeft'
import { BrochureOverviewRight } from './BrochureOverviewRight'
import { BrochureDailyLeft } from './BrochureDailyLeft'
import { BrochureDailyRight } from './BrochureDailyRight'
import { BrochureAccommodationLeft, extractAccommodations } from './BrochureAccommodationLeft'
import { BrochureAccommodationRight } from './BrochureAccommodationRight'
import { DEFAULT_COVER_DATA, type BrochureCoverData } from './types'
import {
  CanvasEditor,
  ElementLibrary,
  LayerPanel,
  Toolbar,
  useCanvasEditor,
  type CanvasElement,
  type DecorationCategory,
} from './canvas-editor'
import {
  BleedGuides,
  GuideControls,
  A5_WIDTH,
  A5_HEIGHT,
} from './canvas-editor/BleedGuides'
import {
  generateBrochure,
  type GeneratedBrochure,
  type GeneratedPage,
  type GeneratorOptions,
} from './templates/brochure-generator'
import { ALL_THEMES, type BrochureTheme } from './templates/themes'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Itinerary } from '@/stores/types'

// 編輯模式
type EditorMode = 'template' | 'canvas'

// 頁面類型（基本頁面 + 動態每日頁面）
type BasePageType = 'cover' | 'blank' | 'contents' | 'overview-left' | 'overview-right' | 'accommodation-left' | 'accommodation-right'
type DailyPageType = `day-${number}-left` | `day-${number}-right`
type PageType = BasePageType | DailyPageType

interface PageConfig {
  type: PageType
  label: string
  dayIndex?: number
  side?: 'left' | 'right'
}

// 基本頁面配置
const BASE_PAGES: PageConfig[] = [
  { type: 'cover', label: '封面' },
  { type: 'blank', label: '空白頁' },
  { type: 'contents', label: '目錄' },
  { type: 'overview-left', label: '總攬(左)' },
  { type: 'overview-right', label: '總攬(右)' },
]

// 結尾頁面配置
const END_PAGES: PageConfig[] = [
  { type: 'accommodation-left', label: '住宿(左)' },
  { type: 'accommodation-right', label: '住宿(右)' },
]

// 清除 HTML 標籤
function stripHtml(str: string | undefined | null): string {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

// 從行程表轉換為封面資料
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

export function BrochureDesignerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itineraryId = searchParams.get('id')
  const { sidebarCollapsed } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // 編輯模式
  const [editorMode, setEditorMode] = useState<EditorMode>('template')
  const [showLayerPanel, setShowLayerPanel] = useState(true)

  // 參考線顯示狀態
  const [showBleed, setShowBleed] = useState(true)
  const [showSafety, setShowSafety] = useState(true)
  const [showCenter, setShowCenter] = useState(true)

  const { items: itineraries, isLoading, update } = useItineraries()
  const [coverData, setCoverData] = useState<BrochureCoverData>(DEFAULT_COVER_DATA)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Canvas Editor 狀態
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([])

  // 一鍵生成狀態
  const [generatedBrochure, setGeneratedBrochure] = useState<GeneratedBrochure | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)

  const coverRef = useRef<HTMLDivElement>(null)
  const contentsRef = useRef<HTMLDivElement>(null)
  const overviewLeftRef = useRef<HTMLDivElement>(null)
  const overviewRightRef = useRef<HTMLDivElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)

  // Canvas Editor Hook
  const {
    editorState,
    elements,
    snapGuides,
    overlaps,
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
    clearCanvas,
    loadElements,
    toggleElementVisibility,
    toggleElementLock,
  } = useCanvasEditor({
    containerRef: canvasContainerRef,
    onElementSelect: setSelectedElementId,
    onElementChange: (el) => {
      setCanvasElements((prev) =>
        prev.map((e) => (e.id === el.id ? el : e))
      )
      setHasChanges(true)
    },
  })

  // 取得當前行程表
  const currentItinerary = itineraries.find((i) => i.id === itineraryId) || null
  const dailyItinerary = currentItinerary?.daily_itinerary || []

  // 動態生成頁面配置（基本頁面 + 每日行程頁面 + 結尾頁面）
  const allPages = useMemo<PageConfig[]>(() => {
    const pages = [...BASE_PAGES]

    // 為每天新增左右兩頁
    dailyItinerary.forEach((_, index) => {
      pages.push({
        type: `day-${index + 1}-left` as DailyPageType,
        label: `Day${index + 1}(左)`,
        dayIndex: index,
        side: 'left',
      })
      pages.push({
        type: `day-${index + 1}-right` as DailyPageType,
        label: `Day${index + 1}(右)`,
        dayIndex: index,
        side: 'right',
      })
    })

    // 加入結尾頁面
    pages.push(...END_PAGES)

    return pages
  }, [dailyItinerary])

  // 從行程中提取住宿資訊
  const accommodations = useMemo(() => {
    return extractAccommodations(dailyItinerary)
  }, [dailyItinerary])

  const currentPage = allPages[currentPageIndex] || allPages[0]

  // 自動捲動 tabs 到當前選中的頁面
  useEffect(() => {
    if (!tabsContainerRef.current) return
    const activeTab = tabsContainerRef.current.querySelector(`[data-index="${currentPageIndex}"]`)
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentPageIndex])

  // 載入行程表資料並自動生成手冊
  useEffect(() => {
    if (!itineraryId || isLoading) return
    const itinerary = itineraries.find((i) => i.id === itineraryId)
    if (itinerary) {
      setCoverData(itineraryToCoverData(itinerary))

      // 預先生成手冊資料（但不自動切換模式，讓用戶先看到模板預覽）
      if (itinerary.daily_itinerary && itinerary.daily_itinerary.length > 0 && !generatedBrochure) {
        try {
          const options: GeneratorOptions = {
            themeId: selectedThemeId || undefined,
            companyName: '角落旅行社',
          }
          const brochure = generateBrochure(itinerary, options)
          setGeneratedBrochure(brochure)

          // 載入第一頁的元素（供切換到 canvas 模式時使用）
          if (brochure.pages.length > 0) {
            setCanvasElements(brochure.pages[0].elements)
          }
          // 不再自動切換到 canvas 模式，讓用戶先看到模板預覽
        } catch (error) {
          logger.error('自動生成手冊失敗:', error)
        }
      }
    }
  }, [itineraryId, itineraries, isLoading, generatedBrochure, selectedThemeId])

  // 更新封面資料
  const handleChange = useCallback((changes: Partial<BrochureCoverData>) => {
    setCoverData((prev) => ({ ...prev, ...changes }))
    setHasChanges(true)
  }, [])

  // 更新行程表資料
  const handleItineraryChange = useCallback((changes: Partial<Itinerary>) => {
    if (!itineraryId || !currentItinerary) return
    update(itineraryId, changes)
    setHasChanges(true)
  }, [itineraryId, currentItinerary, update])

  // 儲存到行程表
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
      setHasChanges(false)
      toast.success('手冊設定已儲存')
    } catch (error) {
      logger.error('儲存手冊設定失敗:', error)
      toast.error('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  // 匯出完整手冊 PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('無法開啟列印視窗，請檢查瀏覽器設定')
      return
    }

    const coverHtml = coverRef.current?.outerHTML || ''
    const contentsHtml = contentsRef.current?.outerHTML || ''
    const overviewLeftHtml = overviewLeftRef.current?.outerHTML || ''
    const overviewRightHtml = overviewRightRef.current?.outerHTML || ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${coverData.city || '旅遊手冊'} - A5 Booklet</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Noto Sans TC', sans-serif; }

            @page { size: A5 portrait; margin: 0; }

            .page {
              width: 148mm;
              height: 210mm;
              page-break-after: always;
              position: relative;
              overflow: hidden;
            }
            .page:last-child { page-break-after: auto; }

            .blank-page { background: white; }

            .cover-page > div, .contents-page > div {
              width: 100% !important;
              height: 100% !important;
              max-width: none !important;
              aspect-ratio: unset !important;
            }

            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }

            @media screen {
              body {
                background: #e5e7eb;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .page {
                background: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              }
            }
          </style>
        </head>
        <body>
          <div class="page cover-page">${coverHtml}</div>
          <div class="page blank-page"></div>
          <div class="page contents-page">${contentsHtml}</div>
          <div class="page overview-page">${overviewLeftHtml}</div>
          <div class="page overview-page">${overviewRightHtml}</div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  // 頁面切換
  const goToPrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1)
  }
  const goToNext = () => {
    if (currentPageIndex < allPages.length - 1) setCurrentPageIndex(currentPageIndex + 1)
  }

  // 判斷是否為每日行程頁面
  const isDailyPage = currentPage?.type?.startsWith('day-')

  // 返回
  const handleBack = () => {
    if (hasChanges && !window.confirm('有未儲存的變更，確定要離開嗎？')) return
    router.back()
  }

  // Canvas 元素操作
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
    // 暫時用矩形代替
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
    // 暫時用矩形代替裝飾
    addRectangle(100, 100, 60, 60)
    toast.info(`已添加 ${category} 裝飾`)
  }, [addRectangle])

  const handleAddSpotCard = useCallback(() => {
    // 添加景點卡片組合
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

  // 一鍵生成手冊
  const handleGenerateBrochure = useCallback(async () => {
    if (!currentItinerary) {
      toast.error('請先選擇行程表')
      return
    }

    setIsGenerating(true)
    try {
      const options: GeneratorOptions = {
        themeId: selectedThemeId || undefined,
        companyName: '角落旅行社',
      }

      const brochure = generateBrochure(currentItinerary, options)
      setGeneratedBrochure(brochure)
      setCurrentPageIndex(0)

      // 載入第一頁的元素到 canvas
      if (brochure.pages.length > 0) {
        setCanvasElements(brochure.pages[0].elements)
      }

      // 切換到 canvas 模式
      setEditorMode('canvas')
      setHasChanges(true)
      toast.success(`已生成 ${brochure.pages.length} 頁手冊，可開始微調編輯`)
    } catch (error) {
      logger.error('生成手冊失敗:', error)
      toast.error('生成失敗，請稍後再試')
    } finally {
      setIsGenerating(false)
    }
  }, [currentItinerary, selectedThemeId])

  // 切換生成的手冊頁面
  const handleGeneratedPageChange = useCallback((pageIndex: number) => {
    if (!generatedBrochure) return
    const page = generatedBrochure.pages[pageIndex]
    if (page) {
      setCurrentPageIndex(pageIndex)
      setCanvasElements(page.elements)
    }
  }, [generatedBrochure])


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

  const handleDeleteElement = useCallback((id: string) => {
    deleteSelected()
  }, [deleteSelected])

  const handleDuplicateElement = useCallback((id: string) => {
    toast.info('複製功能即將推出')
  }, [])

  const handleRenameElement = useCallback((id: string, newName: string) => {
    setCanvasElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, name: newName } : el))
    )
  }, [])

  if (!itineraryId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-morandi-secondary">請先選擇行程表</p>
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
        {/* 頂部工具列 - 對齊側邊欄高度 */}
        <header className="h-[72px] flex-shrink-0 relative bg-background">
          {/* 底部分割線 - 對齊側邊欄 Logo 區的線 */}
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
                <h1 className="text-lg font-bold text-morandi-primary">手冊設計</h1>
              </div>
            </div>

            {/* 中間：頁面切換器 */}
            <div className="flex-1 flex items-center justify-center px-4">
              {generatedBrochure && editorMode === 'canvas' ? (
                <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => handleGeneratedPageChange(currentPageIndex - 1)}
                    disabled={currentPageIndex === 0}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <div ref={tabsContainerRef} className="flex gap-0.5 overflow-x-auto max-w-[400px] scrollbar-hide px-1">
                    {generatedBrochure.pages.map((page, index) => (
                      <button
                        key={page.id}
                        data-index={index}
                        onClick={() => handleGeneratedPageChange(index)}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0',
                          currentPageIndex === index
                            ? 'bg-white text-morandi-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {page.name}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => handleGeneratedPageChange(currentPageIndex + 1)}
                    disabled={currentPageIndex === generatedBrochure.pages.length - 1}
                  >
                    <ChevronRight size={14} />
                  </Button>
                  <span className="ml-2 px-2 py-0.5 bg-morandi-gold/10 text-morandi-gold text-[10px] font-medium rounded">
                    {generatedBrochure.theme.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={goToPrev} disabled={currentPageIndex === 0}>
                    <ChevronLeft size={14} />
                  </Button>
                  <div ref={tabsContainerRef} className="flex gap-0.5 overflow-x-auto max-w-[400px] scrollbar-hide px-1">
                    {allPages.map((page, index) => (
                      <button
                        key={page.type}
                        data-index={index}
                        onClick={() => setCurrentPageIndex(index)}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0',
                          currentPageIndex === index
                            ? 'bg-white text-morandi-primary shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {index + 1}. {page.label}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={goToNext} disabled={currentPageIndex === allPages.length - 1}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>

            {/* 右側：操作按鈕 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 模式切換 */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    editorMode === 'template'
                      ? 'bg-white text-morandi-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  onClick={() => setEditorMode('template')}
                >
                  <LayoutTemplate size={14} />
                  模板
                </button>
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
              </div>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                <FileDown size={16} />
                匯出
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
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
            {editorMode === 'template' ? (
              <>
                <div className="px-5 py-4 bg-morandi-primary/90 text-white flex-shrink-0 rounded-t-xl">
                  <h2 className="text-base font-semibold">編輯手冊</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <BrochureSidebar
                    data={coverData}
                    onChange={handleChange}
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
            {/* 預覽/編輯區內容 */}
            {editorMode === 'template' ? (
              // 模板模式 - 使用原有的 React 組件（日系風格模板）
              <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative bg-slate-50">
                <div
                  className="relative shadow-lg bg-white flex-shrink-0 overflow-hidden"
                  style={{
                    width: '559px',
                    height: '794px',
                    transform: 'scale(0.75)',
                    transformOrigin: 'center center',
                  }}
                >
                  {/* 模板預覽 - 使用原有 React 組件 */}
                  {currentPage?.type === 'cover' && <BrochureCoverPreview ref={coverRef} data={coverData} />}

                  {currentPage?.type === 'blank' && (
                    <div className="bg-white flex items-center justify-center w-full h-full">
                      <p className="text-slate-300 text-sm">空白頁（封面背面）</p>
                    </div>
                  )}

                  {currentPage?.type === 'contents' && (
                    <BrochureTableOfContents
                      ref={contentsRef}
                      data={coverData}
                      itinerary={currentItinerary}
                      tripTitle={`${coverData.country} ${coverData.city} Trip`}
                    />
                  )}

                  {currentPage?.type === 'overview-left' && (
                    <BrochureOverviewLeft
                      ref={overviewLeftRef}
                      data={coverData}
                      itinerary={currentItinerary}
                      overviewImage={coverData.overviewImage}
                    />
                  )}

                  {currentPage?.type === 'overview-right' && (
                    <BrochureOverviewRight
                      ref={overviewRightRef}
                      data={coverData}
                      itinerary={currentItinerary}
                    />
                  )}

                  {isDailyPage && currentPage?.dayIndex !== undefined && dailyItinerary[currentPage.dayIndex] && (
                    currentPage.side === 'left' ? (
                      <BrochureDailyLeft
                        dayIndex={currentPage.dayIndex}
                        day={dailyItinerary[currentPage.dayIndex]}
                        departureDate={currentItinerary?.departure_date}
                        tripName={`${coverData.country} ${coverData.city}`}
                        pageNumber={currentPageIndex + 1}
                      />
                    ) : (
                      <BrochureDailyRight
                        dayIndex={currentPage.dayIndex}
                        day={dailyItinerary[currentPage.dayIndex]}
                        pageNumber={currentPageIndex + 1}
                      />
                    )
                  )}

                  {currentPage?.type === 'accommodation-left' && (
                    <BrochureAccommodationLeft
                      accommodations={accommodations}
                      pageNumber={currentPageIndex + 1}
                    />
                  )}

                  {currentPage?.type === 'accommodation-right' && (
                    <BrochureAccommodationRight
                      accommodations={accommodations}
                      pageNumber={currentPageIndex + 1}
                    />
                  )}
                </div>
              </div>
            ) : (
              // 編輯模式 - 使用 Fabric.js Canvas 編輯器
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
                  {/* Fabric.js Canvas 容器 */}
                  <div
                    ref={canvasContainerRef}
                    className="absolute inset-0"
                    style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`,
                    }}
                  />

                  {/* 出血線和參考線覆蓋層 */}
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

          {/* 右側圖層面板 (Canvas 模式) */}
          {editorMode === 'canvas' && showLayerPanel && (
            <aside className="w-[240px] bg-white rounded-xl border border-border overflow-hidden shadow-sm">
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
            </aside>
          )}
        </div>
      </main>
    </>
  )
}
