import { useEffect, useRef } from 'react'
import { logger } from '@/lib/utils/logger'
import { needsScaling, calculateScaleFactor, scaleFabricData, NEW_A5_WIDTH, NEW_A5_HEIGHT } from '@/features/designer/utils/scaling'
import { calculatePageNumber, formatPageNumber } from '@/features/designer/utils/page-number'
import { styleSeries } from '@/features/designer/templates/engine'
import type { CanvasPage, CanvasElement } from '@/features/designer/components/types'
import type { StyleSeries } from '@/features/designer/templates/engine'
import type { MemoPageContent } from '@/features/designer/components/PageListSidebar'

interface SavedPage {
  id: string
  name: string
  templateKey?: string
  width: number
  height: number
  backgroundColor: string
  elements: CanvasElement[]
  fabricData?: Record<string, unknown>
  memoPageContent?: MemoPageContent
  dayIndex?: number
}

interface UseVersionLoaderOptions {
  isCanvasReady: boolean
  currentVersion: { data: unknown } | null
  setGeneratedPages: (pages: CanvasPage[]) => void
  setCurrentPageIndex: (index: number) => void
  setTemplateData: (data: Record<string, unknown> | null) => void
  setSelectedStyle: (style: StyleSeries | null) => void
  setLoadingStage: (stage: 'idle' | 'rendering_canvas', progress: number) => void
  loadCanvasData: (data: Record<string, unknown>) => Promise<void>
  loadCanvasPage: (page: CanvasPage) => Promise<void>
  initPageHistory: (pageId: string) => void
  updateElementByName: (name: string, data: Record<string, unknown>) => void
  generatedPages: CanvasPage[]
  currentPageIndex: number
}

/**
 * 處理版本資料載入和頁碼更新
 */
export function useVersionLoader({
  isCanvasReady,
  currentVersion,
  setGeneratedPages,
  setCurrentPageIndex,
  setTemplateData,
  setSelectedStyle,
  setLoadingStage,
  loadCanvasData,
  loadCanvasPage,
  initPageHistory,
  updateElementByName,
  generatedPages,
  currentPageIndex,
}: UseVersionLoaderOptions) {
  const initialLoadDoneRef = useRef(false)

  // 頁面切換後更新頁碼
  useEffect(() => {
    if (!isCanvasReady) return

    const timer = setTimeout(() => {
      const pageNumber = calculatePageNumber(currentPageIndex, generatedPages)

      if (pageNumber === null) {
        updateElementByName('頁碼', { text: '' })
      } else {
        const pageNumberStr = formatPageNumber(pageNumber)
        updateElementByName('頁碼', { text: pageNumberStr })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isCanvasReady, currentPageIndex, generatedPages, updateElementByName])

  // 載入版本資料
  useEffect(() => {
    if (!isCanvasReady || !currentVersion) return

    setLoadingStage('rendering_canvas', 90)

    const versionData = currentVersion.data as Record<string, unknown>
    if (versionData.version === 1 && Array.isArray(versionData.pages)) {
      const savedPages = versionData.pages as SavedPage[]
      const savedPageIndex =
        typeof versionData.currentPageIndex === 'number' ? versionData.currentPageIndex : 0
      const savedTemplateData = versionData.templateData as Record<string, unknown> | null
      const savedStyleId = versionData.styleId as string | null

      const restoredPages = savedPages.map((page) => {
        let fixedTemplateKey = page.templateKey
        if (page.name?.includes('行程總覽') && page.templateKey === 'daily') {
          fixedTemplateKey = 'itinerary'
        }
        if (page.name?.includes('目錄') && page.templateKey === 'general') {
          fixedTemplateKey = 'toc'
        }

        const shouldScale = needsScaling(page.width, page.height)
        const scaleFactor = shouldScale ? calculateScaleFactor(page.width) : 1
        const scaledWidth = shouldScale ? NEW_A5_WIDTH : page.width
        const scaledHeight = shouldScale ? NEW_A5_HEIGHT : page.height
        const scaledFabricData =
          shouldScale && page.fabricData
            ? scaleFabricData(page.fabricData, scaleFactor)
            : page.fabricData

        const scaledElements = shouldScale
          ? page.elements.map((el): CanvasElement => {
              const scaled = { ...el } as CanvasElement & {
                width?: number
                height?: number
                style?: { fontSize: number; [key: string]: unknown }
                size?: number
                cornerRadius?: number
                strokeWidth?: number
              }
              scaled.x = el.x * scaleFactor
              scaled.y = el.y * scaleFactor
              if ('width' in el && el.width) scaled.width = el.width * scaleFactor
              if ('height' in el && el.height) scaled.height = el.height * scaleFactor
              if (el.type === 'text' && 'style' in el) {
                scaled.style = { ...el.style, fontSize: el.style.fontSize * scaleFactor }
              }
              if (el.type === 'icon' && 'size' in el) {
                scaled.size = el.size * scaleFactor
              }
              if (el.type === 'shape') {
                if ('cornerRadius' in el && el.cornerRadius)
                  scaled.cornerRadius = el.cornerRadius * scaleFactor
                if ('strokeWidth' in el && el.strokeWidth)
                  scaled.strokeWidth = el.strokeWidth * scaleFactor
              }
              return scaled as CanvasElement
            })
          : page.elements

        const restoredPage: CanvasPage & { dayIndex?: number; memoPageContent?: MemoPageContent } =
          {
            id: page.id,
            name: page.name,
            templateKey: fixedTemplateKey,
            width: scaledWidth,
            height: scaledHeight,
            backgroundColor: page.backgroundColor,
            elements: scaledElements,
            fabricData: scaledFabricData,
          }
        if (page.memoPageContent) {
          restoredPage.memoPageContent = page.memoPageContent
        }
        if (typeof page.dayIndex === 'number') {
          restoredPage.dayIndex = page.dayIndex
        }
        return restoredPage
      }) as CanvasPage[]

      let dailyCount = 0
      for (const page of restoredPages) {
        if (page.templateKey === 'daily') {
          const pageWithDayIndex = page as CanvasPage & { dayIndex?: number }
          if (typeof pageWithDayIndex.dayIndex !== 'number') {
            pageWithDayIndex.dayIndex = dailyCount
          }
          dailyCount++
        }
      }

      setGeneratedPages(restoredPages)
      setCurrentPageIndex(savedPageIndex)
      if (savedTemplateData) {
        setTemplateData(savedTemplateData)
      }

      if (savedStyleId) {
        const style = styleSeries.find((s) => s.id === savedStyleId)
        if (style) {
          setSelectedStyle(style)
        }
      }

      const currentPageData = restoredPages[savedPageIndex]
      const hasValidFabricData =
        currentPageData?.fabricData &&
        typeof currentPageData.fabricData === 'object' &&
        Array.isArray((currentPageData.fabricData as { objects?: unknown[] }).objects)

      if (hasValidFabricData && currentPageData.fabricData) {
        loadCanvasData(currentPageData.fabricData).then(() => {
          setLoadingStage('idle', 100)
          initPageHistory(currentPageData.id)
        })
      } else if (restoredPages[savedPageIndex]) {
        loadCanvasPage(restoredPages[savedPageIndex]).then(() => {
          setLoadingStage('idle', 100)
          initPageHistory(restoredPages[savedPageIndex].id)
        })
      } else {
        setLoadingStage('idle', 100)
      }
    } else {
      loadCanvasData(versionData).then(() => {
        setLoadingStage('idle', 100)
        initPageHistory('legacy-page')
      })
    }
  }, [isCanvasReady, currentVersion, loadCanvasData, loadCanvasPage, setLoadingStage, initPageHistory])

  // 初次載入 generated pages
  useEffect(() => {
    if (!isCanvasReady || generatedPages.length === 0) return
    if (currentVersion) return
    if (initialLoadDoneRef.current) return
    initialLoadDoneRef.current = true

    const firstPage = generatedPages[0]
    if (firstPage) {
      loadCanvasPage(firstPage).then(() => {
        initPageHistory(firstPage.id)
      })
    }
  }, [isCanvasReady, generatedPages, currentVersion, loadCanvasPage, initPageHistory])
}
