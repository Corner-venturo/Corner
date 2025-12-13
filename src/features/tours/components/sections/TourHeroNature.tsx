'use client'

import { MapPin } from 'lucide-react'

interface TourHeroNatureProps {
  data: {
    coverImage?: string | null
    tagline?: string | null
    title: string
    subtitle?: string | null
    description?: string | null
    departureDate: string
    tourCode: string
    country?: string
    city?: string
    price?: string
    priceNote?: string
  }
  viewMode: 'desktop' | 'mobile'
}

/**
 * Nature 風格 Hero Section
 * 日式極簡風格：垂直文字 + 單張大圖 + 和紙紋理背景
 * 參考：香港靜謐之旅設計
 */
export function TourHeroNature({ data, viewMode }: TourHeroNatureProps) {
  const isMobile = viewMode === 'mobile'

  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-[#f9f9f7]">
      {/* 和紙紋理背景 */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-60 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`
        }}
      />

      {/* 裝飾同心圓 - 右上 */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full border border-[#30abe8]/5 pointer-events-none z-0" />
      <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] rounded-full border border-[#30abe8]/10 pointer-events-none z-0" />

      {/* 裝飾同心圓 - 左下 */}
      <div className="absolute bottom-[10%] left-[-10%] w-[30vw] h-[30vw] rounded-full border border-[#30abe8]/5 pointer-events-none z-0" />

      {/* 主要內容 */}
      <div className={`relative z-10 h-full ${isMobile ? 'px-4 pt-8 pb-16' : 'px-8 md:px-12 pt-12 pb-20'}`}>
        <div className={`max-w-[1200px] mx-auto flex ${isMobile ? 'flex-col gap-8' : 'flex-row gap-12 md:gap-24'} items-center min-h-[75vh]`}>

          {/* 左側：垂直文字區塊 */}
          <div className={`flex gap-6 ${isMobile ? 'h-[280px] order-2' : 'md:gap-12 h-[500px]'} justify-center`}>
            {/* 向下箭頭 */}
            {!isMobile && (
              <div className="flex flex-col gap-8 justify-end pb-8">
                <button className="w-12 h-12 rounded-full border border-[#30abe8]/30 text-[#30abe8] flex items-center justify-center hover:bg-[#30abe8] hover:text-white transition-all duration-300 group">
                  <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>
            )}

            {/* 主標題 - 垂直排列 */}
            <h1
              className={`text-[#2c3e50] font-black tracking-[0.1em] leading-normal select-none ${
                isMobile ? 'text-3xl' : 'text-4xl md:text-6xl'
              }`}
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontFamily: "'Noto Sans TC', sans-serif"
              }}
            >
              {data.title}
              {data.subtitle && (
                <>
                  <span className="text-[#30abe8]">・</span>
                  <span className="text-[#30abe8]">{data.subtitle}</span>
                </>
              )}
            </h1>

            {/* 描述 - 垂直排列 */}
            {data.description && (
              <p
                className={`text-[#637c88] font-light tracking-[0.2em] leading-loose select-none border-r border-[#30abe8]/20 ${
                  isMobile ? 'text-xs pr-4 pt-8' : 'text-sm md:text-base pr-6 md:pr-8 pt-12'
                }`}
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}
              >
                {data.description}
              </p>
            )}
          </div>

          {/* 右側：主圖區塊 */}
          <div className={`flex-1 w-full relative group ${isMobile ? 'order-1' : ''}`}>
            <div className={`relative w-full overflow-hidden shadow-2xl shadow-[#30abe8]/10 ${
              isMobile
                ? 'aspect-[4/5] rounded-t-[60px] rounded-b-lg'
                : 'aspect-[3/4] max-h-[650px] rounded-t-[100px] rounded-b-lg'
            }`}>
              {/* 藍色疊加層 */}
              <div className="absolute inset-0 bg-[#30abe8]/10 mix-blend-overlay z-10" />

              {/* 主圖 */}
              <img
                src={data.coverImage || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop'}
                alt={data.title}
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
              />

              {/* 位置標籤 */}
              <div className={`absolute z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full ${
                isMobile ? 'bottom-4 left-4 px-3 py-1.5' : 'bottom-6 left-6 px-4 py-2'
              }`}>
                <MapPin size={isMobile ? 14 : 18} className="text-[#30abe8]" />
                <span className={`font-bold tracking-wider text-[#2c3e50] uppercase ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  {data.city || data.country || 'Destination'}
                </span>
              </div>
            </div>

            {/* 裝飾圓 - 圖片後方 */}
            <div className={`absolute rounded-full bg-[#30abe8]/5 -z-10 ${
              isMobile ? '-top-6 -right-6 w-20 h-20' : '-top-10 -right-10 w-32 h-32'
            }`} />
          </div>
        </div>
      </div>
    </section>
  )
}
