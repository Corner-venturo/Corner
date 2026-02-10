'use client'

import { useState, useCallback } from 'react'

/**
 * useCanvasZoom - 縮放操作 Hook
 * 
 * 功能：
 * - setZoom, zoomIn, zoomOut, resetZoom
 * - fitToContainer
 * 
 * 注意：縮放只使用 CSS transform 顯示，不影響 canvas 內部座標
 * 這樣可以避免雙重縮放問題，且匯出時保持原始尺寸
 */

interface UseCanvasZoomOptions {
  width: number
  height: number
  initialZoom?: number
}

interface UseCanvasZoomReturn {
  zoom: number
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitToContainer: (containerWidth: number, containerHeight: number, padding?: number) => void
}

export function useCanvasZoom(options: UseCanvasZoomOptions): UseCanvasZoomReturn {
  const { width, height, initialZoom = 1 } = options

  const [zoom, setZoomState] = useState(initialZoom)

  // ============================================
  // Set Zoom
  // ============================================
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.25, Math.min(3, newZoom))
    setZoomState(clampedZoom)
  }, [])

  // ============================================
  // Zoom In
  // ============================================
  const zoomIn = useCallback(() => {
    setZoomState(prev => Math.min(3, prev + 0.1))
  }, [])

  // ============================================
  // Zoom Out
  // ============================================
  const zoomOut = useCallback(() => {
    setZoomState(prev => Math.max(0.25, prev - 0.1))
  }, [])

  // ============================================
  // Reset Zoom
  // ============================================
  const resetZoom = useCallback(() => {
    setZoomState(1)
  }, [])

  // ============================================
  // Fit to Container
  // ============================================
  const fitToContainer = useCallback((containerWidth: number, containerHeight: number, padding = 64) => {
    const availableWidth = containerWidth - padding * 2
    const availableHeight = containerHeight - padding * 2

    const scaleX = availableWidth / width
    const scaleY = availableHeight / height
    const fitZoom = Math.min(scaleX, scaleY)

    setZoom(fitZoom)
  }, [width, height, setZoom])

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContainer,
  }
}
