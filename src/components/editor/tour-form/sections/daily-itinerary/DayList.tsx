'use client'

import React from 'react'
import { DailyItinerary, TourFormData, Activity } from '../../types'
import { DayCard } from './DayCard'

interface DayListProps {
  data: TourFormData
  dayLabels: string[]
  updateDailyItinerary: (index: number, field: string, value: unknown) => void
  removeDailyItinerary: (index: number) => void
  swapDailyItinerary?: (fromIndex: number, toIndex: number) => void
  addActivity: (dayIndex: number) => void
  updateActivity: (dayIndex: number, actIndex: number, field: string, value: string) => void
  removeActivity: (dayIndex: number, actIndex: number) => void
  reorderActivities?: (dayIndex: number, activities: Activity[]) => void
  addRecommendation: (dayIndex: number) => void
  updateRecommendation: (dayIndex: number, recIndex: number, value: string) => void
  removeRecommendation: (dayIndex: number, recIndex: number) => void
  updateField: (field: string, value: unknown) => void
  onOpenAttractionSelector: (dayIndex: number) => void
  onOpenHotelSelector: (dayIndex: number) => void
  onOpenRestaurantSelector: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => void
  handleActivityImageUpload: (dayIndex: number, actIndex: number, file: File) => Promise<void>
  onOpenPositionEditor: (dayIndex: number, actIndex: number) => void
}

export function DayList({
  data,
  dayLabels,
  updateDailyItinerary,
  removeDailyItinerary,
  swapDailyItinerary,
  addActivity,
  updateActivity,
  removeActivity,
  reorderActivities,
  addRecommendation,
  updateRecommendation,
  removeRecommendation,
  updateField,
  onOpenAttractionSelector,
  onOpenHotelSelector,
  onOpenRestaurantSelector,
  handleActivityImageUpload,
  onOpenPositionEditor,
}: DayListProps) {
  return (
    <>
      {data.dailyItinerary?.map((day: DailyItinerary, dayIndex: number) => (
        <DayCard
          key={dayIndex}
          day={day}
          dayIndex={dayIndex}
          dayLabel={dayLabels[dayIndex]}
          data={data}
          updateDailyItinerary={updateDailyItinerary}
          removeDailyItinerary={removeDailyItinerary}
          swapDailyItinerary={swapDailyItinerary}
          addActivity={addActivity}
          updateActivity={updateActivity}
          removeActivity={removeActivity}
          reorderActivities={reorderActivities}
          addRecommendation={addRecommendation}
          updateRecommendation={updateRecommendation}
          removeRecommendation={removeRecommendation}
          updateField={updateField}
          onOpenAttractionSelector={onOpenAttractionSelector}
          onOpenHotelSelector={onOpenHotelSelector}
          onOpenRestaurantSelector={onOpenRestaurantSelector}
          handleActivityImageUpload={handleActivityImageUpload}
          onOpenPositionEditor={onOpenPositionEditor}
        />
      ))}
    </>
  )
}
