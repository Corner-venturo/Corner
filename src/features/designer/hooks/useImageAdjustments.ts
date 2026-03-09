'use client'

import { useCallback, useRef, useEffect } from 'react'
import type { ImageAdjustments } from '../components/types'
import { DEFAULT_IMAGE_ADJUSTMENTS } from '../components/types'
import { logger } from '@/lib/utils/logger'

/**
 * MiniGL 實例類型（套件沒有提供類型定義）
 */
interface MiniGLInstance {
  loadImage: () => void
  filterAdjustments: (options: Record<string, number>) => void
  filterVignette: (options: { size: number; amount: number }) => void
  paintCanvas: () => void
  destroy: () => void
}

/**
 * 圖片調整 Hook
 * 使用 @xdadda/mini-gl 進行 WebGL 圖片處理
 */
export function useImageAdjustments() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wglRef = useRef<MiniGLInstance | null>(null)
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
    async (imageSrc: string, adjustments: ImageAdjustments): Promise<string> => {
      // 檢查是否有任何調整
      const hasAdjustments = Object.entries(adjustments).some(
        ([key, value]) => value !== DEFAULT_IMAGE_ADJUSTMENTS[key as keyof ImageAdjustments]
      )

      // 如果沒有調整，直接回傳原始圖片
      if (!hasAdjustments) {
        return imageSrc
      }

      try {
        logger.log('🖼️ 開始圖片調整:', {
          hasAdjustments,
          adjustments,
          imageSrcType: imageSrc.startsWith('data:')
            ? 'data-url'
            : imageSrc.startsWith('blob:')
              ? 'blob-url'
              : 'remote-url',
        })

        // 動態載入 mini-gl（避免 SSR 問題）
        // 套件使用 named export 'minigl'，但沒有 TypeScript 類型定義
        const miniglModule = (await import('@xdadda/mini-gl')) as unknown as {
          minigl: (
            canvas: HTMLCanvasElement,
            img: HTMLImageElement,
            colorSpace?: string
          ) => MiniGLInstance
        }
        const minigl = miniglModule.minigl
        logger.log('✅ mini-gl 載入成功')

        // 載入圖片
        const img = await loadImage(imageSrc)
        logger.log('✅ 圖片載入成功:', img.naturalWidth, 'x', img.naturalHeight)
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
        wgl.loadImage()

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
        logger.log('✅ 渲染到 canvas 完成')

        // 直接從 canvas 取得 data URL（captureImage 回傳的是 HTMLImageElement，不是字串）
        const dataURL = canvas.toDataURL('image/jpeg', 0.92)
        logger.log('✅ 圖片處理完成，dataURL 長度:', dataURL.length)

        return dataURL
      } catch (error) {
        logger.error('❌ 圖片調整失敗:', error)
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
    img.onerror = e => {
      logger.error('圖片載入失敗:', src.slice(0, 100), e)
      reject(new Error(`Failed to load image: ${src.slice(0, 50)}...`))
    }
    img.src = src
  })
}
