"use client";

import React from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRegionStoreNew } from "@/stores";
import { TourFormData } from "./tour-form/types";
import { useRegionData } from "./tour-form/hooks/useRegionData";
import { useTourFormHandlers } from "./tour-form/hooks/useTourFormHandlers";
import { CoverInfoSection } from "./tour-form/sections/CoverInfoSection";
import { CountriesSection } from "./tour-form/sections/CountriesSection";
import { FlightInfoSection } from "./tour-form/sections/FlightInfoSection";
import { FeaturesSection } from "./tour-form/sections/FeaturesSection";
import { FocusCardsSection } from "./tour-form/sections/FocusCardsSection";
import { LeaderMeetingSection } from "./tour-form/sections/LeaderMeetingSection";
import { HotelSection } from "./tour-form/sections/HotelSection";
import { DailyItinerarySection } from "./tour-form/sections/DailyItinerarySection";

interface TourFormProps {
  data: TourFormData;
  onChange: (data: TourFormData) => void;
}

export function TourForm({ data, onChange }: TourFormProps) {
  const { user } = useAuthStore();
  const { countries, cities } = useRegionStoreNew();

  const {
    selectedCountry,
    setSelectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    allDestinations,
    availableCities,
    countryNameToCode,
  } = useRegionData(data);

  const handlers = useTourFormHandlers(data, onChange, selectedCountry);

  // 根據 country_id 取得城市列表的輔助函數
  const getCitiesByCountryId = (countryId: string) => {
    return cities
      .filter(c => c.country_id === countryId && c.is_active)
      .map(c => ({ id: c.id, code: c.airport_code || c.name, name: c.name }));
  };

  // 取得所有國家列表
  const allCountries = countries
    .filter(c => c.is_active)
    .map(c => ({ id: c.id, code: c.code || '', name: c.name }));

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

      <CountriesSection
        data={data}
        allCountries={allCountries}
        availableCities={availableCities}
        getCitiesByCountryId={getCitiesByCountryId}
        onChange={onChange}
      />

      <FlightInfoSection
        data={data}
        updateFlightField={handlers.updateFlightField}
      />

      <FeaturesSection
        data={data}
        addFeature={handlers.addFeature}
        updateFeature={handlers.updateFeature}
        removeFeature={handlers.removeFeature}
      />

      <FocusCardsSection
        data={data}
        addFocusCard={handlers.addFocusCard}
        updateFocusCard={handlers.updateFocusCard}
        removeFocusCard={handlers.removeFocusCard}
      />

      <LeaderMeetingSection
        data={data}
        updateNestedField={handlers.updateNestedField}
        updateField={handlers.updateField}
      />

      <HotelSection
        data={data}
        updateField={handlers.updateField}
      />

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
    </div>
  );
}
