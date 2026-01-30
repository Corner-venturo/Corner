'use client'

import { motion } from 'framer-motion'
import type { TourPageData } from '@/features/tours/types/tour-display.types'

interface TourFeaturesSectionArtProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
}

export function TourFeaturesSectionArt({ data, viewMode }: TourFeaturesSectionArtProps) {
  const features = data.features || []
  const isMobile = viewMode === 'mobile'

  if (features.length === 0) {
    return null
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

  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: colors.paper }}>
      {/* 背景裝飾線條 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-px h-full" style={{ backgroundColor: `${colors.ink}08` }} />
        <div className="absolute top-0 right-1/3 w-px h-full" style={{ backgroundColor: `${colors.ink}08` }} />
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
              className="hidden lg:block text-sm tracking-[0.3em] uppercase"
              style={{
                fontFamily: "'Cinzel', serif",
                color: colors.clay,
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            >
              Highlights
            </div>

            <div className="flex-1">
              <span
                className="text-sm tracking-[0.2em] uppercase block mb-4"
                style={{ fontFamily: "'Italiana', serif", color: colors.clay }}
              >
                Tour Features
              </span>
              <h2
                className="text-5xl lg:text-7xl font-light mb-6"
                style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
              >
                行程特色
              </h2>
              <div className="w-24 h-1" style={{ backgroundColor: colors.clay }} />
            </div>
          </div>
        </motion.div>

        {/* 特色卡片網格 */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
          {features.map((feature, index) => {
            const hasImage = feature.images && feature.images.length > 0 && feature.images[0]

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div
                  className="border-2 bg-card overflow-hidden transition-transform duration-300 hover:-translate-y-2 h-full flex flex-col"
                  style={{
                    borderColor: colors.ink,
                    boxShadow: brutalistShadow,
                  }}
                >
                  {/* 圖片區 */}
                  <div className="aspect-[16/10] overflow-hidden relative">
                    {hasImage ? (
                      <img
                        src={feature.images![0]}
                        alt={feature.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: colors.ink }}
                      >
                        <span
                          className="text-6xl"
                          style={{ color: colors.paper }}
                        >
                          {feature.icon || '✦'}
                        </span>
                      </div>
                    )}

                    {/* 序號標籤 */}
                    <div
                      className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: colors.clay,
                        color: 'white',
                        fontFamily: "'Cinzel', serif",
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* 內容區 */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* 日期標籤 */}
                    {feature.date && (
                      <span
                        className="text-xs tracking-[0.2em] uppercase mb-3"
                        style={{
                          fontFamily: "'Cinzel', serif",
                          color: colors.accent,
                        }}
                      >
                        {feature.date}
                      </span>
                    )}

                    {/* 標題 */}
                    <h3
                      className="text-xl font-light mb-3"
                      style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
                    >
                      {feature.title}
                    </h3>

                    {/* 描述 */}
                    <p
                      className="text-sm leading-relaxed flex-1"
                      style={{ fontFamily: "'Noto Serif TC', serif", color: `${colors.ink}99` }}
                    >
                      {feature.description}
                    </p>

                    {/* 了解更多連結 */}
                    <div className="mt-6 pt-4 border-t" style={{ borderColor: `${colors.ink}20` }}>
                      <span
                        className="text-xs tracking-[0.15em] uppercase flex items-center gap-2 cursor-pointer group-hover:gap-4 transition-all"
                        style={{
                          fontFamily: "'Cinzel', serif",
                          color: colors.clay,
                        }}
                      >
                        Read More
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
