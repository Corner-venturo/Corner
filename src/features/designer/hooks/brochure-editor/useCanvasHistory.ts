'use client'

import { useRef, useCallback, useState } from 'react'
import type * as fabric from 'fabric'
import type { PageHistory, UseCanvasHistoryOptions, UseCanvasHistoryReturn } from './types'

/**
 * useCanvasHistory - 歷史記錄管理 Hook
 * 
 * 功能：
 * - Undo/Redo 支援
 * - 多頁獨立歷史記錄
 * - 防抖保存（避免頻繁操作產生過多歷史）
 */

const DEFAULT_MAX_HISTORY_SIZE = 30
const DEFAULT_DEBOUNCE_MS = 300

export function useCanvasHistory(
  getCanvas: () => fabric.Canvas | null,
  options: UseCanvasHistoryOptions = {}
): UseCanvasHistoryReturn {
  const { maxSize = DEFAULT_MAX_HISTORY_SIZE, debounceMs = DEFAULT_DEBOUNCE_MS } = options

  // 狀態
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Refs
  const historyRef = useRef<PageHistory>({ stack: [], index: -1 })
  const pageHistoriesRef = useRef<Map<string, PageHistory>>(new Map())
  const isUndoRedoRef = useRef(false)
  const currentPageIdRef = useRef<string | null>(null)
  const saveHistoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ============================================
  // Update History State
  // ============================================
  const updateHistoryState = useCallback(() => {
    const history = historyRef.current
    setCanUndo(history.index > 0)
    setCanRedo(history.index < history.stack.length - 1)
  }, [])

  // ============================================
  // Save to History (Immediate)
  // ============================================
  const saveToHistoryImmediate = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas || isUndoRedoRef.current) return

    const json = JSON.stringify(canvas.toJSON())
    const history = historyRef.current

    // 如果當前不在最新位置，刪除之後的歷史
    if (history.index < history.stack.length - 1) {
      history.stack = history.stack.slice(0, history.index + 1)
    }

    // 避免重複保存相同狀態
    if (history.stack[history.stack.length - 1] === json) return

    // 添加新狀態
    history.stack.push(json)

    // 限制歷史數量
    if (history.stack.length > maxSize) {
      history.stack.shift()
    } else {
      history.index++
    }

    updateHistoryState()
  }, [getCanvas, maxSize, updateHistoryState])

  // ============================================
  // Save to History (Debounced)
  // ============================================
  const saveToHistory = useCallback(() => {
    // 清除之前的定時器
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current)
    }
    // 設置新的延遲保存
    saveHistoryTimeoutRef.current = setTimeout(() => {
      saveToHistoryImmediate()
      saveHistoryTimeoutRef.current = null
    }, debounceMs)
  }, [saveToHistoryImmediate, debounceMs])

  // ============================================
  // Page History Management
  // ============================================
  const saveCurrentPageHistory = useCallback(() => {
    const pageId = currentPageIdRef.current
    if (pageId) {
      pageHistoriesRef.current.set(pageId, {
        stack: [...historyRef.current.stack],
        index: historyRef.current.index,
      })
    }
  }, [])

  const loadPageHistory = useCallback((pageId: string) => {
    currentPageIdRef.current = pageId
    const savedHistory = pageHistoriesRef.current.get(pageId)
    if (savedHistory) {
      historyRef.current = {
        stack: [...savedHistory.stack],
        index: savedHistory.index,
      }
    } else {
      // 新頁面，初始化空歷史
      historyRef.current = { stack: [], index: -1 }
    }
    updateHistoryState()
  }, [updateHistoryState])

  const initPageHistory = useCallback((pageId: string) => {
    currentPageIdRef.current = pageId
    historyRef.current = { stack: [], index: -1 }
    // 延遲保存初始狀態，確保 canvas 內容已載入
    setTimeout(() => {
      saveToHistoryImmediate()
    }, 100)
  }, [saveToHistoryImmediate])

  // ============================================
  // Undo
  // ============================================
  const undo = useCallback(async (
    canvas: fabric.Canvas | null,
    applyControlStyles: (canvas: fabric.Canvas) => void
  ) => {
    const history = historyRef.current
    if (!canvas || history.index <= 0) return

    // 確保沒有待處理的防抖保存
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current)
      saveHistoryTimeoutRef.current = null
    }

    isUndoRedoRef.current = true
    history.index--

    try {
      await canvas.loadFromJSON(JSON.parse(history.stack[history.index]))
      applyControlStyles(canvas)
      canvas.renderAll()
      updateHistoryState()
    } finally {
      isUndoRedoRef.current = false
    }
  }, [updateHistoryState])

  // ============================================
  // Redo
  // ============================================
  const redo = useCallback(async (
    canvas: fabric.Canvas | null,
    applyControlStyles: (canvas: fabric.Canvas) => void
  ) => {
    const history = historyRef.current
    if (!canvas || history.index >= history.stack.length - 1) return

    isUndoRedoRef.current = true
    history.index++

    try {
      await canvas.loadFromJSON(JSON.parse(history.stack[history.index]))
      applyControlStyles(canvas)
      canvas.renderAll()
      updateHistoryState()
    } finally {
      isUndoRedoRef.current = false
    }
  }, [updateHistoryState])

  // ============================================
  // Clear Pending Timeout
  // ============================================
  const clearPendingTimeout = useCallback(() => {
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current)
      saveHistoryTimeoutRef.current = null
    }
  }, [])

  return {
    canUndo,
    canRedo,
    saveToHistory,
    saveToHistoryImmediate,
    saveCurrentPageHistory,
    loadPageHistory,
    initPageHistory,
    undo,
    redo,
    isUndoRedoRef,
    clearPendingTimeout,
  }
}
