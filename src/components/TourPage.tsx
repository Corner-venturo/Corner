"use client";

import { useTourScrollEffects } from "@/features/tours/hooks/useTourScrollEffects";
import { useTourGallery } from "@/features/tours/hooks/useTourGallery";
import { useTourItineraryNav } from "@/features/tours/hooks/useTourItineraryNav";
import { TourHeroSection } from "@/features/tours/components/sections/TourHeroSection";
import { TourFlightSection } from "@/features/tours/components/sections/TourFlightSection";
import { TourFeaturesSection } from "@/features/tours/components/sections/TourFeaturesSection";
import { TourAttractionsSection } from "@/features/tours/components/sections/TourAttractionsSection";
import { TourItinerarySection } from "@/features/tours/components/sections/TourItinerarySection";
import { TourLeaderSection } from "@/features/tours/components/sections/TourLeaderSection";
import { TourHotelsSection } from "@/features/tours/components/sections/TourHotelsSection";
import { TourContactSection } from "@/features/tours/components/sections/TourContactSection";
import { TourNavigation } from "@/features/tours/components/sections/TourNavigation";
import { TourGalleryOverlay } from "@/features/tours/components/sections/TourGalleryOverlay";

interface TourPageProps {
  data: any;
  isPreview?: boolean;
  viewMode?: 'desktop' | 'mobile';
}

export default function TourPage({ data, isPreview = false, viewMode = 'desktop' }: TourPageProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : [];
  const focusCards = data.focusCards || [];

  // Custom hooks
  const { scrollOpacity, attractionsProgress } = useTourScrollEffects({ viewMode, isPreview });
  const { showGallery, currentImageIndex, setCurrentImageIndex, galleryRef, closeGallery } = useTourGallery({ viewMode });
  const { activeDayIndex, dayRefs, handleDayNavigate } = useTourItineraryNav(dailyItinerary);

  return (
    <div className={viewMode === 'mobile' ? 'min-h-screen bg-gray-50' : 'min-h-screen bg-white'}>
      {/* Navigation */}
      <TourNavigation
        data={data}
        scrollOpacity={scrollOpacity}
        isPreview={isPreview}
        viewMode={viewMode}
      />

      {/* Hero Section */}
      <TourHeroSection data={data} viewMode={viewMode} />

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Flight Section */}
      <TourFlightSection data={data} viewMode={viewMode} />

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Features Section */}
      <TourFeaturesSection data={data} viewMode={viewMode} />

      {/* Divider */}
      {viewMode !== 'mobile' && <div className="border-t border-border"></div>}

      {/* Attractions Section */}
      <TourAttractionsSection
        data={data}
        viewMode={viewMode}
        attractionsProgress={attractionsProgress}
        galleryRef={galleryRef}
      />

      {/* Divider */}
      {viewMode !== 'mobile' && <div className="border-t border-border"></div>}

      {/* Itinerary Section */}
      <TourItinerarySection
        data={data}
        viewMode={viewMode}
        activeDayIndex={activeDayIndex}
        dayRefs={dayRefs}
        handleDayNavigate={handleDayNavigate}
      />

      {/* Divider */}
      {data.showLeaderMeeting !== false && <div className="border-t border-border"></div>}

      {/* Leader and Meeting Section */}
      {data.showLeaderMeeting !== false && (
        <TourLeaderSection data={data} viewMode={viewMode} />
      )}

      {/* Hotels Section */}
      {data.showHotels !== false && data.hotels && data.hotels.length > 0 && (
        <>
          <div className="border-t border-border"></div>
          <TourHotelsSection data={data} viewMode={viewMode} />
        </>
      )}

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Contact Section */}
      <TourContactSection data={data} viewMode={viewMode} />

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Corner Travel</h3>
            <p className="text-slate-300 mb-8">探索世界，創造回憶</p>
            <p className="text-slate-400 text-sm">
              © 2025 Corner Travel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Gallery Overlay - Mobile only */}
      {viewMode === 'mobile' && (
        <TourGalleryOverlay
          showGallery={showGallery}
          focusCards={focusCards}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
          onClose={closeGallery}
        />
      )}
    </div>
  );
}
