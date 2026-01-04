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
  onMove: (newStartTime: string, newDayOfWeek?: number) => Promise<void>
  // 用於計算跨天拖曳的參考
  dayColumnWidth?: number
  gridContainerRef?: React.RefObject<HTMLElement>
}

interface UseTimeboxDragReturn {
  isDragging: boolean
  previewStartTime: string
  previewDayOfWeek: number
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
  dayColumnWidth,
  gridContainerRef,
}: UseTimeboxDragProps): UseTimeboxDragReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [previewStartTime, setPreviewStartTime] = useState(initialStartTime)
  const [previewDayOfWeek, setPreviewDayOfWeek] = useState(dayOfWeek)
  const [hasConflict, setHasConflict] = useState(false)

  const startYRef = useRef<number>(0)
  const startXRef = useRef<number>(0)
  const startMinutesRef = useRef<number>(timeToMinutes(initialStartTime))
  const startDayOfWeekRef = useRef<number>(dayOfWeek)
  const columnWidthRef = useRef<number>(0)

  // 更新初始值
  useEffect(() => {
    if (!isDragging) {
      setPreviewStartTime(initialStartTime)
      setPreviewDayOfWeek(dayOfWeek)
    }
  }, [initialStartTime, dayOfWeek, isDragging])

  // 衝突檢測（支援跨天）
  const checkConflict = useCallback(
    (newStartTime: string, newDayOfWeek: number): boolean => {
      const startMinutes = timeToMinutes(newStartTime)
      const endMinutes = startMinutes + duration

      return allScheduledBoxes.some((box) => {
        if (box.id === scheduledBoxId) return false
        if (box.day_of_week !== newDayOfWeek) return false

        const boxStart = timeToMinutes(box.start_time)
        const boxEnd = boxStart + box.duration

        return startMinutes < boxEnd && endMinutes > boxStart
      })
    },
    [allScheduledBoxes, scheduledBoxId, duration]
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

  // 計算新的星期幾
  const calculateNewDayOfWeek = useCallback(
    (deltaX: number): number => {
      if (!columnWidthRef.current) return startDayOfWeekRef.current

      // 計算移動了幾欄
      const dayDelta = Math.round(deltaX / columnWidthRef.current)
      let newDay = startDayOfWeekRef.current + dayDelta

      // 限制在 0-6 範圍內（週日到週六）
      newDay = Math.max(0, Math.min(6, newDay))

      return newDay
    },
    []
  )

  // 計算預覽位置
  const previewTopOffset = ((timeToMinutes(previewStartTime) - startHour * 60) / slotMinutes) * slotHeight

  // 處理拖曳移動
  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      const deltaY = e.clientY - startYRef.current
      const deltaX = e.clientX - startXRef.current

      const newStartTime = calculateNewStartTime(deltaY)
      const newDayOfWeek = calculateNewDayOfWeek(deltaX)

      setPreviewStartTime(newStartTime)
      setPreviewDayOfWeek(newDayOfWeek)
      setHasConflict(checkConflict(newStartTime, newDayOfWeek))
    },
    [calculateNewStartTime, calculateNewDayOfWeek, checkConflict]
  )

  // 處理拖曳結束
  const handleDragEnd = useCallback(async () => {
    setIsDragging(false)

    document.removeEventListener('pointermove', handleDragMove)
    document.removeEventListener('pointerup', handleDragEnd)

    // 如果沒有衝突且位置有變化，保存
    const timeChanged = previewStartTime !== initialStartTime
    const dayChanged = previewDayOfWeek !== dayOfWeek

    if (!hasConflict && (timeChanged || dayChanged)) {
      await onMove(previewStartTime, dayChanged ? previewDayOfWeek : undefined)
    } else {
      // 回彈到原始值
      setPreviewStartTime(initialStartTime)
      setPreviewDayOfWeek(dayOfWeek)
    }

    setHasConflict(false)
  }, [hasConflict, previewStartTime, previewDayOfWeek, initialStartTime, dayOfWeek, onMove, handleDragMove])

  // 處理拖曳開始
  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()

      setIsDragging(true)
      startYRef.current = e.clientY
      startXRef.current = e.clientX
      startMinutesRef.current = timeToMinutes(previewStartTime)
      startDayOfWeekRef.current = previewDayOfWeek

      // 計算欄位寬度（用於跨天拖曳）
      if (gridContainerRef?.current) {
        // 取得 grid 容器寬度，除以 8（時間軸 + 7 天）
        const gridWidth = gridContainerRef.current.offsetWidth
        columnWidthRef.current = gridWidth / 8
      } else if (dayColumnWidth) {
        columnWidthRef.current = dayColumnWidth
      } else {
        // 預設估算值
        columnWidthRef.current = 120
      }

      document.addEventListener('pointermove', handleDragMove)
      document.addEventListener('pointerup', handleDragEnd)
    },
    [previewStartTime, previewDayOfWeek, handleDragMove, handleDragEnd, dayColumnWidth, gridContainerRef]
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
    previewDayOfWeek,
    previewTopOffset,
    hasConflict,
    handleDragStart,
  }
}
