'use client'

import React from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRegionsStore } from '@/stores'
import { TourFormData } from './tour-form/types'
import { useRegionData } from './tour-form/hooks/useRegionData'
import { useTourFormHandlers } from './tour-form/hooks/useTourFormHandlers'
import { CoverInfoSection } from './tour-form/sections/CoverInfoSection'
import { CountriesSection } from './tour-form/sections/CountriesSection'
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
  const { countries, cities } = useRegionsStore()

  const {
    selectedCountry,
    setSelectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  } = useRegionData(data)

  const handlers = useTourFormHandlers(data, onChange, selectedCountry)

  // 根據 country_id 取得城市列表的輔助函數（穩定引用）
  const getCitiesByCountryId = React.useCallback(
    (countryId: string) => {
      return cities
        .filter(c => c.country_id === countryId && c.is_active)
        .map(c => ({ id: c.id, code: c.airport_code || c.name, name: c.name }))
    },
    [cities]
  )

  // 取得所有國家列表（穩定引用，避免無限循環）
  const allCountries = React.useMemo(
    () =>
      countries.filter(c => c.is_active).map(c => ({ id: c.id, code: c.code || '', name: c.name })),
    [countries]
  )

  return (
    <div className="p-6 space-y-8">
      <CoverInfoSection
        data={data}
        user={user}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        setSelectedCountryCode={setSelectedCountryCode}
        allDestinations={allDestinations as any}
        availableCities={availableCities as any}
        countryNameToCode={countryNameToCode}
        updateField={handlers.updateField}
        updateCity={handlers.updateCity}
        onChange={onChange}
      />

      <CountriesSection
        data={data}
        allCountries={allCountries}
        availableCities={availableCities}
        getCitiesByCountryId={getCitiesByCountryId as any}
        onChange={onChange}
      />

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
