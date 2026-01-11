'use client'

import { Check, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionTitle } from './SectionTitle'
import { TourPricingSectionArt } from './TourPricingSectionArt'
import { TourPricingSectionCollage } from './TourPricingSectionCollage'

interface PricingItem {
  text: string
  included: boolean
}

interface PricingDetails {
  show_pricing_details?: boolean
  insurance_amount?: string
  included_items: PricingItem[]
  excluded_items: PricingItem[]
  notes: string[]
}

type CoverStyleType = 'original' | 'gemini' | 'nature' | 'luxury' | 'art' | 'dreamscape' | 'collage'

interface TourPricingSectionProps {
  data: {
    showPricingDetails?: boolean
    pricingDetails?: PricingDetails
  }
  viewMode?: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
}

export function TourPricingSection({ data, viewMode = 'desktop', coverStyle = 'original' }: TourPricingSectionProps) {
  const pricingDetails = data.pricingDetails

  if (!data.showPricingDetails || !pricingDetails) {
    return null
  }

  // Art 風格使用專用組件
  if (coverStyle === 'art') {
    return <TourPricingSectionArt data={data} viewMode={viewMode} />
  }

  // Collage 風格使用專用組件
  if (coverStyle === 'collage') {
    return <TourPricingSectionCollage data={data} viewMode={viewMode} />
  }

  const isMobile = viewMode === 'mobile'

  return (
    <section className={cn('py-12 bg-morandi-container/30', isMobile && 'py-8')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="團費說明"
          coverStyle={coverStyle}
          className="mb-8"
        />

        <div className={cn(
          'grid gap-6',
          isMobile ? 'grid-cols-1' : 'grid-cols-2'
        )}>
          {/* 費用包含 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-morandi-container">
            <h3 className={cn(
              'font-semibold text-morandi-green mb-4 flex items-center gap-2',
              isMobile ? 'text-base' : 'text-lg'
            )}>
              <div className="w-6 h-6 bg-morandi-green/20 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-morandi-green" />
              </div>
              費用包含
            </h3>
            <ul className="space-y-2">
              {pricingDetails.included_items
                .filter(item => item.included)
                .map((item, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-start gap-2 text-morandi-primary',
                      isMobile ? 'text-sm' : 'text-base'
                    )}
                  >
                    <span className="text-morandi-green mt-0.5">•</span>
                    <span>{item.text}</span>
                  </li>
                ))}
            </ul>
          </div>

          {/* 費用不含 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-morandi-container">
            <h3 className={cn(
              'font-semibold text-morandi-red mb-4 flex items-center gap-2',
              isMobile ? 'text-base' : 'text-lg'
            )}>
              <div className="w-6 h-6 bg-morandi-red/20 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-morandi-red" />
              </div>
              費用不含
            </h3>
            <ul className="space-y-2">
              {pricingDetails.excluded_items
                .filter(item => !item.included)
                .map((item, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-start gap-2 text-morandi-primary',
                      isMobile ? 'text-sm' : 'text-base'
                    )}
                  >
                    <span className="text-morandi-red mt-0.5">•</span>
                    <span>{item.text}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* 注意事項 */}
        {pricingDetails.notes && pricingDetails.notes.length > 0 && (
          <div className="mt-6 bg-morandi-gold/10 rounded-xl p-6 border border-morandi-gold/30">
            <h3 className={cn(
              'font-semibold text-morandi-gold mb-4 flex items-center gap-2',
              isMobile ? 'text-base' : 'text-lg'
            )}>
              <AlertTriangle className="w-5 h-5 text-morandi-gold" />
              注意事項
            </h3>
            <ol className="space-y-2 list-decimal list-inside">
              {pricingDetails.notes.map((note, index) => (
                <li
                  key={index}
                  className={cn(
                    'text-morandi-primary',
                    isMobile ? 'text-sm' : 'text-base'
                  )}
                >
                  {note}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
