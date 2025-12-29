'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { type TimeboxScheduledBox } from './useTimeboxData'

interface UseTimeboxDragProps {
  scheduledBoxId: string
  dayOfWeek: number
  initialStartTime: string
  duration: number
  slotHeight: number
  slotMinutes: number
  startHour: number
  allScheduledBoxes: TimeboxScheduledBox[]
  onMove: (newStartTime: string) => Promise<void>
}

interface UseTimeboxDragReturn {
  isDragging: boolean
  previewStartTime: string
  previewTopOffset: number
  hasConflict: boolean
  handleDragStart: (e: React.PointerEvent) => void
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
}

export function useTimeboxDrag({
  scheduledBoxId,
  dayOfWeek,
  initialStartTime,
  duration,
  slotHeight,
  slotMinutes,
  startHour,
  allScheduledBoxes,
  onMove,
}: UseTimeboxDragProps): UseTimeboxDragReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [previewStartTime, setPreviewStartTime] = useState(initialStartTime)
  const [hasConflict, setHasConflict] = useState(false)

  const startYRef = useRef<number>(0)
  const startMinutesRef = useRef<number>(timeToMinutes(initialStartTime))

  // 更新初始值
  useEffect(() => {
    if (!isDragging) {
      setPreviewStartTime(initialStartTime)
    }
  }, [initialStartTime, isDragging])

  // 衝突檢測
  const checkConflict = useCallback(
    (newStartTime: string): boolean => {
      const startMinutes = timeToMinutes(newStartTime)
      const endMinutes = startMinutes + duration

      return allScheduledBoxes.some((box) => {
        if (box.id === scheduledBoxId) return false
        if (box.day_of_week !== dayOfWeek) return false

        const boxStart = timeToMinutes(box.start_time)
        const boxEnd = boxStart + box.duration

        return startMinutes < boxEnd && endMinutes > boxStart
      })
    },
    [allScheduledBoxes, scheduledBoxId, dayOfWeek, duration]
  )

  // 計算新開始時間
  const calculateNewStartTime = useCallback(
    (deltaY: number): string => {
      const deltaMinutes = (deltaY / slotHeight) * slotMinutes
      const rawMinutes = startMinutesRef.current + deltaMinutes

      // 取整到最近的時間格
      const roundedMinutes = Math.round(rawMinutes / slotMinutes) * slotMinutes

      // 邊界限制
      const minMinutes = startHour * 60 // 06:00
      const maxMinutes = 24 * 60 - duration // 確保結束時間不超過 24:00

      const clampedMinutes = Math.max(minMinutes, Math.min(maxMinutes, roundedMinutes))

      return minutesToTime(clampedMinutes)
    },
    [slotHeight, slotMinutes, startHour, duration]
  )

  // 計算預覽位置
  const previewTopOffset = ((timeToMinutes(previewStartTime) - startHour * 60) / slotMinutes) * slotHeight

  // 處理拖曳移動
  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      const deltaY = e.clientY - startYRef.current
      const newStartTime = calculateNewStartTime(deltaY)

      setPreviewStartTime(newStartTime)
      setHasConflict(checkConflict(newStartTime))
    },
    [calculateNewStartTime, checkConflict]
  )

  // 處理拖曳結束
  const handleDragEnd = useCallback(async () => {
    setIsDragging(false)

    document.removeEventListener('pointermove', handleDragMove)
    document.removeEventListener('pointerup', handleDragEnd)

    // 如果沒有衝突且位置有變化，保存
    if (!hasConflict && previewStartTime !== initialStartTime) {
      await onMove(previewStartTime)
    } else {
      // 回彈到原始值
      setPreviewStartTime(initialStartTime)
    }

    setHasConflict(false)
  }, [hasConflict, previewStartTime, initialStartTime, onMove, handleDragMove])

  // 處理拖曳開始
  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      // 不 stopPropagation，讓 resize handle 可以攔截

      setIsDragging(true)
      startYRef.current = e.clientY
      startMinutesRef.current = timeToMinutes(previewStartTime)

      document.addEventListener('pointermove', handleDragMove)
      document.addEventListener('pointerup', handleDragEnd)
    },
    [previewStartTime, handleDragMove, handleDragEnd]
  )

  // 清理事件監聽器
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handleDragMove)
      document.removeEventListener('pointerup', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  return {
    isDragging,
    previewStartTime,
    previewTopOffset,
    hasConflict,
    handleDragStart,
  }
}
