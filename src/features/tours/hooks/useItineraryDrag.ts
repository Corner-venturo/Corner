'use client'

import { useState, useCallback } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { DailyScheduleItem } from '../components/itinerary/DayRow'

export function useItineraryDrag(
  setDailySchedule: React.Dispatch<React.SetStateAction<DailyScheduleItem[]>>
) {
  const [activeDragName, setActiveDragName] = useState<string | null>(null)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const name = event.active.data.current?.resourceName as string | undefined
    setActiveDragName(name || null)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragName(null)
    const { active, over } = event
    if (!over) return

    const overId = String(over.id)
    const data = active.data.current
    if (!data) return
    const resourceType = data.type as string
    const resourceId = data.resourceId as string
    const resourceName = data.resourceName as string

    // Parse drop zone ID: {zoneType}-drop-{dayIndex}
    const dropMatch = overId.match(/^(attraction|hotel|meal-breakfast|meal-lunch|meal-dinner)-drop-(\d+)$/)
    if (!dropMatch) return
    const zoneType = dropMatch[1]
    const dayIndex = parseInt(dropMatch[2], 10)
    if (isNaN(dayIndex)) return

    // Type validation
    if (zoneType === 'attraction' && resourceType !== 'attraction') return
    if (zoneType === 'hotel' && resourceType !== 'hotel') return
    if (zoneType.startsWith('meal-') && resourceType !== 'restaurant') return

    if (zoneType === 'attraction') {
      setDailySchedule(prev => {
        const newSchedule = [...prev]
        const day = newSchedule[dayIndex]
        if (!day) return prev
        const existing = day.attractions || []
        if (existing.some(a => a.id === resourceId)) return prev
        const newAttractions = [...existing, { id: resourceId, name: resourceName }]
        // 不再 append 到 route 文字 — 景點以卡片顯示，route 留給手動備註
        newSchedule[dayIndex] = { ...day, attractions: newAttractions }
        return newSchedule
      })
    } else if (zoneType === 'hotel') {
      setDailySchedule(prev => {
        const newSchedule = [...prev]
        const day = newSchedule[dayIndex]
        if (!day) return prev
        newSchedule[dayIndex] = { ...day, accommodation: resourceName, accommodationId: resourceId, sameAsPrevious: false }
        return newSchedule
      })
    } else if (zoneType === 'meal-breakfast') {
      setDailySchedule(prev => {
        const newSchedule = [...prev]
        const day = newSchedule[dayIndex]
        if (!day) return prev
        newSchedule[dayIndex] = { ...day, meals: { ...day.meals, breakfast: resourceName }, mealIds: { ...day.mealIds, breakfast: resourceId }, hotelBreakfast: false }
        return newSchedule
      })
    } else if (zoneType === 'meal-lunch') {
      setDailySchedule(prev => {
        const newSchedule = [...prev]
        const day = newSchedule[dayIndex]
        if (!day) return prev
        newSchedule[dayIndex] = { ...day, meals: { ...day.meals, lunch: resourceName }, mealIds: { ...day.mealIds, lunch: resourceId }, lunchSelf: false }
        return newSchedule
      })
    } else if (zoneType === 'meal-dinner') {
      setDailySchedule(prev => {
        const newSchedule = [...prev]
        const day = newSchedule[dayIndex]
        if (!day) return prev
        newSchedule[dayIndex] = { ...day, meals: { ...day.meals, dinner: resourceName }, mealIds: { ...day.mealIds, dinner: resourceId }, dinnerSelf: false }
        return newSchedule
      })
    }
  }, [setDailySchedule])

  return { activeDragName, handleDragStart, handleDragEnd }
}
