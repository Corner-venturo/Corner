'use client'

import React from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { TourFormData } from './tour-form/types'
import { useRegionData } from './tour-form/hooks/useRegionData'
import { useTourFormHandlers } from './tour-form/hooks/useTourFormHandlers'
import { CoverInfoSection } from './tour-form/sections/CoverInfoSection'
// CountriesSection 已移除 - 景點選擇器現在可以直接選所有國家
import { FlightInfoSection } from './tour-form/sections/FlightInfoSection'
import { FeaturesSection } from './tour-form/sections/FeaturesSection'
import { LeaderMeetingSection } from './tour-form/sections/LeaderMeetingSection'
import { HotelSection } from './tour-form/sections/HotelSection'
import { DailyItinerarySection } from './tour-form/sections/DailyItinerarySection'

interface TourFormProps {
  data: TourFormData
  onChange: (data: TourFormData) => void
}

export function TourForm({ data, onChange }: TourFormProps) {
  const { user } = useAuthStore()

  const {
    selectedCountry,
    setSelectedCountry,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  } = useRegionData(data)

  const handlers = useTourFormHandlers(data, onChange, selectedCountry)

  return (
    <div className="p-6 space-y-8">
      <CoverInfoSection
        data={data}
        user={user}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        setSelectedCountryCode={setSelectedCountryCode}
        allDestinations={allDestinations}
        availableCities={availableCities}
        countryNameToCode={countryNameToCode}
        updateField={handlers.updateField}
        updateCity={handlers.updateCity}
        onChange={onChange}
      />

{/* CountriesSection 已移除 - 景點選擇器現在可以直接選所有國家 */}

      <FlightInfoSection data={data} updateFlightField={handlers.updateFlightField} />

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-morandi-container/10 rounded-lg border border-morandi-container/30">
          <input
            type="checkbox"
            id="showFeatures"
            checked={data.showFeatures !== false}
            onChange={e => onChange({ ...data, showFeatures: e.target.checked })}
            className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
          />
          <label htmlFor="showFeatures" className="text-sm font-medium text-morandi-primary cursor-pointer">
            顯示行程特色區塊
          </label>
        </div>

        {data.showFeatures !== false && (
          <FeaturesSection
            data={data}
            addFeature={handlers.addFeature}
            updateFeature={handlers.updateFeature}
            removeFeature={handlers.removeFeature}
            reorderFeature={handlers.reorderFeature}
          />
        )}
      </div>

      <DailyItinerarySection
        data={data}
        updateField={handlers.updateField}
        addDailyItinerary={handlers.addDailyItinerary}
        updateDailyItinerary={handlers.updateDailyItinerary}
        removeDailyItinerary={handlers.removeDailyItinerary}
        addActivity={handlers.addActivity}
        updateActivity={handlers.updateActivity}
        removeActivity={handlers.removeActivity}
        addDayImage={handlers.addDayImage}
        updateDayImage={handlers.updateDayImage}
        removeDayImage={handlers.removeDayImage}
        addRecommendation={handlers.addRecommendation}
        updateRecommendation={handlers.updateRecommendation}
        removeRecommendation={handlers.removeRecommendation}
      />

      <LeaderMeetingSection
        data={data}
        updateNestedField={handlers.updateNestedField}
        updateField={handlers.updateField}
      />

      <HotelSection data={data} updateField={handlers.updateField} />
    </div>
  )
}
