'use client'

import { motion } from 'framer-motion'
import { MutableRefObject } from 'react'
import { TourFormData } from '@/components/editor/tour-form/types'
import { ART } from './utils/art-theme'
import { useImageGallery } from './hooks/useImageGallery'
import {
  calculateDayLabels,
  calculateDayDate,
  isLastMainDay,
  getDayImages,
} from './hooks/useDayCalculations'
import { ImageGalleryModal } from './components/ImageGalleryModal'
import { MobileDaySection } from './components/MobileDaySection'
import { DaySection } from './components/DaySection'

interface TourItinerarySectionArtProps {
  data: TourFormData
  viewMode: 'desktop' | 'mobile'
  activeDayIndex: number
  dayRefs: MutableRefObject<(HTMLDivElement | null)[]>
  handleDayNavigate: (index: number) => void
}

export function TourItinerarySectionArt({
  data,
  viewMode,
  activeDayIndex,
  dayRefs,
  handleDayNavigate,
}: TourItinerarySectionArtProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []
  const dayLabels = calculateDayLabels(dailyItinerary)
  const isMobile = viewMode === 'mobile'

  const {
    imageGallery,
    openImageGallery,
    closeImageGallery,
    goToPreviousImage,
    goToNextImage,
    selectImageIndex,
  } = useImageGallery()

  return (
    <section
      id="itinerary"
      className="relative overflow-hidden"
      style={{ backgroundColor: ART.ink }}
    >
      {/* 背景裝飾線 */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-card/10 hidden lg:block" />
      <div className="absolute top-0 left-2/4 w-px h-full bg-card/10 hidden lg:block" />
      <div className="absolute top-0 left-3/4 w-px h-full bg-card/10 hidden lg:block" />

      {/* Section 標題 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`text-center relative z-10 ${isMobile ? 'py-16 px-4' : 'py-24'}`}
      >
        <h2
          className={`font-black leading-none tracking-tight text-white ${isMobile ? 'text-5xl' : 'text-7xl'}`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          CHRONICLES
        </h2>
        <div className="w-24 h-1 mx-auto mt-6" style={{ backgroundColor: ART.clay }} />
      </motion.div>

      {/* 每日行程 - 根據 displayStyle 切換不同佈局 */}
      <div className="relative z-10">
        {dailyItinerary.map((day, index) => {
          const dayNumber = dayLabels[index].replace('Day ', '')
          const numericDay = parseInt(dayNumber.split('-')[0], 10)
          const dateInfo = calculateDayDate(data.departureDate, numericDay)
          const allImages = getDayImages(day)
          const isLastDay = isLastMainDay(dailyItinerary, index)
          const displayStyle = day.displayStyle || 'single-image'

          return (
            <div
              key={`day-${index}`}
              id={`day-${index + 1}`}
              ref={el => { dayRefs.current[index] = el as HTMLDivElement | null }}
            >
              {isMobile ? (
                <MobileDaySection
                  day={day}
                  index={index}
                  numericDay={numericDay}
                  dateInfo={dateInfo}
                  allImages={allImages}
                  isLastDay={isLastDay}
                  onImageClick={openImageGallery}
                />
              ) : (
                <DaySection
                  day={day}
                  index={index}
                  numericDay={numericDay}
                  dateInfo={dateInfo}
                  allImages={allImages}
                  isLastDay={isLastDay}
                  displayStyle={displayStyle}
                  onImageClick={openImageGallery}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Image Gallery Modal */}
      {imageGallery && (
        <ImageGalleryModal
          imageGallery={imageGallery}
          onClose={closeImageGallery}
          onPrev={goToPreviousImage}
          onNext={goToNextImage}
          onSelectIndex={selectImageIndex}
        />
      )}
    </section>
  )
}
