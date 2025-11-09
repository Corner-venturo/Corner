'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTourScrollEffects } from '@/features/tours/hooks/useTourScrollEffects'
import { useTourItineraryNav } from '@/features/tours/hooks/useTourItineraryNav'
import { TourHeroSection } from '@/features/tours/components/sections/TourHeroSection'
import { TourFlightSection } from '@/features/tours/components/sections/TourFlightSection'
import { TourFeaturesSection } from '@/features/tours/components/sections/TourFeaturesSection'
import { TourAttractionsSection } from '@/features/tours/components/sections/TourAttractionsSection'
import { TourItinerarySection } from '@/features/tours/components/sections/TourItinerarySection'
import { TourLeaderSection } from '@/features/tours/components/sections/TourLeaderSection'
import { TourHotelsSection } from '@/features/tours/components/sections/TourHotelsSection'
import { TourContactSection } from '@/features/tours/components/sections/TourContactSection'
import { TourNavigation } from '@/features/tours/components/sections/TourNavigation'

interface TourPageProps {
  data: any
  isPreview?: boolean
  viewMode?: 'desktop' | 'mobile'
}

export default function TourPage({ data, isPreview = false, viewMode = 'desktop' }: TourPageProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)

  // Custom hooks
  const { scrollOpacity, attractionsProgress } = useTourScrollEffects({ viewMode, isPreview })
  const { activeDayIndex, dayRefs, handleDayNavigate } = useTourItineraryNav(dailyItinerary)

  // 載入公司 LOGO
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        const { data: assets, error } = await supabase
          .from('company_assets')
          .select('file_path')
          .eq('category', 'logos')
          .limit(1)
          .single()

        if (error || !assets) {
          console.log('No company logo found')
          return
        }

        const { data: urlData } = supabase.storage
          .from('company-assets')
          .getPublicUrl(assets.file_path)

        if (urlData?.publicUrl) {
          setCompanyLogoUrl(urlData.publicUrl)
        }
      } catch (error) {
        console.error('Error fetching company logo:', error)
      }
    }

    fetchCompanyLogo()
  }, [])

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-border"></div>
      </div>

      {/* Flight Section */}
      <TourFlightSection data={data} viewMode={viewMode} />

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-border"></div>
      </div>

      {/* Features Section */}
      <TourFeaturesSection data={data} viewMode={viewMode} />

      {/* Divider */}
      {viewMode !== 'mobile' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Attractions Section */}
      <TourAttractionsSection
        data={data}
        viewMode={viewMode}
        attractionsProgress={attractionsProgress}
      />

      {/* Divider */}
      {viewMode !== 'mobile' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

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
      {data.showLeaderMeeting !== false && <TourLeaderSection data={data} viewMode={viewMode} />}

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
            {/* Company Logo */}
            <div className="flex justify-center mb-3">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt="Company Logo"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <svg
                  className="h-6 w-auto text-morandi-gold"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="4" />
                  <path
                    d="M100 40 L120 80 L165 85 L130 115 L140 160 L100 135 L60 160 L70 115 L35 85 L80 80 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <circle cx="100" cy="100" r="25" fill="currentColor" opacity="0.8" />
                </svg>
              )}
            </div>
            <p className="text-slate-300 mb-6 text-sm">如果可以，讓我們一起探索世界上每個角落</p>
            <p className="text-slate-500 text-xs">© 2025 Corner Travel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
