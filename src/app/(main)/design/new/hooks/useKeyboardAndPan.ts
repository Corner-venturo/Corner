/**
 * 鍵盤快捷鍵和平移模式 Hook
 * 處理鍵盤快捷鍵、滾輪縮放、Space + 拖曳平移
 */

import { useEffect, useState, useRef } from 'react'
import type { DesignType } from '@/features/designer/components/DesignTypeSelector'

interface UseKeyboardAndPanProps {
  selectedDesignType: DesignType | null
  zoom: number
  setZoom: (zoom: number) => void
  // 操作
  handleSave: () => void
  undo: () => void
  redo: () => void
  copySelected: () => void
  pasteClipboard: () => void
  cutSelected: () => void
  deleteSelected: () => void
  moveSelected: (dx: number, dy: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  // Refs
  canvasContainerRef: React.RefObject<HTMLDivElement | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

export function useKeyboardAndPan({
  selectedDesignType,
  zoom,
  setZoom,
  handleSave,
  undo,
  redo,
  copySelected,
  pasteClipboard,
  cutSelected,
  deleteSelected,
  moveSelected,
  zoomIn,
  zoomOut,
  resetZoom,
  canvasContainerRef,
  scrollContainerRef,
}: UseKeyboardAndPanProps) {
  const [isPanMode, setIsPanMode] = useState(false)
  const panStateRef = useRef<{
    isPanning: boolean
    startX: number
    startY: number
    scrollLeft: number
    scrollTop: number
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })

  // 鍵盤快捷鍵
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
      const moveStep = e.shiftKey ? 10 : 1
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

  // 滾輪縮放（Ctrl/Cmd + 滾輪）
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container || !selectedDesignType) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        setZoom(zoom + delta)
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [selectedDesignType, zoom, setZoom, canvasContainerRef])

  // Space + 拖曳平移
  useEffect(() => {
    if (!selectedDesignType) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsPanMode(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
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

    scrollContainer.style.cursor = 'grab'

    return () => {
      scrollContainer.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      scrollContainer.style.cursor = ''
    }
  }, [isPanMode, scrollContainerRef])

  return {
    isPanMode,
  }
}
