'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Save,
  FileDown,
  Loader2,
  BookOpen,
  Undo,
  Redo,
  PanelLeftClose,
  PanelRightClose,
  Settings,
} from 'lucide-react'
import { useItineraries } from '@/hooks/cloud-hooks'
import { useAuthStore } from '@/stores/auth-store'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

import { PropertyPanel } from './PropertyPanel'
import { AssetPanel } from './AssetPanel'
import { BrochureCanvas } from './BrochureCanvas'
import {
  generateBrochure,
  type GeneratorOptions,
} from '../templates/brochure-generator'
import type {
  Brochure,
  BrochurePage,
  BrochureElement,
  EditorState,
} from './types'
import type { Attraction } from '@/features/attractions/types'
import type { Itinerary } from '@/stores/types'

export function BrochureEditor() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itineraryId = searchParams.get('id')
  const { sidebarCollapsed } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // 資料
  const { items: itineraries, isLoading } = useItineraries()
  const currentItinerary = itineraries.find((i) => i.id === itineraryId) || null

  // 手冊狀態
  const [brochure, setBrochure] = useState<Brochure | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 編輯器狀態
  const [editorState, setEditorState] = useState<EditorState>({
    currentPageIndex: 0,
    selectedElementIds: [],
    hoveredElementId: null,
    activeTool: 'select',
    zoom: 0.7,
    showLeftPanel: true,
    showRightPanel: true,
    rightPanelTab: 'attractions',
    canUndo: false,
    canRedo: false,
  })

  // 當前頁面
  const currentPage = brochure?.pages[editorState.currentPageIndex] || null

  // 選中的元素
  const selectedElement = useMemo(() => {
    if (!currentPage || editorState.selectedElementIds.length !== 1) return null
    return currentPage.elements.find((el) => el.id === editorState.selectedElementIds[0]) || null
  }, [currentPage, editorState.selectedElementIds])

  // 自動生成手冊
  useEffect(() => {
    if (!currentItinerary || isLoading || brochure) return

    if (currentItinerary.daily_itinerary && currentItinerary.daily_itinerary.length > 0) {
      setIsGenerating(true)
      try {
        const options: GeneratorOptions = {
          companyName: '角落旅行社',
        }
        const generated = generateBrochure(currentItinerary, options)

        // 轉換為新格式
        const newBrochure: Brochure = {
          id: generated.id,
          name: generated.name,
          itineraryId: currentItinerary.id,
          themeId: generated.theme.id,
          pages: generated.pages.map((p) => ({
            id: p.id,
            name: p.name,
            pageNumber: p.pageNumber,
            elements: p.elements.map((el) => ({
              ...el,
              dataSource: 'itinerary' as const,
            })) as BrochureElement[],
          })),
          createdAt: generated.createdAt,
          updatedAt: generated.createdAt,
        }

        setBrochure(newBrochure)
        toast.success(`已生成 ${newBrochure.pages.length} 頁手冊`)
      } catch (error) {
        logger.error('自動生成手冊失敗:', error)
        toast.error('生成失敗')
      } finally {
        setIsGenerating(false)
      }
    }
  }, [currentItinerary, isLoading, brochure])

  // 元素操作
  const handleElementSelect = useCallback((id: string | null, addToSelection?: boolean) => {
    setEditorState((prev) => {
      if (id === null) {
        return { ...prev, selectedElementIds: [] }
      }
      if (addToSelection) {
        const newIds = prev.selectedElementIds.includes(id)
          ? prev.selectedElementIds.filter((i) => i !== id)
          : [...prev.selectedElementIds, id]
        return { ...prev, selectedElementIds: newIds }
      }
      return { ...prev, selectedElementIds: [id] }
    })
  }, [])

  const handleElementUpdate = useCallback((id: string, updates: Partial<BrochureElement>) => {
    setBrochure((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pages: prev.pages.map((page, idx) => {
          if (idx !== editorState.currentPageIndex) return page
          return {
            ...page,
            elements: page.elements.map((el) =>
              el.id === id ? { ...el, ...updates } : el
            ) as BrochureElement[],
          }
        }),
        updatedAt: new Date().toISOString(),
      }
    })
    setHasChanges(true)
  }, [editorState.currentPageIndex])

  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    handleElementUpdate(id, { x, y })
  }, [handleElementUpdate])

  const handleElementResize = useCallback((id: string, width: number, height: number) => {
    handleElementUpdate(id, { width, height })
  }, [handleElementUpdate])

  const handleElementDelete = useCallback((id: string) => {
    setBrochure((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pages: prev.pages.map((page, idx) => {
          if (idx !== editorState.currentPageIndex) return page
          return {
            ...page,
            elements: page.elements.filter((el) => el.id !== id),
          }
        }),
        updatedAt: new Date().toISOString(),
      }
    })
    setEditorState((prev) => ({
      ...prev,
      selectedElementIds: prev.selectedElementIds.filter((i) => i !== id),
    }))
    setHasChanges(true)
  }, [editorState.currentPageIndex])

  const handleElementDuplicate = useCallback((id: string) => {
    setBrochure((prev) => {
      if (!prev) return prev
      const page = prev.pages[editorState.currentPageIndex]
      const element = page?.elements.find((el) => el.id === id)
      if (!element) return prev

      const newElement = {
        ...element,
        id: `${element.id}-copy-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
        name: `${element.name} (複製)`,
      }

      return {
        ...prev,
        pages: prev.pages.map((p, idx) => {
          if (idx !== editorState.currentPageIndex) return p
          return {
            ...p,
            elements: [...p.elements, newElement] as BrochureElement[],
          }
        }),
        updatedAt: new Date().toISOString(),
      }
    })
    setHasChanges(true)
  }, [editorState.currentPageIndex])

  const handleElementUnbind = useCallback((id: string) => {
    handleElementUpdate(id, {
      dataBinding: {
        source: 'manual',
        isUnbound: true,
      },
    } as Partial<BrochureElement>)
    toast.success('已解除綁定，現在可以自由編輯')
  }, [handleElementUpdate])

  const handleElementDoubleClick = useCallback((id: string) => {
    // TODO: 開啟文字編輯模式或圖片選擇器
    logger.log('Double click on element:', id)
  }, [])

  // 添加元素
  const handleAddAttraction = useCallback((attraction: Attraction) => {
    setBrochure((prev) => {
      if (!prev) return prev
      const newElement: BrochureElement = {
        id: `attraction-${attraction.id}-${Date.now()}`,
        type: 'attraction-card',
        name: attraction.name,
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: prev.pages[editorState.currentPageIndex]?.elements.length || 0,
        dataSource: 'attraction',
        dataBinding: {
          source: 'attraction',
          sourceId: attraction.id,
        },
        attractionId: attraction.id,
        attraction,
        layout: 'vertical',
        showImage: true,
        showDescription: true,
        showDuration: true,
      }

      return {
        ...prev,
        pages: prev.pages.map((page, idx) => {
          if (idx !== editorState.currentPageIndex) return page
          return {
            ...page,
            elements: [...page.elements, newElement],
          }
        }),
        updatedAt: new Date().toISOString(),
      }
    })
    setHasChanges(true)
    toast.success(`已添加景點：${attraction.name}`)
  }, [editorState.currentPageIndex])

  const handleAddSticker = useCallback((stickerId: string) => {
    // TODO: 添加貼紙元素
    toast.info('貼紙功能即將推出')
  }, [])

  const handleAddImage = useCallback((imageUrl: string) => {
    setBrochure((prev) => {
      if (!prev) return prev
      const newElement: BrochureElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        name: '圖片',
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: prev.pages[editorState.currentPageIndex]?.elements.length || 0,
        dataSource: 'manual',
        src: imageUrl,
        objectFit: 'cover',
        borderRadius: 8,
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
      }

      return {
        ...prev,
        pages: prev.pages.map((page, idx) => {
          if (idx !== editorState.currentPageIndex) return page
          return {
            ...page,
            elements: [...page.elements, newElement],
          }
        }),
        updatedAt: new Date().toISOString(),
      }
    })
    setHasChanges(true)
  }, [editorState.currentPageIndex])

  // 圖層操作
  const handleToggleVisibility = useCallback((id: string) => {
    handleElementUpdate(id, {
      visible: !currentPage?.elements.find((el) => el.id === id)?.visible,
    })
  }, [currentPage, handleElementUpdate])

  const handleToggleLock = useCallback((id: string) => {
    handleElementUpdate(id, {
      locked: !currentPage?.elements.find((el) => el.id === id)?.locked,
    })
  }, [currentPage, handleElementUpdate])

  const handleReorderElement = useCallback((id: string, direction: 'up' | 'down') => {
    // TODO: 實作圖層重新排序
  }, [])

  // 返回
  const handleBack = () => {
    if (hasChanges && !window.confirm('有未儲存的變更，確定要離開嗎？')) return
    router.back()
  }

  // 儲存
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: 儲存到資料庫
      await new Promise((resolve) => setTimeout(resolve, 500))
      setHasChanges(false)
      toast.success('已儲存')
    } catch (error) {
      logger.error('儲存失敗:', error)
      toast.error('儲存失敗')
    } finally {
      setIsSaving(false)
    }
  }

  // 匯出
  const handleExport = () => {
    toast.info('匯出功能開發中')
  }

  if (!itineraryId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-morandi-secondary">請先選擇行程表</p>
      </div>
    )
  }

  return (
    <>
      <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <main
        className={cn(
          'fixed right-0 bottom-0 overflow-hidden flex flex-col bg-morandi-background',
          'top-14 left-0',
          'lg:top-0',
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-[190px]'
        )}
      >
        {/* 頂部工具列 */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-morandi-gold" />
              <h1 className="text-lg font-bold text-morandi-primary">手冊設計</h1>
            </div>
            {brochure && (
              <span className="text-sm text-morandi-secondary">
                {brochure.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 復原/重做 */}
            <Button variant="ghost" size="icon" disabled={!editorState.canUndo}>
              <Undo size={18} />
            </Button>
            <Button variant="ghost" size="icon" disabled={!editorState.canRedo}>
              <Redo size={18} />
            </Button>

            <div className="w-px h-6 bg-border mx-2" />

            {/* 面板切換 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setEditorState((prev) => ({ ...prev, showLeftPanel: !prev.showLeftPanel }))
              }
              className={cn(!editorState.showLeftPanel && 'text-morandi-secondary')}
            >
              <PanelLeftClose size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setEditorState((prev) => ({ ...prev, showRightPanel: !prev.showRightPanel }))
              }
              className={cn(!editorState.showRightPanel && 'text-morandi-secondary')}
            >
              <PanelRightClose size={18} />
            </Button>

            <div className="w-px h-6 bg-border mx-2" />

            {/* 匯出/儲存 */}
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
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
        </header>

        {/* 頁面選擇器 */}
        {brochure && (
          <div className="flex items-center justify-center px-4 py-2 bg-white border-b border-border">
            <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1 overflow-x-auto max-w-[600px]">
              {brochure.pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() =>
                    setEditorState((prev) => ({ ...prev, currentPageIndex: index }))
                  }
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
                    editorState.currentPageIndex === index
                      ? 'bg-white text-morandi-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 主要內容區 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左側屬性面板 */}
          {editorState.showLeftPanel && (
            <aside className="w-64 border-r border-border bg-white flex-shrink-0 overflow-hidden">
              <PropertyPanel
                selectedElement={selectedElement}
                onUpdate={handleElementUpdate}
                onDelete={handleElementDelete}
                onDuplicate={handleElementDuplicate}
                onUnbind={handleElementUnbind}
              />
            </aside>
          )}

          {/* 中間畫布區域 */}
          <section className="flex-1 overflow-hidden">
            {isGenerating ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 size={32} className="mx-auto animate-spin text-morandi-gold mb-3" />
                  <p className="text-morandi-secondary">正在生成手冊...</p>
                </div>
              </div>
            ) : (
              <BrochureCanvas
                page={currentPage}
                selectedElementIds={editorState.selectedElementIds}
                zoom={editorState.zoom}
                activeTool={editorState.activeTool}
                onElementSelect={handleElementSelect}
                onElementMove={handleElementMove}
                onElementResize={handleElementResize}
                onElementDoubleClick={handleElementDoubleClick}
                onZoomChange={(zoom) => setEditorState((prev) => ({ ...prev, zoom }))}
                onToolChange={(tool) => setEditorState((prev) => ({ ...prev, activeTool: tool }))}
              />
            )}
          </section>

          {/* 右側素材面板 */}
          {editorState.showRightPanel && (
            <aside className="w-72 border-l border-border bg-white flex-shrink-0 overflow-hidden">
              <AssetPanel
                activeTab={editorState.rightPanelTab}
                onTabChange={(tab) =>
                  setEditorState((prev) => ({ ...prev, rightPanelTab: tab }))
                }
                onAddAttraction={handleAddAttraction}
                onAddSticker={handleAddSticker}
                onAddImage={handleAddImage}
                currentPage={currentPage}
                selectedElementIds={editorState.selectedElementIds}
                onSelectElement={(id) => handleElementSelect(id)}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onReorderElement={handleReorderElement}
              />
            </aside>
          )}
        </div>
      </main>
    </>
  )
}
