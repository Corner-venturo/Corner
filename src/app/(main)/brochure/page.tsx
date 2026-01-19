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
  Layers,
  Columns2,
  FileDown,
  Printer,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentStore, type BrochureEntityType } from '@/stores/document-store'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import type { Tour, Itinerary } from '@/stores/types'
import { useBrochureEditorV2 } from '@/features/designer/hooks/useBrochureEditorV2'
import { LoadingOverlay, SavingIndicator, UnsavedIndicator } from '@/features/designer/components/LoadingOverlay'
import { VersionHistory } from '@/features/designer/components/VersionHistory'
import { ElementLibrary } from '@/features/designer/components/ElementLibrary'
import { EditorToolbar } from '@/features/designer/components/EditorToolbar'
import { PropertiesPanel } from '@/features/designer/components/PropertiesPanel'
import { ImageMaskFillDialog } from '@/features/designer/components/ImageMaskFill'
import { LayerPanel } from '@/features/designer/components/LayerPanel'
import { TemplateDataPanel } from '@/features/designer/components/TemplateDataPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplateSelector } from '@/features/designer/components/TemplateSelector'
import { PageListSidebar } from '@/features/designer/components/PageListSidebar'
import { CanvasWithRulers } from '@/features/designer/components/CanvasWithRulers'
import type { CanvasPage } from '@/features/designer/components/types'
import type { StyleSeries, TemplateData } from '@/features/designer/templates/engine'
import { generatePageFromTemplate, styleSeries, getTemplateById, itineraryToTemplateData } from '@/features/designer/templates/engine'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageUploader, ImagePickerDialog } from '@/components/ui/image-uploader'
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
import { renderPageOnCanvas } from '@/features/designer/components/core/renderer'
import { getMemoSettingsByCountry, getCountryCodeFromName } from '@/features/designer/templates/definitions/country-presets'
import type { MemoPageContent } from '@/features/designer/components/PageListSidebar'
import type { MemoItem, SeasonInfo, MemoInfoItem, MemoSettings } from '@/features/designer/templates/definitions/types'

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
// 設計類型選擇器組件（整合團、行程、模板選擇）
// ============================================
function DesignTypeSelector({
  onSelect,
  onBrochureStart,
  sidebarWidth,
  workspaceId,
  // 當有 URL 參數時，這些會有值
  preselectedTourId,
  preselectedItineraryId,
}: {
  onSelect: (type: DesignType) => void
  onBrochureStart: (type: DesignType, tourId: string, itineraryId: string | null, styleId: string) => void
  sidebarWidth: string
  workspaceId: string | undefined
  preselectedTourId?: string | null
  preselectedItineraryId?: string | null
}) {
  const [tours, setTours] = useState<Tour[]>([])
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState('')
  const [selectedTourId, setSelectedTourId] = useState(preselectedTourId || '')
  const [selectedItineraryId, setSelectedItineraryId] = useState(preselectedItineraryId || '')
  const [selectedStyleId, setSelectedStyleId] = useState('japanese-style-v1') // 預設日系風格
  const [loadingTours, setLoadingTours] = useState(false)
  const [loadingItineraries, setLoadingItineraries] = useState(false)

  // 取得選中的設計類型
  const selectedDesignType = DESIGN_TYPES.find(t => t.id === selectedDesignTypeId)

  // 是否為手冊類型（需要選團和模板）
  const isBrochureType = selectedDesignTypeId.startsWith('brochure-')

  // 是否需要顯示團選擇器（手冊且沒有預選）
  const showTourSelector = isBrochureType && !preselectedTourId

  // 是否可以開始設計
  const canStart = selectedDesignTypeId && (!isBrochureType || selectedTourId || preselectedTourId)

  // 載入團列表（選擇手冊類型時才載入）
  useEffect(() => {
    if (!workspaceId || !isBrochureType) return

    const fetchTours = async () => {
      setLoadingTours(true)
      const { data } = await supabase
        .from('tours')
        .select('id, code, name, status, archived')
        .eq('workspace_id', workspaceId)
        .or('archived.is.null,archived.eq.false')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setTours(data as Tour[])
      setLoadingTours(false)
    }

    fetchTours()
  }, [workspaceId, isBrochureType])

  // 根據選擇的團載入行程列表
  useEffect(() => {
    const tourIdToUse = selectedTourId || preselectedTourId
    if (!tourIdToUse || !isBrochureType) {
      setItineraries([])
      return
    }

    const fetchItineraries = async () => {
      setLoadingItineraries(true)
      const { data } = await supabase
        .from('itineraries')
        .select('id, title, version')
        .eq('tour_id', tourIdToUse)
        .order('created_at', { ascending: false })

      if (data) setItineraries(data as unknown as Itinerary[])
      setLoadingItineraries(false)
    }

    fetchItineraries()
  }, [selectedTourId, preselectedTourId, isBrochureType])

  const handleDesignTypeChange = (value: string) => {
    setSelectedDesignTypeId(value)
    // 切換類型時清除選擇（除非有預選）
    if (!preselectedTourId) {
      setSelectedTourId('')
      setSelectedItineraryId('')
    }
  }

  const handleTourChange = (value: string) => {
    setSelectedTourId(value)
    setSelectedItineraryId('') // 清除行程選擇
  }

  const handleStart = () => {
    if (!selectedDesignType || !canStart) return

    if (isBrochureType) {
      // 手冊類型：傳遞完整資訊
      const tourId = selectedTourId || preselectedTourId || ''
      const itineraryId = selectedItineraryId || preselectedItineraryId || null
      onBrochureStart(selectedDesignType, tourId, itineraryId, selectedStyleId)
    } else {
      // 其他類型：直接進入編輯器
      onSelect(selectedDesignType)
    }
  }

  // 分類選項
  const categoryOptions = [
    { value: 'print', label: '印刷品', items: DESIGN_TYPES.filter(t => t.category === 'print') },
    { value: 'social', label: '社群媒體', items: DESIGN_TYPES.filter(t => t.category === 'social') },
    { value: 'banner', label: '廣告橫幅', items: DESIGN_TYPES.filter(t => t.category === 'banner') },
  ]

  // 模板風格選項
  const styleOptions = [
    { id: 'japanese-style-v1', name: '日系風格', description: '簡約優雅的日式設計' },
    // 未來可以新增更多風格
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
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-morandi-primary mb-2">新增設計</h2>
          <p className="text-morandi-secondary">選擇設計類型開始製作</p>
        </div>

        <div className="space-y-4">
          {/* 設計類型選擇 */}
          <div className="p-6 bg-card rounded-xl border border-border space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                設計類型 *
              </label>
              <Select value={selectedDesignTypeId} onValueChange={handleDesignTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="請選擇設計類型" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <div key={category.value}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-morandi-secondary">
                        {category.label}
                      </div>
                      {category.items.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} - {type.description}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 手冊類型：團/行程/模板選擇（同一個卡片內） */}
            {isBrochureType && (
              <>
                {/* 旅遊團和行程 */}
                {showTourSelector && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-sm font-medium text-morandi-primary mb-2 block">
                        旅遊團 *
                      </label>
                      <Combobox
                        value={selectedTourId}
                        onChange={handleTourChange}
                        options={tours.map((tour) => ({
                          value: tour.id,
                          label: tour.code ? `${tour.code} - ${tour.name || ''}` : tour.name || '(無名稱)',
                        }))}
                        placeholder={loadingTours ? '載入中...' : '搜尋或選擇旅遊團'}
                        emptyMessage="找不到符合的旅遊團"
                        disabled={loadingTours}
                        showSearchIcon
                        showClearButton
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-morandi-primary mb-2 block">
                        行程（可選）
                      </label>
                      <Combobox
                        value={selectedItineraryId}
                        onChange={setSelectedItineraryId}
                        options={itineraries.map((itinerary) => ({
                          value: itinerary.id,
                          label: itinerary.title || '(無名稱)',
                        }))}
                        placeholder={
                          !selectedTourId
                            ? '請先選擇旅遊團'
                            : loadingItineraries
                              ? '載入中...'
                              : itineraries.length === 0
                                ? '此團沒有行程'
                                : '搜尋或選擇行程'
                        }
                        emptyMessage="找不到符合的行程"
                        disabled={!selectedTourId || loadingItineraries}
                        showSearchIcon
                        showClearButton
                      />
                    </div>
                  </div>
                )}

                {/* 模板風格 */}
                <div className={cn(showTourSelector ? 'pt-4 border-t border-border' : 'pt-4 border-t border-border')}>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">
                    模板風格
                  </label>
                  <Select value={selectedStyleId} onValueChange={setSelectedStyleId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name} - {style.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* 開始按鈕 */}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white h-12 text-base"
          >
            開始設計
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 雙頁預覽組件
// ============================================
function DualPagePreview({
  pages,
  currentPageIndex,
  canvasWidth,
  canvasHeight,
  zoom,
  onSelectPage,
}: {
  pages: CanvasPage[]
  currentPageIndex: number
  canvasWidth: number
  canvasHeight: number
  zoom: number
  onSelectPage: (index: number) => void
}) {
  // 計算左右頁面索引
  // 印刷品慣例：封面（0）獨立，之後 1-2, 3-4, 5-6... 為跨頁
  // 奇數頁在左，偶數頁在右
  const getSpreadIndices = (index: number): [number | null, number | null] => {
    if (index === 0) {
      // 封面頁：單獨顯示在右側，左側空白
      return [null, 0]
    }
    // 計算跨頁組
    const isLeftPage = index % 2 === 1 // 1, 3, 5... 是左頁
    if (isLeftPage) {
      const rightIndex = index + 1 < pages.length ? index + 1 : null
      return [index, rightIndex]
    } else {
      const leftIndex = index - 1 >= 0 ? index - 1 : null
      return [leftIndex, index]
    }
  }

  const [leftIndex, rightIndex] = getSpreadIndices(currentPageIndex)
  const leftPage = leftIndex !== null ? pages[leftIndex] : null
  const rightPage = rightIndex !== null ? pages[rightIndex] : null

  // 從 fabricData 渲染頁面預覽
  const renderPagePreview = (page: CanvasPage | null, index: number | null, side: 'left' | 'right') => {
    const isCurrentPage = index === currentPageIndex

    if (!page) {
      // 空白頁面（封面對頁）
      return (
        <div
          className="bg-morandi-container/30 border border-dashed border-border rounded flex items-center justify-center"
          style={{
            width: canvasWidth * zoom,
            height: canvasHeight * zoom,
          }}
        >
          <span className="text-morandi-muted text-sm">封底/空白頁</span>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'relative cursor-pointer transition-all',
          isCurrentPage && 'ring-2 ring-morandi-gold ring-offset-2'
        )}
        style={{
          width: canvasWidth * zoom,
          height: canvasHeight * zoom,
        }}
        onClick={() => index !== null && onSelectPage(index)}
        title={`點擊編輯: ${page.name}`}
      >
        {/* 頁面背景 */}
        <div
          className="absolute inset-0 bg-white shadow-lg rounded overflow-hidden"
          style={{ backgroundColor: page.backgroundColor }}
        >
          {/* 頁面內容預覽 - 使用縮放的 elements 資訊 */}
          <PageThumbnail page={page} scale={zoom} />
        </div>

        {/* 頁面標籤 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {index !== null ? `第 ${index + 1} 頁` : ''} - {page.name}
        </div>

        {/* 當前頁面標記 */}
        {isCurrentPage && (
          <div className="absolute top-2 right-2 bg-morandi-gold text-white text-xs px-2 py-0.5 rounded">
            編輯中
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-1 items-center">
      {/* 左頁 */}
      {renderPagePreview(leftPage, leftIndex, 'left')}

      {/* 中線（書脊） */}
      <div className="w-1 bg-morandi-container rounded" style={{ height: canvasHeight * zoom }} />

      {/* 右頁 */}
      {renderPagePreview(rightPage, rightIndex, 'right')}
    </div>
  )
}

// 簡易頁面縮圖組件（渲染元素的簡化預覽）
function PageThumbnail({ page, scale }: { page: CanvasPage; scale: number }) {
  // 簡化的頁面預覽：只顯示基本元素形狀
  return (
    <div className="w-full h-full relative">
      {page.elements.map((element) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: element.x * scale,
          top: element.y * scale,
          opacity: element.opacity,
          transform: `rotate(${element.rotation}deg)`,
        }

        // 處理不同元素類型的尺寸
        if ('width' in element && 'height' in element && element.width && element.height) {
          style.width = element.width * scale
          style.height = element.height * scale
        }

        switch (element.type) {
          case 'shape':
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  backgroundColor: element.fill || '#c9aa7c',
                  borderRadius: element.variant === 'circle' ? '50%' : (element.cornerRadius || 0) * scale,
                }}
              />
            )
          case 'text':
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  fontSize: element.style.fontSize * scale,
                  fontFamily: element.style.fontFamily,
                  color: element.style.color,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {element.content}
              </div>
            )
          case 'image':
            return (
              <div
                key={element.id}
                style={{
                  ...style,
                  backgroundColor: '#e5e5e5',
                  backgroundImage: `url(${element.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}

// ============================================
// 主頁面
// ============================================
export default function DesignerPage() {
  const searchParams = useSearchParams()

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
  const [showVersionHistory, setShowVersionHistory] = useState(false)
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
    addEllipse,
    addTriangle,
    addLine,
    addImage,
    addSticker,
    addIcon,
    addIllustration,
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
  } = useBrochureEditorV2({
    width: canvasWidth,
    height: canvasHeight,
  })

  // 畫布容器 ref（用於自動適應縮放）
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // 側邊欄寬度
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX

  // 計算當前每日行程頁對應的天數索引
  const currentDayIndex = useMemo(() => {
    const currentPage = generatedPages[currentPageIndex]
    if (!currentPage || currentPage.templateKey !== 'daily') return undefined

    // 計算當前頁面之前有多少個 daily 頁面
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
          const newPage = generatePageFromTemplate(templateId, newTemplateData as Parameters<typeof generatePageFromTemplate>[1])
          // 保留原頁面的 ID 和名稱，避免 React key 重複問題
          newPage.id = page.id
          newPage.name = page.name
          return newPage
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
  const handleDailyImagePositionSaved = useCallback(async (result: {
    position?: ImagePositionSettings
  }) => {
    if (!selectedStyle || !pendingImageUrl || currentDayIndex === undefined) return

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
      coverImagePosition: result.position || { x: 50, y: 50, scale: 1 },
    }

    // 更新 templateData
    const newTemplateData = {
      ...templateData,
      dailyDetails: newDailyDetails,
      currentDayIndex: currentDayIndex,
    }
    setTemplateData(newTemplateData)

    // 重新生成當前每日行程頁面
    const templateId = selectedStyle.templates.daily
    if (templateId) {
      const currentPage = generatedPages[currentPageIndex]
      const newPage = generatePageFromTemplate(templateId, newTemplateData as Parameters<typeof generatePageFromTemplate>[1])
      // 保留原頁面的 ID，避免 React key 重複問題
      newPage.id = currentPage?.id || newPage.id
      newPage.name = `第 ${currentDayIndex + 1} 天行程`

      const newPages = [...generatedPages]
      newPages[currentPageIndex] = newPage
      setGeneratedPages(newPages)

      // 重新渲染當前頁面
      await loadCanvasPage(newPage)
    }

    // 清理狀態
    setPendingImageUrl(null)
    setShowDailyImageEditor(false)
  }, [selectedStyle, templateData, loadCanvasPage, generatedPages, currentPageIndex, pendingImageUrl, currentDayIndex])

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

    // 檢查 fabricData 是否有效（必須有 objects 陣列且不為空）
    const hasValidFabricData = targetPage?.fabricData &&
      Array.isArray((targetPage.fabricData as { objects?: unknown[] }).objects) &&
      ((targetPage.fabricData as { objects?: unknown[] }).objects?.length ?? 0) > 0

    // 如果目標頁面有有效的 fabricData，優先使用它
    if (hasValidFabricData && targetPage.fabricData) {
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
    const newPages: CanvasPage[] = []
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      // 設定 currentDayIndex 來指定第幾天
      const dataWithDay = {
        ...data,
        currentDayIndex: dayIndex,
      }
      const newPage = generatePageFromTemplate(templateId, dataWithDay)
      // 修改頁面名稱以顯示是第幾天
      newPage.name = `第 ${dayIndex + 1} 天行程`
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

    // 建立複製的頁面（使用新 ID，確保唯一性）
    const duplicatedPage: CanvasPage = {
      ...pageToDuplicate,
      id: `${pageToDuplicate.templateKey || 'page'}-${crypto.randomUUID()}`,
      name: `${pageToDuplicate.name} (複製)`,
      elements: [...pageToDuplicate.elements], // 淺複製元素陣列
    }

    // 如果有 fabricData，也要複製
    if (fabricDataToCopy) {
      (duplicatedPage as { fabricData?: Record<string, unknown> }).fabricData = JSON.parse(JSON.stringify(fabricDataToCopy))
    }

    // 插入到原頁面後面
    setGeneratedPages(prev => {
      const newPages = [...prev]
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
          const pages = versionData.pages as Array<{ width?: number; height?: number }> | undefined
          const firstPage = pages?.[0]

          // 根據尺寸找到對應的設計類型
          const matchedType = DESIGN_TYPES.find(dt =>
            dt.width === (firstPage?.width || 559) &&
            dt.height === (firstPage?.height || 794)
          ) || DESIGN_TYPES[0]

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

    // 先檢查是否有存檔
    const effectiveEntityId = selectedTourId
    if (effectiveEntityId && workspaceId) {
      try {
        await loadOrCreateDocument('brochure', effectiveEntityId, workspaceId, 'tour')

        const { currentVersion: loadedVersion } = useDocumentStore.getState()
        if (loadedVersion) {
          // 有存檔，直接進入編輯器
          return
        }
      } catch (err) {
        logger.error('Failed to load document:', err)
      }
    }

    // 沒有存檔，載入行程資料並生成封面頁
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

      // 載入或建立文件
      if (effectiveEntityId && workspaceId) {
        await loadOrCreateDocument('brochure', effectiveEntityId, workspaceId, 'tour')
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

  // ============================================
  // 自動適應畫布縮放
  // ============================================
  useEffect(() => {
    if (!isCanvasReady || !canvasContainerRef.current) return

    // 取得容器尺寸並計算適合的縮放
    const container = canvasContainerRef.current
    const { clientWidth, clientHeight } = container
    fitToContainer(clientWidth, clientHeight, 32) // 32px padding

    // 監聽視窗大小變化
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current
        fitToContainer(clientWidth, clientHeight, 32)
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
      }
      const savedPages = versionData.pages as SavedPage[]
      const savedPageIndex = typeof versionData.currentPageIndex === 'number' ? versionData.currentPageIndex : 0
      const savedTemplateData = versionData.templateData as Record<string, unknown> | null
      const savedStyleId = versionData.styleId as string | null

      // 還原頁面資料
      const restoredPages = savedPages.map(page => {
        // 修正舊資料的 templateKey（行程總覽原本錯誤設為 'daily'）
        let fixedTemplateKey = page.templateKey
        if (page.name?.includes('行程總覽') && page.templateKey === 'daily') {
          fixedTemplateKey = 'itinerary'
        }

        return {
          id: page.id,
          name: page.name,
          templateKey: fixedTemplateKey,
          width: page.width,
          height: page.height,
          backgroundColor: page.backgroundColor,
          elements: page.elements,
          fabricData: page.fabricData, // 還原畫布資料
          memoPageContent: page.memoPageContent, // 還原備忘錄內容
        }
      }) as CanvasPage[]

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
      // 檢查 fabricData 是否有效（必須有 objects 陣列且不為空）
      const hasValidFabricData = currentPageData?.fabricData &&
        Array.isArray((currentPageData.fabricData as { objects?: unknown[] }).objects) &&
        ((currentPageData.fabricData as { objects?: unknown[] }).objects?.length ?? 0) > 0

      if (hasValidFabricData && currentPageData.fabricData) {
        loadCanvasData(currentPageData.fabricData).then(() => {
          setLoadingStage('idle', 100)
          // 初始化當前頁面的歷史記錄
          initPageHistory(currentPageData.id)
        })
      } else if (restoredPages[savedPageIndex]) {
        // 如果沒有有效的 fabricData，使用 elements 重新渲染
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
      pages: updatedPages.map(page => ({
        id: page.id,
        name: page.name,
        templateKey: page.templateKey,
        width: page.width,
        height: page.height,
        backgroundColor: page.backgroundColor,
        elements: page.elements, // 原始元素資料
        fabricData: (page as { fabricData?: Record<string, unknown> }).fabricData, // Fabric.js 畫布資料
        memoPageContent: (page as { memoPageContent?: MemoPageContent }).memoPageContent, // 備忘錄內容
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
  // Print/PDF Export Handler - 開啟列印預覽
  // ============================================
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  const handleExportPDF = useCallback(() => {
    if (generatedPages.length === 0) return

    // 先保存當前頁面的畫布資料，確保列印預覽能正確顯示
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

    // 使用 setTimeout 確保 state 更新後再開啟預覽
    setTimeout(() => {
      setShowPrintPreview(true)
    }, 50)
  }, [generatedPages, currentPageIndex, exportCanvasData])

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

    // 檢查是否為每日行程頁面，且 dailyDetails 有變化（時間軸編輯）
    if (currentPage?.templateKey === 'daily' && currentDayIndex !== undefined) {
      const oldDetails = (oldData.dailyDetails as Array<Record<string, unknown>>) || []
      const newDetails = (newData.dailyDetails as Array<Record<string, unknown>>) || []
      const oldDayData = oldDetails[currentDayIndex]
      const newDayData = newDetails[currentDayIndex]

      const oldTimeline = (oldDayData?.timeline as Array<Record<string, unknown>>) || []
      const newTimeline = (newDayData?.timeline as Array<Record<string, unknown>>) || []

      // 只有在時間軸數量變化時才重新生成頁面
      if (oldTimeline.length !== newTimeline.length && selectedStyle?.id) {
        // 時間軸數量變化，需要重新生成頁面
        const templateId = `${selectedStyle.id}-daily`
        const newPage = generatePageFromTemplate(templateId, {
          ...newData,
          currentDayIndex: currentDayIndex,
        } as TemplateData)

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
        return // 已重新生成頁面，不需要繼續處理其他欄位
      }

      // 時間軸數量不變，只更新文字內容
      newTimeline.forEach((item, idx) => {
        const oldItem = oldTimeline[idx] as Record<string, unknown> | undefined
        if (oldItem?.time !== item.time) {
          updateElementByName(`時間${idx + 1}`, { text: String(item.time || '') })
        }
        if (oldItem?.activity !== item.activity) {
          updateElementByName(`活動${idx + 1}`, { text: String(item.activity || '') })
        }
      })

      // 每日標題變化，直接更新畫布元素
      if (oldDayData?.title !== newDayData?.title) {
        updateElementByName('當日標題', { text: String(newDayData?.title || '') })
      }

      // 餐食變化，直接更新畫布元素
      const oldMeals = (oldDayData?.meals as Record<string, string>) || {}
      const newMeals = (newDayData?.meals as Record<string, string>) || {}
      if (oldMeals.breakfast !== newMeals.breakfast) {
        updateElementByName('早餐', { text: String(newMeals.breakfast || '') })
      }
      if (oldMeals.lunch !== newMeals.lunch) {
        updateElementByName('午餐', { text: String(newMeals.lunch || '') })
      }
      if (oldMeals.dinner !== newMeals.dinner) {
        updateElementByName('晚餐', { text: String(newMeals.dinner || '') })
      }
    }

    // 欄位名稱到畫布元素名稱的對應表
    // 注意：這裡只更新文字內容，不會改變元素位置
    const fieldToElementMap: Record<string, string> = {
      // 封面頁
      destination: '地點',
      mainTitle: '主標題',
      subtitle: '副標題',
      companyName: '公司名稱',
      tourCode: '團號',
      travelDates: '日期',
      // 行程總覽頁
      meetingTime: '集合文字',
      meetingPlace: '集合文字',
      leaderName: '領隊文字',
      leaderPhone: '領隊文字',
    }

    // 檢查每個欄位，如果有變更就直接更新對應的畫布元素
    Object.entries(fieldToElementMap).forEach(([field, elementName]) => {
      const oldValue = oldData[field]
      const newValue = newData[field]

      // 只在值有變化時更新
      if (oldValue !== newValue && newValue !== undefined) {
        // 特殊處理：集合資訊需要組合
        if (field === 'meetingTime' || field === 'meetingPlace') {
          const time = field === 'meetingTime' ? newValue : newData.meetingTime
          const place = field === 'meetingPlace' ? newValue : newData.meetingPlace
          const meeting = [time, place].filter(Boolean).join(' ')
          if (meeting) {
            updateElementByName(elementName, { text: `集合 ${meeting}` })
          }
        }
        // 特殊處理：領隊資訊需要組合
        else if (field === 'leaderName' || field === 'leaderPhone') {
          const name = field === 'leaderName' ? newValue : newData.leaderName
          const phone = field === 'leaderPhone' ? newValue : newData.leaderPhone
          if (name) {
            const text = phone ? `領隊 ${name}  ${phone}` : `領隊 ${name}`
            updateElementByName(elementName, { text })
          }
        }
        // 一般欄位
        else {
          updateElementByName(elementName, { text: String(newValue || '') })
        }
      }
    })
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
          />
        )}

        {/* Canvas Area */}
        <main ref={canvasContainerRef} className="flex-1 relative overflow-hidden bg-morandi-container/20">
          {/* Canvas Container - 使用 grid place-items-center 搭配 overflow-auto 實現置中 */}
          <div className="absolute inset-0 overflow-auto p-8">
            <div className="min-h-full min-w-full flex items-center justify-center">
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
              >
                <div
                  style={{
                    transform: `scale(${displayZoom})`,
                    transformOrigin: 'top left',
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
              </CanvasWithRulers>
            )}
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

      {/* Version History Panel */}
      {showVersionHistory && (
        <VersionHistory onClose={() => setShowVersionHistory(false)} />
      )}

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

      {/* 每日行程封面圖片位置編輯器 */}
      {pendingImageUrl && (
        <UnifiedImageEditor
          open={showDailyImageEditor}
          onClose={() => {
            setShowDailyImageEditor(false)
            setPendingImageUrl(null)
          }}
          imageSrc={pendingImageUrl}
          aspectRatio={16 / 9}
          initialPosition={
            currentDayIndex !== undefined
              ? ((templateData?.dailyDetails as Array<{ coverImagePosition?: ImagePositionSettings }>) || [])[currentDayIndex]?.coverImagePosition
              : undefined
          }
          onSave={handleDailyImagePositionSaved}
          defaultMode="position"
          hideModes={['crop', 'adjust']}
        />
      )}

      {/* 列印預覽對話框 */}
      {showPrintPreview && (
        <BrochurePrintPreview
          pages={generatedPages}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          documentName={storeDocument?.name}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  )
}

// ============================================
// 列印預覽元件
// ============================================
interface BrochurePrintPreviewProps {
  pages: CanvasPage[]
  canvasWidth: number
  canvasHeight: number
  documentName?: string
  onClose: () => void
}

function BrochurePrintPreview({
  pages,
  canvasWidth,
  canvasHeight,
  documentName,
  onClose,
}: BrochurePrintPreviewProps) {
  const [pageImages, setPageImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(true)

  // 生成所有頁面的圖片
  useEffect(() => {
    const generateImages = async () => {
      console.log(`[PDF Export] Starting generateImages for ${pages.length} pages`)
      setIsGenerating(true)
      const images: string[] = []

      // 創建臨時 canvas
      const tempCanvasEl = document.createElement('canvas')
      tempCanvasEl.width = canvasWidth
      tempCanvasEl.height = canvasHeight
      tempCanvasEl.style.display = 'none'
      document.body.appendChild(tempCanvasEl)

      const tempFabricCanvas = new fabric.Canvas(tempCanvasEl, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff',
        renderOnAddRemove: false,
      })

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const fabricData = (page as CanvasPage & { fabricData?: Record<string, unknown> }).fabricData
        // 除錯日誌 - 使用 console.log 確保一定會顯示
        console.log(`[PDF Export] Page ${i + 1}:`, {
          name: page.name,
          hasFabricData: !!fabricData,
          fabricDataObjects: fabricData ? (fabricData as { objects?: unknown[] }).objects?.length : 0,
          hasElements: !!(page.elements && page.elements.length > 0),
          elementsCount: page.elements?.length || 0,
          backgroundColor: page.backgroundColor,
        })
        try {
          tempFabricCanvas.clear()
          tempFabricCanvas.backgroundColor = page.backgroundColor || '#ffffff'

          // 優先使用 elements 渲染（更可靠）
          // fabricData 在臨時畫布上可能會有問題
          if (page.elements && page.elements.length > 0) {
            // 使用 renderPageOnCanvas 渲染
            console.log(`[PDF Export] Page ${i + 1}: Using renderPageOnCanvas with ${page.elements.length} elements`)
            try {
              await renderPageOnCanvas(tempFabricCanvas, page, {
                isEditable: false,
                canvasWidth,
                canvasHeight,
              })
              console.log(`[PDF Export] Page ${i + 1}: renderPageOnCanvas completed`)
            } catch (renderErr) {
              logger.error(`[PDF Export] Page ${i + 1}: renderPageOnCanvas failed:`, renderErr)
              // 如果 elements 渲染失敗，嘗試用 fabricData
              const fabricData = (page as CanvasPage & { fabricData?: Record<string, unknown> }).fabricData
              if (fabricData) {
                try {
                  // Fabric.js 6.x 使用 Promise-based API
                  await Promise.race([
                    (async () => {
                      await tempFabricCanvas.loadFromJSON(fabricData)
                      tempFabricCanvas.renderAll()
                    })(),
                    new Promise<void>((_, reject) =>
                      setTimeout(() => reject(new Error(`Page ${i + 1} fabricData timeout`)), 5000)
                    )
                  ])
                  console.log(`[PDF Export] Page ${i + 1}: fabricData fallback succeeded`)
                } catch {
                  logger.error(`[PDF Export] Page ${i + 1}: fabricData also failed`)
                }
              }
            }
          } else {
            // 沒有 elements，嘗試用 fabricData
            const fabricData = (page as CanvasPage & { fabricData?: Record<string, unknown> }).fabricData
            if (fabricData) {
              console.log(`[PDF Export] Page ${i + 1}: Using fabricData (no elements)`)
              try {
                // Fabric.js 6.x 使用 Promise-based API
                await Promise.race([
                  (async () => {
                    await tempFabricCanvas.loadFromJSON(fabricData)
                    tempFabricCanvas.renderAll()
                  })(),
                  new Promise<void>((_, reject) =>
                    setTimeout(() => reject(new Error(`Page ${i + 1} render timeout`)), 5000)
                  )
                ])
                console.log(`[PDF Export] Page ${i + 1}: fabricData loaded successfully`)
              } catch (loadErr) {
                console.warn(`[PDF Export] Page ${i + 1}: fabricData failed, rendering blank page:`, loadErr)
                // fabricData 失敗時，確保畫布只有背景色
                tempFabricCanvas.clear()
                tempFabricCanvas.backgroundColor = page.backgroundColor || '#ffffff'
                tempFabricCanvas.renderAll()
              }
            } else {
              // 沒有 fabricData 也沒有 elements，只渲染背景色
              console.log(`[PDF Export] Page ${i + 1}: No elements or fabricData, rendering background only`)
              tempFabricCanvas.renderAll()
            }
          }

          // 等待渲染
          await new Promise((resolve) => setTimeout(resolve, 100))

          // 除錯：檢查畫布上有多少物件
          const objectCount = tempFabricCanvas.getObjects().length
          console.log(`[PDF Export] Page ${i + 1}: Canvas has ${objectCount} objects before export`)

          // 匯出為圖片
          const dataUrl = tempFabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2,
          })

          // 除錯：檢查 dataUrl 長度
          console.log(`[PDF Export] Page ${i + 1}: DataURL length = ${dataUrl.length}`)

          images.push(dataUrl)
        } catch (err) {
          logger.error(`[BrochurePrintPreview] 第 ${i + 1} 頁渲染失敗:`, err)
          // 渲染失敗時，產生空白頁面
          const dataUrl = tempFabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2,
          })
          images.push(dataUrl)
        }
      }

      // 清理
      tempFabricCanvas.dispose()
      document.body.removeChild(tempCanvasEl)

      console.log(`[PDF Export] Finished generating ${images.length} images`)
      setPageImages(images)
      setIsGenerating(false)
    }

    generateImages()
  }, [pages, canvasWidth, canvasHeight])

  // 處理列印
  const handlePrint = () => {
    window.print()
  }

  // ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      {/* 列印專用樣式 */}
      <style>{`
        @media print {
          /* 隱藏所有非列印內容 - 使用更通用的選擇器適配 Next.js */
          body * {
            visibility: hidden;
          }
          #brochure-print-overlay,
          #brochure-print-overlay * {
            visibility: visible;
          }
          #brochure-print-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
          }
          #brochure-print-overlay .print-controls {
            display: none !important;
          }
          #brochure-print-pages {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            display: block !important;
          }
          .brochure-page-image {
            page-break-after: always;
            page-break-inside: avoid;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
          }
          .brochure-page-image:last-child {
            page-break-after: auto;
          }
          @page {
            size: A5 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* 預覽 Overlay */}
      <div
        id="brochure-print-overlay"
        className="fixed inset-0 bg-black/80 z-[9999] flex flex-col"
        onClick={onClose}
      >
        {/* 控制列 */}
        <div
          className="print-controls bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-morandi-primary">
              列印預覽
              {documentName && <span className="text-morandi-secondary font-normal ml-2">- {documentName}</span>}
            </h2>
            <span className="text-sm text-morandi-secondary">
              共 {pages.length} 頁
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={isGenerating}
              className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Printer size={16} />
              列印 / 儲存 PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* 頁面預覽 */}
        <div
          id="brochure-print-pages"
          className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2 text-white">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              正在生成預覽...
            </div>
          ) : (
            pageImages.map((img, index) => (
              <div
                key={index}
                className="bg-white shadow-lg"
                style={{
                  width: canvasWidth * 1.5,
                  maxWidth: '90vw',
                }}
              >
                <img
                  src={img}
                  alt={`第 ${index + 1} 頁`}
                  className="brochure-page-image w-full h-auto"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
