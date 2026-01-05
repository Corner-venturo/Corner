import { useState, useCallback, useMemo } from 'react'
import type { CanvasPage, CanvasElement } from '../canvas-editor/types'

// A5 尺寸 (px) - 確保與 canvas-editor/types.ts 中的定義一致
const A5_WIDTH_PX = 559
const A5_HEIGHT_PX = 794

/**
 * useCanvasPageState
 *
 * Manages the state of a single CanvasPage for the brochure designer.
 * This hook adheres to the immutable state principle.
 */
export function useCanvasPageState() {
  const [page, setPage] = useState<CanvasPage>(() => ({
    id: 'page-1',
    name: 'A5 Free Creation',
    width: A5_WIDTH_PX,
    height: A5_HEIGHT_PX,
    backgroundColor: '#ffffff',
    elements: [],
  }))

  // Action: Update an existing element
  const updateElement = useCallback(
    (elementId: string, updates: Partial<CanvasElement>) => {
      setPage((prevPage) => {
        const updatedElements = prevPage.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        )
        return { ...prevPage, elements: updatedElements }
      })
    },
    []
  )

  // Action: Add a new element
  const addElement = useCallback((newElement: CanvasElement) => {
    setPage((prevPage) => {
      // Ensure zIndex is sequential and unique
      const maxZIndex = prevPage.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
      const elementWithZIndex = { ...newElement, zIndex: maxZIndex + 1 };
      return { ...prevPage, elements: [...prevPage.elements, elementWithZIndex] };
    });
  }, []);

  // Action: Delete an element
  const deleteElement = useCallback((elementId: string) => {
    setPage((prevPage) => ({
      ...prevPage,
      elements: prevPage.elements.filter((el) => el.id !== elementId),
    }))
  }, [])

  // Action: Update page properties (e.g., background color)
  const updatePageProperties = useCallback(
    (updates: Partial<CanvasPage>) => {
      setPage((prevPage) => ({ ...prevPage, ...updates }))
    },
    []
  )

  // Memoized page object to prevent unnecessary re-renders in consumers
  const memoizedPage = useMemo(() => page, [page]);

  return {
    page: memoizedPage,
    updateElement,
    addElement,
    deleteElement,
    updatePageProperties,
  }
}
