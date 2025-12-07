'use client'

import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

interface PriceTier {
  label: string
  sublabel?: string
  price: string
  priceNote?: string
  addon?: string
}

interface TourPriceTiersSectionProps {
  data: {
    showPriceTiers?: boolean
    priceTiers?: PriceTier[]
  }
  viewMode?: 'desktop' | 'mobile'
}

// 格式化價格（加千分位逗號）
const formatPrice = (value: string): string => {
  if (!value) return ''
  const numericValue = value.replace(/[^\d]/g, '')
  if (!numericValue) return value
  return Number(numericValue).toLocaleString('en-US')
}

export function TourPriceTiersSection({ data, viewMode = 'desktop' }: TourPriceTiersSectionProps) {
  const priceTiers = data.priceTiers

  if (!data.showPriceTiers || !priceTiers || priceTiers.length === 0) {
    return null
  }

  const isMobile = viewMode === 'mobile'
  const count = priceTiers.length

  return (
    <section className={cn('py-12 bg-white', isMobile && 'py-8')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={cn(
          'font-bold text-morandi-primary mb-8 flex items-center gap-3',
          isMobile ? 'text-xl' : 'text-2xl'
        )}>
          <Users className={cn('text-morandi-gold', isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
          價格方案
        </h2>

        {/* 根據數量自適應版面 */}
        <div className={cn(
          'grid gap-4',
          isMobile ? 'grid-cols-1' : cn(
            count === 1 && 'grid-cols-1 max-w-md mx-auto',
            count === 2 && 'grid-cols-2 max-w-2xl mx-auto',
            count >= 3 && 'grid-cols-2 lg:grid-cols-3'
          )
        )}>
          {priceTiers.map((tier, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-gradient-to-br from-morandi-container/20 to-morandi-container/5',
                'rounded-2xl border border-morandi-container/50 overflow-hidden',
                'hover:shadow-lg transition-shadow duration-300'
              )}
            >
              {/* 標籤頭部 */}
              <div className="bg-morandi-primary text-white py-3 px-4 text-center">
                <h3 className={cn(
                  'font-bold',
                  isMobile ? 'text-lg' : 'text-xl'
                )}>
                  {tier.label}
                </h3>
                {tier.sublabel && (
                  <span className="text-sm text-white/80">{tier.sublabel}</span>
                )}
              </div>

              {/* 價格內容 */}
              <div className="p-6 text-center">
                <div className="mb-2">
                  <span className="text-sm text-morandi-secondary">NT$</span>
                  <span className={cn(
                    'font-bold text-morandi-gold',
                    isMobile ? 'text-3xl' : 'text-4xl'
                  )}>
                    {formatPrice(tier.price) || '---'}
                  </span>
                  {tier.priceNote && (
                    <span className="text-sm text-morandi-secondary ml-1">{tier.priceNote}</span>
                  )}
                </div>

                {/* 加購說明 */}
                {tier.addon && (
                  <div className={cn(
                    'mt-4 pt-4 border-t border-morandi-container/50',
                    'text-morandi-secondary',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>
                    {tier.addon}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
