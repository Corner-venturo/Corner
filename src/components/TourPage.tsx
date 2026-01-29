'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTourScrollEffects } from '@/features/tours/hooks/useTourScrollEffects'
import { useTourItineraryNav } from '@/features/tours/hooks/useTourItineraryNav'
import { TourHeroSection } from '@/features/tours/components/sections/TourHeroSection'
import { TourHeroGemini } from '@/features/tours/components/sections/TourHeroGemini'
import { TourHeroNature } from '@/features/tours/components/sections/TourHeroNature'
import { TourHeroLuxury } from '@/features/tours/components/sections/TourHeroLuxury'
import { TourHeroArt } from '@/features/tours/components/sections/TourHeroArt'
import { TourHeroDreamscape } from '@/features/tours/components/sections/TourHeroDreamscape'
import { TourHeroCollage } from '@/features/tours/components/sections/TourHeroCollage'
import { TourFlightSection } from '@/features/tours/components/sections/TourFlightSection'
import { TourFeaturesSection } from '@/features/tours/components/sections/TourFeaturesSection'
import { TourItinerarySection } from '@/features/tours/components/sections/TourItinerarySection'
import { TourItinerarySectionLuxury } from '@/features/tours/components/sections/TourItinerarySectionLuxury'
import { TourItinerarySectionArt } from '@/features/tours/components/sections/TourItinerarySectionArt'
import { TourLeaderSection } from '@/features/tours/components/sections/TourLeaderSection'
import { TourHotelsSection } from '@/features/tours/components/sections/TourHotelsSection'
import { TourHotelsSectionLuxury } from '@/features/tours/components/sections/TourHotelsSectionLuxury'
import { TourFeaturesSectionLuxury } from '@/features/tours/components/sections/TourFeaturesSectionLuxury'
import { TourLeaderSectionLuxury } from '@/features/tours/components/sections/TourLeaderSectionLuxury'
import { TourPricingSection } from '@/features/tours/components/sections/TourPricingSection'
import { TourPricingSectionLuxury } from '@/features/tours/components/sections/TourPricingSectionLuxury'
import { TourPriceTiersSection } from '@/features/tours/components/sections/TourPriceTiersSection'
import { TourPriceTiersSectionLuxury } from '@/features/tours/components/sections/TourPriceTiersSectionLuxury'
import { TourFAQSection } from '@/features/tours/components/sections/TourFAQSection'
import { TourNoticesSection } from '@/features/tours/components/sections/TourNoticesSection'
import { TourNavigation } from '@/features/tours/components/sections/TourNavigation'
import { COMPANY } from '@/lib/constants/company'

interface TourPageProps {
  /**
   * 🔧 技術債：TourPageData 類型待統一
   * 
   * 目前問題：
   * - 5+ 個子組件各自定義 TourDisplayData
   * - 欄位散落在不同地方，難以統一
   * - 需要重構所有 section 組件才能解決
   * 
   * 資料來源：編輯器產生的複合資料結構
   * 包含：coverStyle, dailyItinerary, features, hotels, leader, pricing 等
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // 查詢 file_path 包含 logos/ 的資產（公司 LOGO 存放在 logos/ 資料夾）
        const { data: assets, error } = await supabase
          .from('company_assets')
          .select('file_path')
          .like('file_path', 'logos/%')
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
    <div className={viewMode === 'mobile' ? 'min-h-screen bg-muted' : 'min-h-screen bg-card'}>
      {/* Navigation */}
      <TourNavigation
        data={data}
        scrollOpacity={scrollOpacity}
        isPreview={isPreview}
        viewMode={viewMode}
      />

      {/* Hero Section - 根據 coverStyle 切換八種風格 */}
      <div id="top">
        {data.coverStyle === 'luxury' ? (
          <TourHeroLuxury data={data} viewMode={viewMode} />
        ) : data.coverStyle === 'art' ? (
          <TourHeroArt data={data} viewMode={viewMode} />
        ) : data.coverStyle === 'gemini' ? (
          <TourHeroGemini data={data} viewMode={viewMode} />
        ) : data.coverStyle === 'nature' ? (
          <TourHeroNature data={data} viewMode={viewMode} />
        ) : data.coverStyle === 'dreamscape' ? (
          <TourHeroDreamscape data={data} viewMode={viewMode} />
        ) : data.coverStyle === 'collage' ? (
          <TourHeroCollage data={data} viewMode={viewMode} />
        ) : (
          <TourHeroSection data={data} viewMode={viewMode} />
        )}
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-border"></div>
      </div>

      {/* Flight Section - TourFlightSection 內部會根據 flightStyle/coverStyle 決定顯示風格 */}
      <div id="flight">
        <TourFlightSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
      </div>

      {/* Features Section - 只有當 features 有資料時才顯示 */}
      {data.showFeatures !== false && data.features?.length > 0 && (
        <>
          {/* Divider */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-border"></div>
          </div>

          <div id="features">
            {(() => {
              // 優先使用 featuresStyle，否則 fallback 到 coverStyle
              const effectiveFeaturesStyle = data.featuresStyle ||
                (data.coverStyle === 'luxury' ? 'luxury' :
                 data.coverStyle === 'collage' ? 'collage' : 'original')

              if (effectiveFeaturesStyle === 'luxury') {
                return <TourFeaturesSectionLuxury data={data} viewMode={viewMode} />
              } else {
                return <TourFeaturesSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} featuresStyle={effectiveFeaturesStyle} />
              }
            })()}
          </div>

          {/* Divider */}
          {viewMode !== 'mobile' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-t border-border"></div>
            </div>
          )}
        </>
      )}

      {/* Itinerary Section */}
      <div id="itinerary">
        {(() => {
          // 優先使用 itineraryStyle，否則 fallback 到 coverStyle
          const effectiveStyle = data.itineraryStyle ||
            (data.coverStyle === 'luxury' ? 'luxury' :
             data.coverStyle === 'art' ? 'art' :
             data.coverStyle === 'dreamscape' ? 'dreamscape' : 'original')

          if (effectiveStyle === 'luxury') {
            return (
              <TourItinerarySectionLuxury
                data={data}
                viewMode={viewMode}
                activeDayIndex={activeDayIndex}
                dayRefs={dayRefs}
                handleDayNavigate={handleDayNavigate}
              />
            )
          } else if (effectiveStyle === 'art') {
            return (
              <TourItinerarySectionArt
                data={data}
                viewMode={viewMode}
                activeDayIndex={activeDayIndex}
                dayRefs={dayRefs}
                handleDayNavigate={handleDayNavigate}
              />
            )
          } else {
            // 傳遞 effectiveStyle 作為 coverStyle，讓 TourItinerarySection 內部處理 dreamscape
            return (
              <TourItinerarySection
                data={data}
                viewMode={viewMode}
                activeDayIndex={activeDayIndex}
                dayRefs={dayRefs}
                handleDayNavigate={handleDayNavigate}
                coverStyle={effectiveStyle === 'dreamscape' ? 'dreamscape' : data.coverStyle}
              />
            )
          }
        })()}
      </div>

      {/* Divider */}
      {(data.leader?.name || data.leader?.phone || data.meetingInfo?.time || data.meetingInfo?.location || (data.meetingPoints && data.meetingPoints.length > 0)) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Leader and Meeting Section - 有資料才顯示 */}
      {(data.leader?.name || data.leader?.phone || data.meetingInfo?.time || data.meetingInfo?.location || (data.meetingPoints && data.meetingPoints.length > 0)) && (
        <div id="leader">
          {data.coverStyle === 'luxury' ? (
            <TourLeaderSectionLuxury data={data} viewMode={viewMode} />
          ) : (
            <TourLeaderSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
          )}
        </div>
      )}

      {/* Divider */}
      {data.showHotels !== false && data.hotels && data.hotels.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Hotels Section */}
      {data.showHotels !== false && data.hotels && data.hotels.length > 0 && (
        <div id="hotels">
          {data.coverStyle === 'luxury' ? (
            <TourHotelsSectionLuxury data={data} viewMode={viewMode} />
          ) : (
            <TourHotelsSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
          )}
        </div>
      )}

      {/* Divider - Price Tiers */}
      {data.showPriceTiers && data.priceTiers && data.priceTiers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Price Tiers Section (4人、6人、8人包團) */}
      <div id="price-tiers">
        {data.coverStyle === 'luxury' ? (
          <TourPriceTiersSectionLuxury data={data} viewMode={viewMode} />
        ) : (
          <TourPriceTiersSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
        )}
      </div>

      {/* Divider - Pricing Details */}
      {data.showPricingDetails && data.pricingDetails && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Pricing Details Section (費用包含/不含) */}
      <div id="pricing">
        {data.coverStyle === 'luxury' ? (
          <TourPricingSectionLuxury data={data} viewMode={viewMode} />
        ) : (
          <TourPricingSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
        )}
      </div>

      {/* Divider - FAQ */}
      {data.showFaqs && data.faqs && data.faqs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* FAQ Section */}
      <div id="faq">
        <TourFAQSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
      </div>

      {/* Divider - Notices */}
      {((data.showNotices && data.notices && data.notices.length > 0) ||
        (data.showCancellationPolicy && data.cancellationPolicy && data.cancellationPolicy.length > 0)) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      )}

      {/* Notices & Cancellation Section */}
      <div id="notices">
        <TourNoticesSection data={data} viewMode={viewMode} coverStyle={data.coverStyle} />
      </div>

      {/* Footer */}
      <footer className="bg-morandi-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Company Logo */}
            <div className="flex justify-center mb-3">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt="Company Logo"
                  className={`w-auto object-contain ${
                    viewMode === 'mobile' ? 'h-6' : 'h-8'
                  }`}
                />
              ) : (
                <h3 className={`font-bold text-morandi-gold ${
                  viewMode === 'mobile' ? 'text-lg' : 'text-2xl'
                }`}>
                  {COMPANY.name}
                </h3>
              )}
            </div>
            <p className="text-morandi-secondary mb-6 text-sm">{COMPANY.subtitle}</p>
            <p className="text-morandi-secondary text-xs">© 2025 Corner Travel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
