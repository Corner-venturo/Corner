'use client'

import { MapPin } from 'lucide-react'
import { isHtmlString, cleanTiptapHtml } from '@/lib/utils/rich-text'

// 渲染可能包含 HTML 的文字（保留內聯樣式）
function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null
  if (isHtmlString(html)) {
    // 清理 Tiptap 輸出的 <p> 標籤，保留樣式
    const cleanHtml = cleanTiptapHtml(html)
    return <span className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  }
  return <span className={className}>{html}</span>
}

interface TourHeroLuxuryProps {
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

// Luxury 配色
const LUXURY = {
  primary: '#2C5F4D',
  secondary: '#C69C6D',
  accent: '#8F4F4F',
  background: '#FDFBF7',
  text: '#2D3436',
  muted: '#636E72',
}

/**
 * Luxury 風格 Hero Section
 * 參考 Corner Travel Collection 設計
 * 特點：左右分欄、標籤系統、數據卡片、襯線字體混排
 */
export function TourHeroLuxury({ data, viewMode }: TourHeroLuxuryProps) {
  const isMobile = viewMode === 'mobile'

  return (
    <header
      className="relative w-full"
      style={{ backgroundColor: LUXURY.background }}
    >
      {/* 微妙的背景圖案 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232C5F4D' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className={`relative max-w-7xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-8 py-16 lg:py-24'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'lg:grid-cols-12 gap-12'} items-center`}>

          {/* 左側：文字內容 */}
          <div className={`${isMobile ? '' : 'lg:col-span-5'} space-y-6 relative z-10`}>

            {/* 標籤 */}
            <div
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border shadow-sm"
              style={{ borderColor: `${LUXURY.secondary}30` }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: LUXURY.accent }}
              />
              <span
                className="text-xs font-medium tracking-widest uppercase"
                style={{
                  color: LUXURY.secondary,
                  fontFamily: "'Noto Serif TC', serif"
                }}
              >
                {data.tourCode || 'Signature Collection'}
              </span>
            </div>

            {/* 主標題區塊 - 靠左對齊 */}
            <div className="space-y-2">
              {/* 主標題 - 黑字 */}
              <h1
                className={`font-medium leading-tight ${isMobile ? 'text-4xl' : 'text-5xl lg:text-7xl'}`}
                style={{
                  color: LUXURY.text,
                  fontFamily: "'Noto Serif TC', serif"
                }}
              >
                <span className="relative inline-block">
                  <RichText html={data.title} />
                  <span
                    className="absolute -bottom-2 left-0 w-full h-3 -rotate-1"
                    style={{ backgroundColor: `${LUXURY.secondary}20` }}
                  />
                </span>
              </h1>

              {/* 副標題 - 綠字 */}
              {data.subtitle && (
                <h2
                  className={`font-medium ${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'}`}
                  style={{
                    color: LUXURY.primary,
                    fontFamily: "'Noto Serif TC', serif"
                  }}
                >
                  <RichText html={data.subtitle} />
                </h2>
              )}
            </div>

            {/* 描述 - 靠左對齊 */}
            {data.description && (
              <div className="flex gap-6 items-start pt-2">
                <div
                  className="w-12 h-px mt-3 opacity-50"
                  style={{ backgroundColor: LUXURY.text }}
                />
                <p
                  className={`leading-relaxed font-light max-w-md ${isMobile ? 'text-base' : 'text-lg'}`}
                  style={{
                    color: LUXURY.muted,
                    fontFamily: "'Noto Sans TC', sans-serif"
                  }}
                >
                  <RichText html={data.description} />
                </p>
              </div>
            )}

          </div>

          {/* 右側：主視覺圖片 */}
          <div className={`${isMobile ? '' : 'lg:col-span-7'} relative`}>
            <div className="relative h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={data.coverImage || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80&auto=format&fit=crop'}
                alt={data.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 漸層遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* 出發日期卡片 */}
              <div
                className="absolute bottom-6 right-6 bg-white/95 backdrop-blur p-5 rounded-lg shadow-lg max-w-xs"
                style={{ borderLeft: `4px solid ${LUXURY.secondary}` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5" style={{ color: LUXURY.secondary }} />
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: LUXURY.muted }}
                  >
                    Next Departure
                  </span>
                </div>
                <p
                  className="text-xl font-medium"
                  style={{
                    color: LUXURY.text,
                    fontFamily: "'Noto Serif TC', serif"
                  }}
                >
                  {data.departureDate || 'Coming Soon'}
                </p>
                <p className="text-xs mt-1" style={{ color: LUXURY.muted }}>
                  Limited Availability
                </p>
              </div>
            </div>

            {/* 裝飾圓圈 */}
            {!isMobile && (
              <>
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 border rounded-full z-0"
                  style={{ borderColor: `${LUXURY.secondary}30` }}
                />
                <div
                  className="absolute -bottom-6 -left-6 w-32 h-32 border rounded-full z-0"
                  style={{ borderColor: `${LUXURY.primary}20` }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
