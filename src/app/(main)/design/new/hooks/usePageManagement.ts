/**
 * 頁面管理 Hook
 * 處理頁面選取、新增、刪除、複製、排序等功能
 */

import { useCallback, useMemo } from 'react'
import type { CanvasPage } from '@/features/designer/components/types'
import type { StyleSeries, TemplateData } from '@/features/designer/templates/engine'
import { generatePageFromTemplate } from '@/features/designer/templates/engine'
import { getMemoSettingsByCountry, getCountryCodeFromName } from '@/features/designer/templates/definitions/country-presets'
import type { MemoItem, MemoSettings } from '@/features/designer/templates/definitions/types'
import type { MemoPageContent } from '@/features/designer/components/PageListSidebar'

interface UsePageManagementProps {
  generatedPages: CanvasPage[]
  setGeneratedPages: React.Dispatch<React.SetStateAction<CanvasPage[]>>
  currentPageIndex: number
  setCurrentPageIndex: React.Dispatch<React.SetStateAction<number>>
  selectedStyle: StyleSeries | null
  templateData: Record<string, unknown> | null
  canvasWidth: number
  canvasHeight: number
  // Canvas 操作
  exportCanvasData: () => Record<string, unknown>
  loadCanvasData: (data: Record<string, unknown>) => Promise<void>
  loadCanvasPage: (page: CanvasPage) => Promise<void>
  // 歷史記錄
  saveCurrentPageHistory: () => void
  loadPageHistory: (pageId: string) => void
  initPageHistory: (pageId: string) => void
}

export function usePageManagement({
  generatedPages,
  setGeneratedPages,
  currentPageIndex,
  setCurrentPageIndex,
  selectedStyle,
  templateData,
  canvasWidth,
  canvasHeight,
  exportCanvasData,
  loadCanvasData,
  loadCanvasPage,
  saveCurrentPageHistory,
  loadPageHistory,
  initPageHistory,
}: UsePageManagementProps) {
  // 計算備忘錄設定（基於目的地國家）
  const memoSettings = useMemo(() => {
    if (!templateData) return null
    const data = templateData as TemplateData
    const countryCode = data.countryCode || getCountryCodeFromName(data.destination || '')
    return getMemoSettingsByCountry(countryCode)
  }, [templateData])

  // 計算已使用的備忘錄項目 ID
  const usedMemoItemIds = useMemo(() => {
    const usedIds: string[] = []
    for (const page of generatedPages) {
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

  // 取得當前每日行程頁對應的天數索引
  const currentDayIndex = useMemo(() => {
    const currentPage = generatedPages[currentPageIndex] as CanvasPage & { dayIndex?: number }
    if (!currentPage || currentPage.templateKey !== 'daily') return undefined

    if (typeof currentPage.dayIndex === 'number') {
      return currentPage.dayIndex
    }

    let dailyCount = 0
    for (let i = 0; i < currentPageIndex; i++) {
      if (generatedPages[i]?.templateKey === 'daily') {
        dailyCount++
      }
    }
    return dailyCount
  }, [generatedPages, currentPageIndex])

  const handleSelectPage = useCallback(async (index: number) => {
    if (index < 0 || index >= generatedPages.length) return
    if (index === currentPageIndex) return

    saveCurrentPageHistory()

    const currentCanvasData = exportCanvasData() as Record<string, unknown>
    const updatedPages = generatedPages.map((page, i) => {
      if (i === currentPageIndex) {
        return { ...page, fabricData: currentCanvasData }
      }
      return page
    })
    setGeneratedPages(updatedPages as CanvasPage[])

    setCurrentPageIndex(index)
    const targetPage = updatedPages[index] as CanvasPage & { fabricData?: Record<string, unknown> }

    const hasValidFabricData = targetPage?.fabricData &&
      typeof targetPage.fabricData === 'object' &&
      Array.isArray((targetPage.fabricData as { objects?: unknown[] }).objects)

    if (hasValidFabricData && targetPage.fabricData) {
      await loadCanvasData(targetPage.fabricData)
      loadPageHistory(targetPage.id)
    } else if (targetPage) {
      await loadCanvasPage(targetPage)
      initPageHistory(targetPage.id)
    }
  }, [generatedPages, currentPageIndex, exportCanvasData, loadCanvasData, loadCanvasPage, saveCurrentPageHistory, loadPageHistory, initPageHistory, setGeneratedPages, setCurrentPageIndex])

  const handleAddPage = useCallback(async (templateKey: string) => {
    saveCurrentPageHistory()

    let newPage: CanvasPage

    if (templateKey === 'blank') {
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
      if (!selectedStyle || !templateData) return

      const templateId = selectedStyle.templates[templateKey as keyof typeof selectedStyle.templates]
      if (!templateId) return

      newPage = generatePageFromTemplate(templateId, templateData as TemplateData)
    }

    setGeneratedPages(prev => [...prev, newPage])

    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    await loadCanvasPage(newPage)

    initPageHistory(newPage.id)
  }, [selectedStyle, templateData, generatedPages.length, loadCanvasPage, saveCurrentPageHistory, initPageHistory, canvasWidth, canvasHeight, setGeneratedPages, setCurrentPageIndex])

  const handleAddDailyPages = useCallback(async () => {
    if (!selectedStyle || !templateData) return

    const templateId = selectedStyle.templates.daily
    if (!templateId) return

    const data = templateData as TemplateData
    const totalDays = data.dailyItineraries?.length || 0
    if (totalDays === 0) return

    saveCurrentPageHistory()

    const newPages: (CanvasPage & { dayIndex: number })[] = []
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const dataWithDay = { ...data, currentDayIndex: dayIndex }
      const newPage = generatePageFromTemplate(templateId, dataWithDay) as CanvasPage & { dayIndex: number }
      newPage.name = `第 ${dayIndex + 1} 天行程`
      newPage.dayIndex = dayIndex
      newPages.push(newPage)
    }

    setGeneratedPages(prev => [...prev, ...newPages])

    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    if (newPages[0]) {
      await loadCanvasPage(newPages[0])
      initPageHistory(newPages[0].id)
    }
  }, [selectedStyle, templateData, generatedPages.length, loadCanvasPage, saveCurrentPageHistory, initPageHistory, setGeneratedPages, setCurrentPageIndex])

  const handleAddMemoPage = useCallback(async (content: MemoPageContent) => {
    if (!selectedStyle || !memoSettings) return

    const templateId = selectedStyle.templates.memo
    if (!templateId) return

    saveCurrentPageHistory()

    const existingMemoPages = generatedPages.filter((p) => p.templateKey === 'memo')
    const memoPageIndex = existingMemoPages.length

    const memoTemplateData: TemplateData = {
      ...templateData as TemplateData,
      memoSettings,
      currentMemoPageIndex: memoPageIndex,
      memoPageContent: content,
    } as TemplateData & { memoPageContent: MemoPageContent }

    const newPage = generatePageFromTemplate(templateId, memoTemplateData)
    newPage.name = content.isWeatherPage ? '天氣/緊急資訊' : `旅遊提醒 ${memoPageIndex + 1}`

    const pageWithMemo = newPage as CanvasPage & { memoPageContent?: MemoPageContent }
    pageWithMemo.memoPageContent = content

    setGeneratedPages((prev) => [...prev, pageWithMemo as CanvasPage])

    const newIndex = generatedPages.length
    setCurrentPageIndex(newIndex)
    await loadCanvasPage(newPage)

    initPageHistory(newPage.id)
  }, [selectedStyle, memoSettings, templateData, generatedPages, loadCanvasPage, saveCurrentPageHistory, initPageHistory, setGeneratedPages, setCurrentPageIndex])

  const handleDeletePage = useCallback((index: number) => {
    if (index <= 0 || index >= generatedPages.length) return

    setGeneratedPages(prev => prev.filter((_, i) => i !== index))

    if (currentPageIndex >= index) {
      const newIndex = Math.max(0, currentPageIndex - 1)
      setCurrentPageIndex(newIndex)
      const page = generatedPages[newIndex === index ? newIndex - 1 : newIndex]
      if (page) {
        loadCanvasPage(page)
      }
    }
  }, [generatedPages, currentPageIndex, loadCanvasPage, setGeneratedPages, setCurrentPageIndex])

  const handleDuplicatePage = useCallback(async (index: number) => {
    if (index < 0 || index >= generatedPages.length) return

    const pageToDuplicate = generatedPages[index]

    let fabricDataToCopy: Record<string, unknown> | undefined
    if (index === currentPageIndex) {
      saveCurrentPageHistory()
      fabricDataToCopy = exportCanvasData() as Record<string, unknown>
    } else {
      fabricDataToCopy = (pageToDuplicate as { fabricData?: Record<string, unknown> }).fabricData
    }

    let sourceDayIndex: number | undefined
    const pageWithDayIndex = pageToDuplicate as CanvasPage & { dayIndex?: number }
    if (pageToDuplicate.templateKey === 'daily') {
      if (typeof pageWithDayIndex.dayIndex === 'number') {
        sourceDayIndex = pageWithDayIndex.dayIndex
      } else {
        let dailyCount = 0
        for (let i = 0; i < index; i++) {
          if (generatedPages[i]?.templateKey === 'daily') {
            dailyCount++
          }
        }
        sourceDayIndex = dailyCount
      }
    }

    const duplicatedPage: CanvasPage = {
      ...pageToDuplicate,
      id: `${pageToDuplicate.templateKey || 'page'}-${crypto.randomUUID()}`,
      name: `${pageToDuplicate.name} (複製)`,
      elements: [...pageToDuplicate.elements],
    }

    if (pageToDuplicate.templateKey === 'daily' && typeof sourceDayIndex === 'number') {
      (duplicatedPage as CanvasPage & { dayIndex?: number }).dayIndex = sourceDayIndex
    }

    if (fabricDataToCopy) {
      (duplicatedPage as { fabricData?: Record<string, unknown> }).fabricData = JSON.parse(JSON.stringify(fabricDataToCopy))
    }

    setGeneratedPages(prev => {
      let dailyCount = 0
      const pagesWithFixedDayIndex = prev.map((page) => {
        if (page.templateKey === 'daily') {
          const p = page as CanvasPage & { dayIndex?: number }
          if (typeof p.dayIndex !== 'number') {
            return { ...page, dayIndex: dailyCount++ }
          }
          dailyCount++
        }
        return page
      })
      
      const newPages = [...pagesWithFixedDayIndex]
      newPages.splice(index + 1, 0, duplicatedPage)
      return newPages
    })

    const newIndex = index + 1
    setCurrentPageIndex(newIndex)
    if (fabricDataToCopy) {
      await loadCanvasData(fabricDataToCopy)
    } else {
      await loadCanvasPage(duplicatedPage)
    }

    initPageHistory(duplicatedPage.id)
  }, [generatedPages, currentPageIndex, exportCanvasData, loadCanvasData, loadCanvasPage, saveCurrentPageHistory, initPageHistory, setGeneratedPages, setCurrentPageIndex])

  const handleReorderPages = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex <= 0 || toIndex <= 0) return

    setGeneratedPages(prev => {
      const newPages = [...prev]
      const [removed] = newPages.splice(fromIndex, 1)
      newPages.splice(toIndex, 0, removed)
      return newPages
    })

    if (currentPageIndex === fromIndex) {
      setCurrentPageIndex(toIndex)
    } else if (fromIndex < currentPageIndex && toIndex >= currentPageIndex) {
      setCurrentPageIndex(currentPageIndex - 1)
    } else if (fromIndex > currentPageIndex && toIndex <= currentPageIndex) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }, [currentPageIndex, setGeneratedPages, setCurrentPageIndex])

  return {
    memoSettings,
    usedMemoItemIds,
    currentDayIndex,
    handleSelectPage,
    handleAddPage,
    handleAddDailyPages,
    handleAddMemoPage,
    handleDeletePage,
    handleDuplicatePage,
    handleReorderPages,
  }
}
