'use client'

import { TourFlightSectionLuxury } from './TourFlightSectionLuxury'
import { TourFlightSectionArt } from './TourFlightSectionArt'
import { TourFlightSectionDreamscape } from './TourFlightSectionDreamscape'
import { TourFlightSectionCollage } from './TourFlightSectionCollage'
import {
  FlightStyleType,
  TourDisplayData,
  CoverStyleType,
  OriginalFlightCard,
  ChineseFlightCard,
  JapaneseFlightCard,
} from './flight-cards'

interface TourFlightSectionProps {
  data: TourDisplayData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
}

/**
 * 航班區塊主組件 - 根據 flightStyle 切換風格
 * - original: 經典莫蘭迪金色風格
 * - chinese: 中國風書法風格
 * - japanese: 日式和紙風格（帶目的地圖片）
 * - luxury: 奢華質感風格（表格式深色調）
 */
export function TourFlightSection({ data, viewMode, coverStyle = 'original' }: TourFlightSectionProps) {
  const isMobile = viewMode === 'mobile'

  // 決定航班卡片風格（優先使用 flightStyle，fallback 到根據 coverStyle 推斷）
  let effectiveFlightStyle: FlightStyleType = data.flightStyle || 'original'
  if (!data.flightStyle) {
    // 向後相容：如果沒有設定 flightStyle，根據 coverStyle 推斷
    if (coverStyle === 'nature') {
      effectiveFlightStyle = 'chinese'
    } else if (coverStyle === 'luxury') {
      effectiveFlightStyle = 'luxury'
    } else if (coverStyle === 'dreamscape') {
      effectiveFlightStyle = 'dreamscape'
    } else if (coverStyle === 'collage') {
      effectiveFlightStyle = 'collage'
    }
  }

  // 國內無航班 - 不顯示航班區塊
  if (effectiveFlightStyle === 'none') {
    return null
  }

  // Art 風格直接使用專屬組件
  if (effectiveFlightStyle === 'art') {
    return <TourFlightSectionArt data={data} viewMode={viewMode} />
  }

  // Dreamscape 夢幻漫遊風格
  if (effectiveFlightStyle === 'dreamscape') {
    return (
      <TourFlightSectionDreamscape
        data={{
          outboundFlight: data.outboundFlight,
          returnFlight: data.returnFlight,
          departureDate: undefined,
        }}
        viewMode={viewMode}
      />
    )
  }

  // Collage 互動拼貼風格
  if (effectiveFlightStyle === 'collage') {
    return (
      <TourFlightSectionCollage
        data={{
          outboundFlight: data.outboundFlight,
          returnFlight: data.returnFlight,
          departureDate: undefined,
        }}
        viewMode={viewMode}
      />
    )
  }

  // 如果沒有航班資料，不顯示
  if (!data.outboundFlight && !data.returnFlight) {
    return null
  }

  // Luxury 奢華風格
  if (effectiveFlightStyle === 'luxury') {
    return <TourFlightSectionLuxury data={data} viewMode={viewMode} />
  }

  // 日式和紙風格
  if (effectiveFlightStyle === 'japanese') {
    return (
      <section
        id="flight"
        className={`${isMobile ? 'pt-4 pb-8' : 'pt-8 pb-16'} bg-[#f9f7f2]`}
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/rice-paper.png')",
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          {/* 標題區 */}
          <div className="flex flex-col items-center justify-center gap-2 mb-8 text-center">
            <h2 className="text-[#2c2623] text-2xl md:text-3xl font-serif font-medium tracking-wide">
              航班資訊
            </h2>
          </div>

          {/* 航班卡片 - 左右並排 */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
            {data.outboundFlight && (
              <JapaneseFlightCard
                flight={data.outboundFlight}
                type="outbound"
                viewMode={viewMode}
                destinationImage={data.coverImage}
              />
            )}
            {data.returnFlight && (
              <JapaneseFlightCard
                flight={data.returnFlight}
                type="return"
                viewMode={viewMode}
                destinationImage={data.coverImage}
              />
            )}
          </div>

          {/* 底部說明 */}
          <div className="text-center mt-8">
            <p className="text-xs text-[#756d66]/50 font-serif leading-relaxed">
              * 航班時間可能會有所變動，請以最新通知為準。
            </p>
          </div>
        </div>
      </section>
    )
  }

  // 中國風版本
  if (effectiveFlightStyle === 'chinese') {
    return (
      <section
        id="flight"
        className={`${isMobile ? 'pt-4 pb-8' : 'pt-8 pb-16'} bg-[#f9f7f2]`}
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          {/* 標題區 */}
          <div className="flex flex-col items-center justify-center gap-2 mb-8 text-center">
            <h2 className="text-[#2c2623] text-2xl md:text-3xl font-serif font-medium tracking-wide">
              航班資訊
            </h2>
          </div>

          {/* 航班卡片 - 左右並排 */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
            {data.outboundFlight && (
              <ChineseFlightCard
                flight={data.outboundFlight}
                type="outbound"
                viewMode={viewMode}
              />
            )}
            {data.returnFlight && (
              <ChineseFlightCard
                flight={data.returnFlight}
                type="return"
                viewMode={viewMode}
              />
            )}
          </div>

          {/* 底部說明 */}
          <div className="text-center mt-8">
            <p className="text-xs text-[#756d66]/50 font-serif leading-relaxed">
              * 航班時間可能會有所變動，請以最新通知為準。
            </p>
          </div>
        </div>
      </section>
    )
  }

  // 原版風格（original）
  return (
    <section
      id="flight"
      className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-card' : 'pt-8 pb-16 bg-card'}
    >
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div
          className={
            viewMode === 'mobile'
              ? 'grid grid-cols-1 gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'
          }
        >
          {/* 去程航班 */}
          {data.outboundFlight && (
            <OriginalFlightCard
              flight={data.outboundFlight}
              type="outbound"
              viewMode={viewMode}
            />
          )}

          {/* 回程航班 */}
          {data.returnFlight && (
            <OriginalFlightCard
              flight={data.returnFlight}
              type="return"
              viewMode={viewMode}
            />
          )}
        </div>
      </div>
    </section>
  )
}
