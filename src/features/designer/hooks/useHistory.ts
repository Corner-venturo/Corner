'use client'

/**
 * 撤銷/重做 Hook
 *
 * 管理編輯器的歷史記錄，支援 Ctrl+Z/Y 快捷鍵
 */

import { useState, useCallback, useEffect } from 'react'

const MAX_HISTORY_SIZE = 50 // 最多保存 50 個歷史記錄

interface UseHistoryOptions<T> {
  initialState: T
  maxSize?: number
}

interface UseHistoryReturn<T> {
  state: T
  setState: (newState: T, skipHistory?: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
}

export function useHistory<T>({
  initialState,
  maxSize = MAX_HISTORY_SIZE,
}: UseHistoryOptions<T>): UseHistoryReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 當前狀態
  const state = history[currentIndex]

  // 設定新狀態
  const setState = useCallback(
    (newState: T, skipHistory = false) => {
      if (skipHistory) {
        // 直接更新當前狀態，不記錄歷史
        setHistory((prev) => {
          const newHistory = [...prev]
          newHistory[currentIndex] = newState
          return newHistory
        })
        return
      }

      setHistory((prev) => {
        // 如果不是在最新位置，移除後面的歷史
        const newHistory = prev.slice(0, currentIndex + 1)

        // 添加新狀態
        newHistory.push(newState)

        // 如果超過最大長度，移除最舊的記錄
        if (newHistory.length > maxSize) {
          newHistory.shift()
          // 不需要調整 currentIndex，因為我們會在下面設定它
          return newHistory
        }

        return newHistory
      })

      setCurrentIndex((prev) => {
        // 如果歷史被截斷，調整 index
        const newIndex = Math.min(prev + 1, maxSize - 1)
        return newIndex
      })
    },
    [currentIndex, maxSize]
  )

  // 撤銷
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  // 重做
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, history.length])

  // 是否可以撤銷/重做
  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  // 清除歷史
  const clearHistory = useCallback(() => {
    setHistory([state])
    setCurrentIndex(0)
  }, [state])

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦點在輸入框內，不處理
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl/Cmd + Z 撤銷
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        redo()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  }
}

// 簡化版：只追蹤特定屬性的變化
export function useHistoryWithDiff<T extends object>({
  initialState,
  maxSize = MAX_HISTORY_SIZE,
  compareKeys,
}: UseHistoryOptions<T> & { compareKeys?: (keyof T)[] }): UseHistoryReturn<T> {
  const history = useHistory({ initialState, maxSize })

  const setStateWithDiff = useCallback(
    (newState: T, skipHistory = false) => {
      if (skipHistory) {
        history.setState(newState, true)
        return
      }

      // 如果指定了比較的 keys，只在這些 keys 變化時記錄歷史
      if (compareKeys) {
        const hasChange = compareKeys.some(
          (key) => JSON.stringify(history.state[key]) !== JSON.stringify(newState[key])
        )
        if (!hasChange) {
          history.setState(newState, true) // 更新狀態但不記錄歷史
          return
        }
      }

      history.setState(newState, false)
    },
    [history, compareKeys]
  )

  return {
    ...history,
    setState: setStateWithDiff,
  }
}
