'use client'

import { DailyItinerary, DayDisplayStyle } from '@/components/editor/tour-form/types'
import { DayDateInfo } from '../hooks/useDayCalculations'
import { SingleImageLayout } from './layouts/SingleImageLayout'
import { MultiImageLayout } from './layouts/MultiImageLayout'
import { CardGridLayout } from './layouts/CardGridLayout'
import { TimelineLayout } from './layouts/TimelineLayout'

interface DaySectionProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: DayDateInfo | null
  allImages: string[]
  isLastDay: boolean
  displayStyle: DayDisplayStyle
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

export function DaySection({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  displayStyle,
  onImageClick,
}: DaySectionProps) {
  switch (displayStyle) {
    case 'single-image':
      return (
        <SingleImageLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    case 'multi-image':
      return (
        <MultiImageLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    case 'card-grid':
      return (
        <CardGridLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    case 'timeline':
      return (
        <TimelineLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    default:
      return (
        <SingleImageLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
  }
}
