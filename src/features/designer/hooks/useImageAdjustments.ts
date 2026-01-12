'use client'

import { useCallback, useRef, useEffect } from 'react'
import type { ImageAdjustments } from '../components/types'
import { DEFAULT_IMAGE_ADJUSTMENTS } from '../components/types'
import { logger } from '@/lib/utils/logger'

/**
 * 圖片調整 Hook
 * 使用 @xdadda/mini-gl 進行 WebGL 圖片處理
 */
export function useImageAdjustments() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wglRef = useRef<ReturnType<typeof import('@xdadda/mini-gl').default> | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const isInitializedRef = useRef(false)

  // 清理資源
  useEffect(() => {
    return () => {
      if (wglRef.current) {
        wglRef.current.destroy()
        wglRef.current = null
      }
      if (canvasRef.current) {
        canvasRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [])

  /**
   * 將 -100 到 100 的調整值轉換為 mini-gl 需要的值
   * mini-gl 的大多數濾鏡使用 -1 到 1 的範圍
   */
  const normalizeValue = useCallback((value: number, min = -1, max = 1) => {
    return (value / 100) * (value > 0 ? max : Math.abs(min))
  }, [])

  /**
   * 套用圖片調整並回傳處理後的 dataURL
   */
  const applyAdjustments = useCallback(
    async (
      imageSrc: string,
      adjustments: ImageAdjustments
    ): Promise<string> => {
      // 檢查是否有任何調整
      const hasAdjustments = Object.entries(adjustments).some(
        ([key, value]) => value !== DEFAULT_IMAGE_ADJUSTMENTS[key as keyof ImageAdjustments]
      )

      // 如果沒有調整，直接回傳原始圖片
      if (!hasAdjustments) {
        return imageSrc
      }

      try {
        // 動態載入 mini-gl（避免 SSR 問題）
        const minigl = (await import('@xdadda/mini-gl')).default

        // 載入圖片
        const img = await loadImage(imageSrc)
        imageRef.current = img

        // 建立或重用 canvas
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas')
        }
        const canvas = canvasRef.current
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // 初始化 mini-gl
        if (wglRef.current) {
          wglRef.current.destroy()
        }
        const wgl = minigl(canvas, img, 'srgb')
        wglRef.current = wgl

        // 載入圖片到 WebGL
        wgl.loadimage()

        // 套用濾鏡調整（mini-gl 類型定義不完整，使用展開運算子繞過）
        const adjustmentOptions = {
          brightness: normalizeValue(adjustments.exposure, -1, 1),
          contrast: normalizeValue(adjustments.contrast, -1, 1),
          highlights: normalizeValue(adjustments.highlights, -1, 1),
          shadows: normalizeValue(adjustments.shadows, -1, 1),
          clarity: normalizeValue(adjustments.clarity, -1, 1), // 銳利化
          saturation: normalizeValue(adjustments.saturation, -1, 1),
          temperature: normalizeValue(adjustments.temperature, -1, 1),
          tint: normalizeValue(adjustments.tint, -1, 1),
        }
        wgl.filterAdjustments(adjustmentOptions as Parameters<typeof wgl.filterAdjustments>[0])

        // 套用暈影效果（如果有）
        if (adjustments.vignette > 0) {
          wgl.filterVignette({
            size: normalizeValue(adjustments.vignette, 0, 0.5),
            amount: normalizeValue(adjustments.vignette, 0, 0.5),
          })
        }

        // 渲染到 canvas
        wgl.paintCanvas()

        // 擷取處理後的圖片
        const dataURL = wgl.captureImage('image/jpeg', 0.92)

        return dataURL
      } catch (error) {
        logger.error('圖片調整失敗:', error)
        // 失敗時回傳原始圖片
        return imageSrc
      }
    },
    [normalizeValue]
  )

  /**
   * 取得即時預覽 canvas 元素
   */
  const getPreviewCanvas = useCallback(() => {
    return canvasRef.current
  }, [])

  return {
    applyAdjustments,
    getPreviewCanvas,
  }
}

/**
 * 載入圖片
 * 支援 data URL、blob URL 和遠端 URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    // 只有遠端 URL 需要設定 crossOrigin
    // data: 和 blob: URL 不需要（且設定會導致某些瀏覽器出錯）
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }

    img.onload = () => resolve(img)
    img.onerror = (e) => {
      logger.error('圖片載入失敗:', src.slice(0, 100), e)
      reject(new Error(`Failed to load image: ${src.slice(0, 50)}...`))
    }
    img.src = src
  })
}
