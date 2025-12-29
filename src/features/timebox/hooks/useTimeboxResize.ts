'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { type TimeboxScheduledBox } from './useTimeboxData'

interface UseTimeboxResizeProps {
  scheduledBoxId: string
  initialDuration: number
  dayOfWeek: number
  startTime: string
  slotHeight: number
  slotMinutes: number
  allScheduledBoxes: TimeboxScheduledBox[]
  onResize: (newDuration: number) => Promise<void>
}

interface UseTimeboxResizeReturn {
  isResizing: boolean
  previewDuration: number
  hasConflict: boolean
  handleResizeStart: (e: React.PointerEvent) => void
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function useTimeboxResize({
  scheduledBoxId,
  initialDuration,
  dayOfWeek,
  startTime,
  slotHeight,
  slotMinutes,
  allScheduledBoxes,
  onResize,
}: UseTimeboxResizeProps): UseTimeboxResizeReturn {
  const [isResizing, setIsResizing] = useState(false)
  const [previewDuration, setPreviewDuration] = useState(initialDuration)
  const [hasConflict, setHasConflict] = useState(false)

  const startYRef = useRef<number>(0)
  const startDurationRef = useRef<number>(initialDuration)

  // 更新初始值
  useEffect(() => {
    if (!isResizing) {
      setPreviewDuration(initialDuration)
    }
  }, [initialDuration, isResizing])

  // 衝突檢測
  const checkConflict = useCallback(
    (newDuration: number): boolean => {
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = startMinutes + newDuration

      return allScheduledBoxes.some((box) => {
        if (box.id === scheduledBoxId) return false
        if (box.day_of_week !== dayOfWeek) return false

        const boxStart = timeToMinutes(box.start_time)
        const boxEnd = boxStart + box.duration

        return startMinutes < boxEnd && endMinutes > boxStart
      })
    },
    [allScheduledBoxes, scheduledBoxId, dayOfWeek, startTime]
  )

  // 計算新時長
  const calculateNewDuration = useCallback(
    (deltaY: number): number => {
      const deltaDuration = (deltaY / slotHeight) * slotMinutes
      const rawDuration = startDurationRef.current + deltaDuration

      // 取整到最近的時間格
      const roundedDuration = Math.round(rawDuration / slotMinutes) * slotMinutes

      // 邊界限制
      const minDuration = slotMinutes
      const maxDuration = 480 // 8 小時

      // 時間上限檢查（不能超過 24:00）
      const startMinutes = timeToMinutes(startTime)
      const maxAllowedDuration = Math.min(maxDuration, 24 * 60 - startMinutes)

      return Math.max(minDuration, Math.min(maxAllowedDuration, roundedDuration))
    },
    [slotHeight, slotMinutes, startTime]
  )

  // 處理拖曳移動
  const handleResizeMove = useCallback(
    (e: PointerEvent) => {
      const deltaY = e.clientY - startYRef.current
      const newDuration = calculateNewDuration(deltaY)

      setPreviewDuration(newDuration)
      setHasConflict(checkConflict(newDuration))
    },
    [calculateNewDuration, checkConflict]
  )

  // 處理拖曳結束
  const handleResizeEnd = useCallback(async () => {
    setIsResizing(false)

    document.removeEventListener('pointermove', handleResizeMove)
    document.removeEventListener('pointerup', handleResizeEnd)

    // 如果沒有衝突且時長有變化，保存
    if (!hasConflict && previewDuration !== initialDuration) {
      await onResize(previewDuration)
    } else {
      // 回彈到原始值
      setPreviewDuration(initialDuration)
    }

    setHasConflict(false)
  }, [hasConflict, previewDuration, initialDuration, onResize, handleResizeMove])

  // 處理拖曳開始
  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setIsResizing(true)
      startYRef.current = e.clientY
      startDurationRef.current = previewDuration

      document.addEventListener('pointermove', handleResizeMove)
      document.addEventListener('pointerup', handleResizeEnd)
    },
    [previewDuration, handleResizeMove, handleResizeEnd]
  )

  // 清理事件監聽器
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handleResizeMove)
      document.removeEventListener('pointerup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])

  return {
    isResizing,
    previewDuration,
    hasConflict,
    handleResizeStart,
  }
}
