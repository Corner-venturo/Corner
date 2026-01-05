'use client'

import React, { useEffect, useRef } from 'react'
import { StaticCanvas } from 'fabric'
import type { CanvasPage } from './types'
import { renderPageOnCanvas } from './core/renderer'

export interface ReadOnlyCanvasProps {
  page: CanvasPage
  scale?: number
  className?: string
}

/**
 * ReadOnlyCanvas (V2)
 * A "dumb" component that displays a read-only view of a single canvas page.
 * It relies entirely on the V2 rendering engine.
 */
export const ReadOnlyCanvas: React.FC<ReadOnlyCanvasProps> = ({
  page,
  scale = 1,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<StaticCanvas | null>(null)

  const { width, height } = page

  // Initialize Fabric.js canvas instance once
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new StaticCanvas(canvasRef.current, {
      width,
      height,
      renderOnAddRemove: false, // For performance
    })
    fabricCanvasRef.current = fabricCanvas

    return () => {
      fabricCanvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [width, height])

  // Re-render the page whenever the 'page' prop changes
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (!fabricCanvas) return

    renderPageOnCanvas(fabricCanvas, page, {
      isEditable: false,
      canvasWidth: width,
      canvasHeight: height,
    })
  }, [page, width, height])

  const scaledWidth = width * scale
  const scaledHeight = height * scale

  return (
    <div
      className={className}
      style={{
        width: scaledWidth,
        height: scaledHeight,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: '#f8f9fa',
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  )
}
