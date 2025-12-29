'use client'

import { motion } from 'framer-motion'

interface PricingItem {
  text: string
  included: boolean
}

interface PriceTier {
  name: string
  pricePerPerson: number
  description?: string
  features?: string[]
}

interface PricingDetails {
  show_pricing_details?: boolean
  insurance_amount?: string
  included_items: PricingItem[]
  excluded_items: PricingItem[]
  notes: string[]
}

interface TourPricingSectionArtProps {
  data: {
    showPricingDetails?: boolean
    pricingDetails?: PricingDetails
    priceTiers?: PriceTier[]
  }
  viewMode?: 'desktop' | 'mobile'
}

export function TourPricingSectionArt({ data, viewMode = 'desktop' }: TourPricingSectionArtProps) {
  const pricingDetails = data.pricingDetails
  const priceTiers = data.priceTiers || []
  const isMobile = viewMode === 'mobile'

  if (!data.showPricingDetails && priceTiers.length === 0) {
    return null
  }

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW').format(price)
  }

  // Art 風格色彩
  const colors = {
    ink: '#1C1C1C',
    paper: '#F2F0E9',
    clay: '#BF5B3D',
    accent: '#C6A87C',
  }

  // Brutalist 陰影
  const brutalistShadow = '6px 6px 0px 0px rgba(28,28,28,1)'
  const brutalistShadowSm = '4px 4px 0px 0px rgba(28,28,28,1)'

  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: colors.paper }}>
      {/* 背景裝飾線條 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full" style={{ backgroundColor: `${colors.ink}10` }} />
        <div className="absolute top-0 right-1/4 w-px h-full" style={{ backgroundColor: `${colors.ink}10` }} />
        <div className="absolute top-1/3 left-0 w-full h-px" style={{ backgroundColor: `${colors.ink}10` }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* 標題區 - Editorial Magazine 風格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-start gap-8">
            {/* 垂直文字 */}
            <div
              className="hidden lg:block writing-vertical-rl text-sm tracking-[0.3em] uppercase"
              style={{
                fontFamily: "'Cinzel', serif",
                color: colors.clay,
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            >
              Pricing Details
            </div>

            <div className="flex-1">
              <span
                className="text-sm tracking-[0.2em] uppercase block mb-4"
                style={{ fontFamily: "'Italiana', serif", color: colors.clay }}
              >
                Investment
              </span>
              <h2
                className="text-5xl lg:text-7xl font-light mb-6"
                style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
              >
                費用結構
              </h2>
              <div className="w-24 h-1" style={{ backgroundColor: colors.clay }} />
            </div>
          </div>
        </motion.div>

        {/* 價格方案卡片 */}
        {priceTiers.length > 0 && (
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'lg:grid-cols-3 gap-6'} mb-20`}>
            {priceTiers.map((tier, index) => {
              const tierLabels = ['Essential', 'Signature', 'Imperial']
              const tierLabel = tierLabels[index] || `Plan ${index + 1}`

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div
                    className="bg-white border-2 p-8 transition-transform duration-300 hover:-translate-y-2"
                    style={{
                      borderColor: colors.ink,
                      boxShadow: brutalistShadow,
                    }}
                  >
                    {/* 方案標籤 */}
                    <div className="flex justify-between items-start mb-6">
                      <span
                        className="text-xs tracking-[0.2em] uppercase px-3 py-1 border"
                        style={{
                          fontFamily: "'Cinzel', serif",
                          color: colors.ink,
                          borderColor: colors.ink,
                        }}
                      >
                        {tierLabel}
                      </span>
                      {index === 1 && (
                        <span
                          className="text-xs px-2 py-1 text-white"
                          style={{ backgroundColor: colors.clay }}
                        >
                          推薦
                        </span>
                      )}
                    </div>

                    {/* 方案名稱 */}
                    <h3
                      className="text-2xl font-light mb-2"
                      style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
                    >
                      {tier.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-8" style={{ fontFamily: "'Italiana', serif" }}>
                      {tier.description || '專屬行程體驗'}
                    </p>

                    {/* 價格 */}
                    <div className="mb-8 pb-6 border-b" style={{ borderColor: `${colors.ink}20` }}>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-4xl lg:text-5xl font-light"
                          style={{ fontFamily: "'Cinzel', serif", color: colors.clay }}
                        >
                          {formatPrice(tier.pricePerPerson)}
                        </span>
                        <span className="text-sm text-gray-400">TWD / 人</span>
                      </div>
                    </div>

                    {/* 特色列表 */}
                    {tier.features && tier.features.length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm" style={{ color: colors.ink }}>
                            <span
                              className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                              style={{ backgroundColor: colors.clay }}
                            />
                            <span style={{ fontFamily: "'Noto Serif TC', serif" }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 選擇按鈕 */}
                    <button
                      className="w-full py-4 text-sm uppercase tracking-[0.2em] border-2 transition-all duration-300 hover:text-white"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        borderColor: colors.ink,
                        color: colors.ink,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.ink
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = colors.ink
                      }}
                    >
                      選擇方案
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* 費用包含/不含 */}
        {pricingDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8 mb-16`}
          >
            {/* 費用包含 */}
            <div
              className="border-2 p-8"
              style={{
                borderColor: colors.ink,
                boxShadow: brutalistShadow,
                backgroundColor: 'white',
              }}
            >
              <div className="flex items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: `${colors.ink}20` }}>
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: colors.ink }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
                <h4
                  className="text-xl font-light uppercase tracking-[0.1em]"
                  style={{ fontFamily: "'Cinzel', serif", color: colors.ink }}
                >
                  Included
                </h4>
              </div>

              <ul className="space-y-4">
                {pricingDetails.included_items
                  .filter(item => item.included)
                  .map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm" style={{ color: colors.ink }}>
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <span style={{ fontFamily: "'Noto Serif TC', serif" }}>{item.text}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* 費用不含 */}
            <div
              className="border-2 p-8"
              style={{
                borderColor: colors.ink,
                boxShadow: brutalistShadow,
                backgroundColor: 'white',
              }}
            >
              <div className="flex items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: `${colors.ink}20` }}>
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: colors.clay }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </div>
                <h4
                  className="text-xl font-light uppercase tracking-[0.1em]"
                  style={{ fontFamily: "'Cinzel', serif", color: colors.ink }}
                >
                  Not Included
                </h4>
              </div>

              <ul className="space-y-4">
                {pricingDetails.excluded_items
                  .filter(item => !item.included)
                  .map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm" style={{ color: colors.ink }}>
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: colors.clay }}
                      />
                      <span style={{ fontFamily: "'Noto Serif TC', serif" }}>{item.text}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* 注意事項 - Terms */}
        {pricingDetails?.notes && pricingDetails.notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="border-2 p-8"
              style={{
                borderColor: colors.ink,
                boxShadow: brutalistShadowSm,
                backgroundColor: 'white',
              }}
            >
              <div className="flex items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: `${colors.ink}20` }}>
                <span
                  className="text-xs tracking-[0.2em] uppercase px-3 py-1 border"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    color: colors.accent,
                    borderColor: colors.accent,
                  }}
                >
                  Terms
                </span>
                <h4
                  className="text-xl font-light"
                  style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
                >
                  注意事項與取消政策
                </h4>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8`}>
                <div>
                  <ol className="space-y-3 text-sm" style={{ color: colors.ink }}>
                    {pricingDetails.notes.slice(0, Math.ceil(pricingDetails.notes.length / 2)).map((note, index) => (
                      <li key={index} className="flex gap-3">
                        <span
                          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs border"
                          style={{
                            fontFamily: "'Cinzel', serif",
                            borderColor: colors.ink,
                            color: colors.ink,
                          }}
                        >
                          {index + 1}
                        </span>
                        <span style={{ fontFamily: "'Noto Serif TC', serif" }}>{note}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <ol className="space-y-3 text-sm" style={{ color: colors.ink }}>
                    {pricingDetails.notes.slice(Math.ceil(pricingDetails.notes.length / 2)).map((note, index) => (
                      <li key={index} className="flex gap-3">
                        <span
                          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs border"
                          style={{
                            fontFamily: "'Cinzel', serif",
                            borderColor: colors.ink,
                            color: colors.ink,
                          }}
                        >
                          {Math.ceil(pricingDetails.notes.length / 2) + index + 1}
                        </span>
                        <span style={{ fontFamily: "'Noto Serif TC', serif" }}>{note}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
