'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Text,
  Square,
  Circle,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react'
import { useCanvasPageState } from '@/features/designer/hooks/useCanvasPageState'
import { useCanvasEditor } from '@/features/designer/hooks/useCanvasEditor'
import { cn } from '@/lib/utils'

export default function DesignerPage() {
  const router = useRouter()
  const { page, updateElement, addElement, deleteElement } = useCanvasPageState()
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const {
    canvasRef,
    zoom,
    setZoom,
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    deleteSelectedElements,
  } = useCanvasEditor({
    page,
    onElementChange: updateElement,
    onElementAdd: addElement,
    onElementDelete: deleteElement,
    onSelect: setSelectedElementId,
  })

  const handleBack = () => {
    if (page.elements.length > 0) {
      if (window.confirm('您確定要離開嗎？所有未儲存的變更都將遺失。')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  const handleAddImageClick = useCallback(() => {
    const url = prompt(
      '請輸入圖片網址：',
      'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=800'
    )
    if (url) {
      addImage(url)
    }
  }, [addImage])

  const toggleElementVisibility = useCallback(
    (elementId: string) => {
      const element = page.elements.find((el) => el.id === elementId)
      if (element) {
        updateElement(elementId, { visible: !element.visible })
      }
    },
    [page.elements, updateElement]
  )

  const toggleElementLock = useCallback(
    (elementId: string) => {
      const element = page.elements.find((el) => el.id === elementId)
      if (element) {
        updateElement(elementId, { locked: !element.locked })
      }
    },
    [page.elements, updateElement]
  )

  return (
    <main className="fixed top-0 right-0 bottom-0 left-[var(--sidebar-width,16px)] overflow-hidden flex flex-col bg-background transition-[left] duration-300">
      {/* Header */}
      <header className="h-[56px] flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-morandi-primary">{page.name}</h1>
            <p className="text-xs text-morandi-secondary">
              {page.width} x {page.height} px
            </p>
          </div>
        </div>

        {/* 工具列 */}
        <div className="flex items-center gap-2">
          {/* 新增工具 */}
          <div className="flex items-center gap-1 bg-morandi-container/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addTextElement}
              title="新增文字"
              className="h-8 w-8 p-0"
            >
              <Text size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addRectangle}
              title="新增矩形"
              className="h-8 w-8 p-0"
            >
              <Square size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addCircle}
              title="新增圓形"
              className="h-8 w-8 p-0"
            >
              <Circle size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddImageClick}
              title="新增圖片"
              className="h-8 w-8 p-0"
            >
              <ImageIcon size={16} />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 縮放控制 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(zoom - 0.1)}
            title="縮小"
            className="h-8 w-8 p-0"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs font-mono text-morandi-secondary w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(zoom + 0.1)}
            title="放大"
            className="h-8 w-8 p-0"
          >
            <ZoomIn size={16} />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 刪除 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-morandi-red hover:text-morandi-red hover:bg-red-50"
            onClick={deleteSelectedElements}
            title="刪除選取"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </header>

      {/* 主內容區 */}
      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* 左側：圖層面板 */}
        <aside className="w-60 bg-white rounded-xl border border-border flex flex-col shadow-sm">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-morandi-primary">圖層</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {page.elements.length === 0 ? (
              <p className="text-xs text-morandi-secondary text-center py-4">
                尚無元素
                <br />
                使用上方工具列新增
              </p>
            ) : (
              [...page.elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => (
                  <div
                    key={el.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors',
                      selectedElementId === el.id
                        ? 'bg-morandi-gold/20 text-morandi-primary'
                        : 'hover:bg-morandi-container/50 text-morandi-secondary'
                    )}
                    onClick={() => setSelectedElementId(el.id)}
                  >
                    <span className="flex-1 truncate">{el.name}</span>
                    <button
                      className="p-1 hover:bg-white rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleElementVisibility(el.id)
                      }}
                    >
                      {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      className="p-1 hover:bg-white rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleElementLock(el.id)
                      }}
                    >
                      {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                ))
            )}
          </div>
        </aside>

        {/* 中間：畫布區 */}
        <section className="flex-1 bg-slate-200 rounded-xl flex items-center justify-center overflow-auto">
          <div
            className="shadow-xl bg-white"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </section>

        {/* 右側：屬性面板（未來擴充） */}
        <aside className="w-60 bg-white rounded-xl border border-border flex flex-col shadow-sm">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-morandi-primary">屬性</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {selectedElementId ? (
              <div className="text-xs text-morandi-secondary">
                <p>選取: {selectedElementId}</p>
                <p className="mt-2 text-morandi-muted">屬性編輯功能開發中...</p>
              </div>
            ) : (
              <p className="text-xs text-morandi-secondary text-center py-4">
                請選取元素以編輯屬性
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}
