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

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, FileDown, Loader2, BookOpen, Layers, Plus, Minus, Trash2, Text, Square, Circle, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react'

import { useCanvasPageState } from './hooks/useCanvasPageState'
import { ReadOnlyCanvas, useCanvasEditor } from './canvas-editor'
import { BleedGuides, GuideControls } from './canvas-editor/BleedGuides' // Note: A5_WIDTH, A5_HEIGHT are no longer imported directly

import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ============================================================================
// 類型定義
// ============================================================================

type EditorMode = 'canvas' | 'preview'

// ============================================================================
// 主組件
// ============================================================================

export function BrochureDesignerPageV2() {
  const router = useRouter() // Keep router for back navigation

  // Canvas Page State (New V2 Architecture)
  const { page, updateElement, addElement, deleteElement, updatePageProperties } = useCanvasPageState()

  // Canvas Editor (New V2 Architecture)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const {
    canvasRef,
    zoom,
    setZoom,
    addTextElement,
    addRectangle,
    addCircle,
    addImageElement,
    deleteSelectedElements,
  } = useCanvasEditor({
    page: page,
    onElementChange: updateElement,
    onElementAdd: addElement,
    onElementDelete: deleteElement,
    onSelect: setSelectedElementId,
  })

  // 編輯模式 (For Free Creation MVP, always canvas mode unless explicitly changed)
  const [editorMode, setEditorMode] = useState<EditorMode>('canvas')

  // 參考線顯示 (Keep these controls)
  const [showBleed, setShowBleed] = useState(true)
  const [showSafety, setShowSafety] = useState(true)
  const [showCenter, setShowCenter] = useState(true)

  // A5 Dimensions are now managed by useCanvasPageState
  const canvasWidth = page.width;
  const canvasHeight = page.height;

  // ============================================================================
  // 事件處理
  // ============================================================================

  // 匯出 PDF (MVP 暫時不實作)
  const handleExportPDF = useCallback(() => {
    toast.info('PDF 匯出功能即將推出')
  }, [])

  // 儲存 (MVP 暫時不實作)
  const handleSave = useCallback(() => {
    toast.info('自由創作模式的儲存功能即將推出')
  }, [])

  // 返回
  const handleBack = () => {
    if (window.confirm('確定要離開嗎？所有未儲存的變更將會遺失。')) {
      router.back()
    }
  }

  // ============================================================================
  // Canvas 元素操作 (直接連接到 useCanvasEditor 提供的功能)
  // ============================================================================

  const handleAddText = useCallback(() => {
    addTextElement()
  }, [addTextElement])

  const handleAddRectangle = useCallback(() => {
    addRectangle()
  }, [addRectangle])

  const handleAddCircle = useCallback(() => {
    addCircle()
  }, [addCircle])

  const handleAddImageClick = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      addImageElement(url)
    }
    input.click()
  }, [addImageElement])

  const handleZoomIn = useCallback(() => {
    setZoom(zoom + 0.1)
  }, [setZoom, zoom])

  const handleZoomOut = useCallback(() => {
    setZoom(zoom - 0.1)
  }, [setZoom, zoom])
  
  const handleDeleteSelected = useCallback(() => {
    deleteSelectedElements()
  }, [deleteSelectedElements])

  // ============================================================================
  // 渲染
  // ============================================================================

  if (!page) { // Should not happen with useCanvasPageState initializing a page
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-morandi-gold" size={32} />
      </div>
    )
  }

  return (
    <>
      {/* 主內容區域 */}
      <main
        className={cn(
          'fixed inset-0 overflow-hidden flex flex-col bg-morandi-background', // Simplified positioning
          'top-14 lg:top-0' // Keeping top-14 for mobile header, lg:top-0 for desktop
        )}
      >
        {/* 頂部工具列 - 這是使用者要求保留的標題區 */}
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
                  {page.name}
                </h1>
              </div>
            </div>

            {/* 中間：簡化頁面切換器 (僅顯示當前頁) - 使用者要求保留的頁面選擇 */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 bg-white text-morandi-primary shadow-sm">
                  1. {page.name}
                </span>
              </div>
            </div>

            {/* 右側：操作按鈕 (整合新增、刪除、縮放) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 新增元素按鈕 */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddText}
                  title="新增文字"
                >
                  <Text size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddRectangle}
                  title="新增矩形"
                >
                  <Square size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddCircle}
                  title="新增圓形"
                >
                  <Circle size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddImageClick}
                  title="新增圖片"
                >
                  <ImageIcon size={14} />
                </Button>
              </div>

              {/* 縮放控制 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                title="縮小"
              >
                <Minus size={16} />
              </Button>
              <span className="text-sm font-mono text-morandi-secondary min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                title="放大"
              >
                <Plus size={16} />
              </Button>

              {/* 刪除選取元素 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteSelected}
                title="刪除選取元素"
              >
                <Trash2 size={16} />
              </Button>
              
              {/* 模式切換 (編輯/預覽) */}
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
              
              {/* 儲存和匯出按鈕 (MVP 階段暫時禁用) */}
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5" disabled>
                <FileDown size={16} />
                匯出
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={true} // Disable for MVP
                className="gap-1.5 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Save size={16} />
                儲存
              </Button>
            </div>
          </div>
        </header>

        {/* 主要內容區 */}
        <div className="flex-1 flex gap-5 p-5 bg-morandi-background overflow-hidden">
          {/* 左側面板 (簡化元素庫) */}
          <aside className="w-[280px] bg-white rounded-xl border border-border flex flex-col overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-morandi-primary/90 text-white flex-shrink-0 rounded-t-xl">
              <h2 className="text-base font-semibold">元素庫</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleAddText} className="flex-col h-auto py-3">
                  <Text size={20} className="mb-1" />
                  文字
                </Button>
                <Button variant="outline" onClick={handleAddRectangle} className="flex-col h-auto py-3">
                  <Square size={20} className="mb-1" />
                  矩形
                </Button>
                <Button variant="outline" onClick={handleAddCircle} className="flex-col h-auto py-3">
                  <Circle size={20} className="mb-1" />
                  圓形
                </Button>
                <Button variant="outline" onClick={handleAddImageClick} className="flex-col h-auto py-3">
                  <ImageIcon size={20} className="mb-1" />
                  圖片
                </Button>
              </div>
            </div>
          </aside>

          {/* 中間預覽/編輯區 */}
          <section className="flex-1 bg-white rounded-xl border-2 border-border flex flex-col overflow-hidden shadow-md">
            {editorMode === 'preview' ? (
              // 預覽模式 - 使用 ReadOnlyCanvas
              <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative bg-slate-50">
                {page && (
                  <ReadOnlyCanvas
                    page={page}
                    scale={zoom} // Use global zoom for preview
                    width={canvasWidth}
                    height={canvasHeight}
                    className="shadow-2xl" // Add a prominent shadow for preview
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
                    handleDeleteSelected()
                  }
                }}
              >
                <div
                  className="relative shadow-lg bg-white flex-shrink-0"
                  style={{
                    width: `${canvasWidth * zoom}px`, // Apply zoom to the container directly
                    height: `${canvasHeight * zoom}px`, // Apply zoom to the container directly
                    // No transform here, let Fabric.js handle scaling internally.
                    // The canvas itself will be rendered at canvasWidth/Height,
                    // and Fabric.js will draw its objects correctly based on its internal zoom.
                    overflow: 'visible', // Fabric.js handles its own clipping now
                  }}
                >
                  {/* Canvas 編輯層 */}
                  <div
                    ref={canvasContainerRef}
                    className="absolute inset-0"
                    style={{
                      width: `${canvasWidth}px`, // Render Fabric canvas at base size
                      height: `${canvasHeight}px`, // Render Fabric canvas at base size
                      transform: `scale(${zoom})`, // Scale the canvas element
                      transformOrigin: 'top left',
                    }}
                  />

                  {/* 出血線 */}
                  <BleedGuides
                    width={canvasWidth}
                    height={canvasHeight}
                    showBleed={showBleed}
                    showSafety={showSafety}
                    showCenter={showCenter}
                    zoom={zoom} // Pass zoom to bleed guides for correct scaling
                  />

                  {/* 智慧參考線 (待實作) */}
                  {/* {editorState.showGuides && snapGuides.length > 0 && ( */}
                  {/*   <div className="absolute inset-0 pointer-events-none"> */}
                  {/*     {snapGuides.map((guide, i) => ( */}
                  {/*       <div */}
                  {/*         key={i} */}
                  {/*         className="absolute bg-morandi-gold" */}
                  {/*         style={ */}
                  {/*           guide.direction === 'vertical' */}
                  {/*             ? { left: guide.position, top: 0, width: 1, height: '100%' } */}
                  {/*             : { top: guide.position, left: 0, height: 1, width: '100%' } */}
                  {/*         } */}
                  {/*       /> */}
                  {/*     ))} */}
                  {/*   </div> */}
                  {/* )} */}
                </div>

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

          {/* 右側：圖層面板 (簡化) */}
          <aside className="w-[240px] bg-white rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
            {showLayerPanel && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 border-b border-border bg-slate-50">
                  <h3 className="text-sm font-semibold text-morandi-primary flex items-center gap-2">
                    <Layers size={14} />
                    圖層
                  </h3>
                </div>
                {/* Simplifed LayerPanel, will list current page.elements */}
                <div className="p-4 space-y-2">
                  {page.elements.length === 0 ? (
                    <p className="text-xs text-morandi-secondary text-center">沒有圖層</p>
                  ) : (
                    page.elements.map((el) => (
                      <div
                        key={el.id}
                        className={cn(
                          'flex items-center justify-between text-sm p-2 rounded-md transition-colors',
                          selectedElementId === el.id ? 'bg-morandi-gold/10 border border-morandi-gold/30' : 'hover:bg-gray-50'
                        )}
                        onClick={() => setSelectedElementId(el.id)}
                      >
                        <span>{el.name} ({el.type})</span>
                        {/* Add basic controls here later */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  )
}
