/**
 * V2 狀態管理 Hook
 *
 * 管理單一畫布頁面的狀態
 */
import { useState, useCallback } from 'react'
import type { CanvasPage, CanvasElement } from '../components/types'

// A5 尺寸 (mm 轉 px，96 DPI)
const MM_TO_PX = 3.7795275591
const A5_WIDTH_MM = 148
const A5_HEIGHT_MM = 210
const A5_WIDTH_PX = Math.round(A5_WIDTH_MM * MM_TO_PX)
const A5_HEIGHT_PX = Math.round(A5_HEIGHT_MM * MM_TO_PX)

export function useCanvasPageState() {
  const [page, setPage] = useState<CanvasPage>(() => ({
    id: 'page-1',
    name: '自由創作畫布',
    width: A5_WIDTH_PX,
    height: A5_HEIGHT_PX,
    backgroundColor: '#ffffff',
    elements: [],
  }))

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    setPage((prevPage) => {
      const updatedElements = prevPage.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      )
      return { ...prevPage, elements: updatedElements }
    })
  }, [])

  const addElement = useCallback((newElement: CanvasElement) => {
    setPage((prevPage) => {
      const maxZIndex = prevPage.elements.reduce((max, el) => Math.max(max, el.zIndex), 0)
      const elementWithZIndex = { ...newElement, zIndex: maxZIndex + 1 }
      return { ...prevPage, elements: [...prevPage.elements, elementWithZIndex] }
    })
  }, [])

  const deleteElement = useCallback((elementId: string) => {
    setPage((prevPage) => ({
      ...prevPage,
      elements: prevPage.elements.filter((el) => el.id !== elementId),
    }))
  }, [])

  const setBackgroundColor = useCallback((color: string) => {
    setPage((prevPage) => ({
      ...prevPage,
      backgroundColor: color,
    }))
  }, [])

  return {
    page,
    updateElement,
    addElement,
    deleteElement,
    setBackgroundColor,
  }
}
