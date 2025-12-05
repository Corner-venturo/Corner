'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTourScrollEffects } from '@/features/tours/hooks/useTourScrollEffects'
import { useTourItineraryNav } from '@/features/tours/hooks/useTourItineraryNav'
import { TourHeroSection } from '@/features/tours/components/sections/TourHeroSection'
import { TourFlightSection } from '@/features/tours/components/sections/TourFlightSection'
import { TourFeaturesSection } from '@/features/tours/components/sections/TourFeaturesSection'
import { TourItinerarySection } from '@/features/tours/components/sections/TourItinerarySection'
import { TourLeaderSection } from '@/features/tours/components/sections/TourLeaderSection'
import { TourHotelsSection } from '@/features/tours/components/sections/TourHotelsSection'
import { TourNavigation } from '@/features/tours/components/sections/TourNavigation'
import { COMPANY } from '@/lib/constants/company'

interface TourPageProps {
  data: any
  isPreview?: boolean
  viewMode?: 'desktop' | 'mobile'
}

export default function TourPage({ data, isPreview = false, viewMode = 'desktop' }: TourPageProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)

  // Custom hooks
  const { scrollOpacity } = useTourScrollEffects({ viewMode, isPreview })
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
          logger.log('No company logo found')
          return
        }

        const { data: urlData } = supabase.storage
          .from('company-assets')
          .getPublicUrl(assets.file_path)

        if (urlData?.publicUrl) {
          setCompanyLogoUrl(urlData.publicUrl)
        }
      } catch (error) {
        logger.error('Error fetching company logo:', error)
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

      {/* Features Section - 只有當 features 有資料時才顯示 */}
      {data.showFeatures !== false && data.features?.length > 0 && (
        <>
          {/* Divider */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-border"></div>
          </div>

          <TourFeaturesSection data={data} viewMode={viewMode} />

          {/* Divider */}
          {viewMode !== 'mobile' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-t border-border"></div>
            </div>
          )}
        </>
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
      {(data.leader?.name || data.leader?.phone || data.meetingInfo?.time || data.meetingInfo?.location || (data.meetingPoints && data.meetingPoints.length > 0)) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Leader and Meeting Section - 有資料才顯示 */}
      {(data.leader?.name || data.leader?.phone || data.meetingInfo?.time || data.meetingInfo?.location || (data.meetingPoints && data.meetingPoints.length > 0)) && (
        <TourLeaderSection data={data} viewMode={viewMode} />
      )}

      {/* Divider */}
      {data.showHotels !== false && data.hotels && data.hotels.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Hotels Section */}
      {data.showHotels !== false && data.hotels && data.hotels.length > 0 && (
        <TourHotelsSection data={data} viewMode={viewMode} />
      )}

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
                <h3 className="text-2xl font-bold text-morandi-gold">
                  {COMPANY.name}
                </h3>
              )}
            </div>
            <p className="text-slate-300 mb-6 text-sm">{COMPANY.subtitle}</p>
            <p className="text-slate-500 text-xs">© 2025 Corner Travel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
