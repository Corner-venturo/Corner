'use client'

import { motion } from 'framer-motion'
import { Plane, Calendar, Clock, Luggage, UtensilsCrossed } from 'lucide-react'
import { TourFlightSectionLuxury } from './TourFlightSectionLuxury'
import { TourFlightSectionArt } from './TourFlightSectionArt'

interface FlightInfo {
  airline?: string | null
  flightNumber?: string | null
  departureAirport?: string | null
  departureTime?: string | null
  departureDate?: string | null
  arrivalAirport?: string | null
  arrivalTime?: string | null
  duration?: string | null
  // 新增欄位
  aircraftType?: string | null
  terminal?: string | null
  arrivalTerminal?: string | null
  hasMeal?: boolean | null // 是否提供機上餐食
}

// 航班卡片風格類型
type FlightStyleType = 'original' | 'chinese' | 'japanese' | 'luxury' | 'art' | 'none'

interface TourDisplayData {
  outboundFlight?: FlightInfo | null
  returnFlight?: FlightInfo | null
  coverImage?: string | null // 用於日式風格的目的地圖片
  flightStyle?: FlightStyleType // 航班卡片風格
}

type CoverStyleType = 'original' | 'gemini' | 'nature' | 'serene' | 'luxury' | 'art'

interface TourFlightSectionProps {
  data: TourDisplayData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
}

/**
 * 原版航班卡片組件 - 用於 original/gemini 風格
 */
function OriginalFlightCard({
  flight,
  type,
  viewMode,
}: {
  flight: FlightInfo | null | undefined
  type: 'outbound' | 'return'
  viewMode: 'desktop' | 'mobile'
}) {
  const isOutbound = type === 'outbound'

  return (
    <motion.div
      initial={{ opacity: 0, x: isOutbound ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-morandi-gold/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-morandi-gold to-morandi-gold/80 rounded-xl flex items-center justify-center shadow-lg">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs text-morandi-secondary">{isOutbound ? '去程航班' : '回程航班'}</div>
          <div className="text-xl font-bold text-morandi-primary">
            {flight?.airline || '--'} {flight?.flightNumber || '--'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs text-morandi-secondary mb-1">出發</div>
            <div className="text-2xl font-bold text-morandi-primary">
              {flight?.departureAirport || '--'}
            </div>
            <div className="text-base text-morandi-gold font-semibold">
              {flight?.departureTime || '--:--'}
            </div>
            <div className="text-xs text-morandi-secondary mt-0.5">
              {flight?.departureDate || '--/--'}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center px-3">
            <div className="text-xs text-morandi-secondary mb-3">飛行時間</div>
            <div className="w-full flex items-center justify-center gap-2 my-2">
              <div className="flex-1 border-t-2 border-dashed border-morandi-container" />
              <div className="bg-morandi-gold/10 px-2 py-1 rounded-full">
                <Plane className="w-3 h-3 text-morandi-gold" />
              </div>
              <div className="flex-1 border-t-2 border-dashed border-morandi-container" />
            </div>
            <div className="text-xs font-semibold text-morandi-primary mt-3">
              {flight?.duration || '--'}
            </div>
          </div>

          <div className="flex-1 text-right">
            <div className="text-xs text-morandi-secondary mb-1">抵達</div>
            <div className="text-2xl font-bold text-morandi-primary">
              {flight?.arrivalAirport || '--'}
            </div>
            <div className="text-base text-morandi-gold font-semibold">
              {flight?.arrivalTime || '--:--'}
            </div>
            <div className="text-xs text-morandi-secondary mt-0.5">當地時間</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * 中國風航班卡片組件 - 用於 nature/serene 風格
 */
function ChineseFlightCard({
  flight,
  type,
  viewMode,
}: {
  flight: FlightInfo | null | undefined
  type: 'outbound' | 'return'
  viewMode: 'desktop' | 'mobile'
}) {
  const isOutbound = type === 'outbound'
  const isMobile = viewMode === 'mobile'

  // 顏色配置
  const accentColor = isOutbound ? '#b09e87' : '#7fa898' // 金色 vs 玉色
  const labelText = isOutbound ? '去程' : '回程'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: isOutbound ? 0 : 0.15 }}
      className="relative w-full bg-[#fdfbf7] shadow-[0_4px_20px_-2px_rgba(44,38,35,0.1),0_0_0_1px_rgba(44,38,35,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(44,38,35,0.15),0_0_0_1px_rgba(44,38,35,0.1)] transition-all duration-700 rounded-2xl overflow-hidden group border border-[#dcd6ce]"
    >
      {/* 紙張紋理背景 */}
      <div
        className="absolute inset-0 opacity-60 mix-blend-multiply pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')"
        }}
      />

      {/* 漸層裝飾 */}
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] opacity-50 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${isOutbound ? 'rgba(176,158,135,0.05)' : 'rgba(127,168,152,0.05)'}, transparent)`
        }}
      />

      {/* 頂部標題區 */}
      <div
        className={`relative z-10 border-b border-[#2c2623]/5 flex flex-wrap justify-between items-center ${isMobile ? 'px-3 py-2 gap-2' : 'px-6 py-4 gap-4'}`}
        style={{
          background: isOutbound
            ? 'linear-gradient(to right, #f5f0e8, #faf7f2, transparent)'
            : 'linear-gradient(to right, #eff6f3, #f7fcf9, transparent)'
        }}
      >
        <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {/* 航空公司圖標 */}
          <div
            className={`rounded-lg flex items-center justify-center text-white shadow-sm ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
            style={{ backgroundColor: accentColor }}
          >
            <Plane
              className={`-rotate-90 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}
            />
          </div>

          {/* 航班資訊 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-[#2c2623] tracking-wide ${isMobile ? 'text-sm' : 'text-lg'}`}>
                {flight?.airline || '--'} {flight?.flightNumber || '--'}
              </span>
              <span className={`px-2 py-0.5 rounded-full border border-[#2c2623]/10 text-[#756d66] bg-white/50 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                {labelText}
              </span>
            </div>
            {!isMobile && (
              <span className="text-xs text-[#756d66] tracking-wider">
                {flight?.aircraftType || '客機'} · 經濟艙
              </span>
            )}
          </div>
        </div>

        {/* 日期 */}
        <div className={`flex items-center gap-1 text-[#2c2623]/70 bg-white/40 rounded-md border border-[#2c2623]/5 ${isMobile ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
          <Calendar className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
          <span className={`font-medium tracking-widest ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
            {flight?.departureDate || '--/--'}
          </span>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className={`relative z-10 ${isMobile ? 'px-3 py-4' : 'px-8 py-10'}`}>
        <div className="flex flex-row items-center justify-between">
          {/* 出發城市 */}
          <div className={`flex flex-col ${isMobile ? 'items-start text-left min-w-[60px]' : 'items-start text-left min-w-[100px]'}`}>
            <span
              className={`${isMobile ? 'text-xl' : 'text-4xl'} font-serif font-bold tracking-tighter mb-1`}
              style={{ color: accentColor }}
            >
              {flight?.departureTime || '--:--'}
            </span>
            <span className={`${isMobile ? 'text-sm' : 'text-xl'} font-serif text-[#2c2623] font-bold mb-0.5`}>
              {extractCityName(flight?.departureAirport)}
            </span>
            <span className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-[#756d66] tracking-wide`}>
              {flight?.terminal || '國際機場'}
            </span>
          </div>

          {/* 飛行路線圖示 */}
          <div className={`flex-1 w-full relative ${isMobile ? 'h-[50px]' : 'h-[100px]'} flex items-center justify-center px-1`}>
            {/* 飛行時間標籤 */}
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 bg-[#fdfbf7] border border-[#2c2623]/10 rounded-full font-bold text-[#756d66] shadow-sm z-20 tracking-widest flex items-center gap-1 ${isMobile ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>
              <Clock className={isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
              {flight?.duration || '--'}
            </div>

            {/* 波浪虛線 - 左半邊 */}
            <svg
              className="absolute left-0 w-[calc(50%-24px)] h-full text-[#2c2623] opacity-20"
              preserveAspectRatio="none"
              viewBox="0 0 150 60"
            >
              <path
                d="M0,30 Q37.5,10 75,30 T150,30"
                fill="none"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>

            {/* 中央飛機圖標 - 全部朝上 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-[#2c2623]/15 rounded-full flex items-center justify-center shadow-sm z-10">
              <Plane className="w-5 h-5 text-[#2c2623] -rotate-90" />
            </div>

            {/* 波浪虛線 - 右半邊 */}
            <svg
              className="absolute right-0 w-[calc(50%-24px)] h-full text-[#2c2623] opacity-20"
              preserveAspectRatio="none"
              viewBox="0 0 150 60"
            >
              <path
                d="M0,30 Q37.5,50 75,30 T150,30"
                fill="none"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>

            {/* 雲朵裝飾 */}
            <CloudIcon className="absolute top-1 left-1/4 text-[#2c2623]/10 w-6 h-6" />
            <CloudIcon className="absolute bottom-1 right-1/4 text-[#2c2623]/10 w-5 h-5" />
          </div>

          {/* 抵達城市 */}
          <div className={`flex flex-col ${isMobile ? 'items-end text-right min-w-[60px]' : 'items-end text-right min-w-[100px]'}`}>
            <span className={`${isMobile ? 'text-xl' : 'text-4xl'} font-serif font-bold text-[#2c2623] tracking-tighter mb-1`}>
              {flight?.arrivalTime || '--:--'}
            </span>
            <span className={`${isMobile ? 'text-sm' : 'text-xl'} font-serif text-[#2c2623] font-bold mb-0.5`}>
              {extractCityName(flight?.arrivalAirport)}
            </span>
            <span className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-[#756d66] tracking-wide`}>
              {flight?.arrivalTerminal || '當地時間'}
            </span>
          </div>
        </div>

        {/* 底部標籤區 */}
        <div className={`flex flex-wrap gap-2 ${isMobile ? 'justify-center mt-4 pt-3' : 'justify-start mt-8 pt-4'} border-t border-[#2c2623]/5 border-dashed`}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2c2623]/5 text-[#756d66] rounded text-xs font-medium tracking-widest border border-[#2c2623]/10">
            <Luggage className="w-3 h-3" />
            行李直掛
          </span>
          {flight?.hasMeal && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2c2623]/5 text-[#756d66] rounded text-xs font-medium tracking-widest border border-[#2c2623]/10">
              <UtensilsCrossed className="w-3 h-3" />
              機上餐食
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * 雲朵圖標組件
 */
function CloudIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  )
}

/**
 * 日式和紙風格航班卡片 - 帶目的地圖片
 */
function JapaneseFlightCard({
  flight,
  type,
  viewMode,
  destinationImage,
}: {
  flight: FlightInfo | null | undefined
  type: 'outbound' | 'return'
  viewMode: 'desktop' | 'mobile'
  destinationImage?: string | null
}) {
  const isOutbound = type === 'outbound'
  const isMobile = viewMode === 'mobile'

  // 預設圖片（日本富士山/台灣景點）
  const defaultOutboundImage = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80'
  const defaultReturnImage = 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&q=80'

  const imageUrl = destinationImage || (isOutbound ? defaultOutboundImage : defaultReturnImage)

  // 顏色配置 - 和紙風格（淡墨色系）
  const cardBg = 'bg-[#faf8f5]'
  const accentColor = isOutbound ? '#8b7355' : '#6b8e7b' // 茶色 vs 若竹色

  // 從機場代碼提取顯示文字
  const departureCity = extractCityName(flight?.departureAirport)
  const arrivalCity = extractCityName(flight?.arrivalAirport)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: isOutbound ? 0 : 0.2 }}
      className={`relative overflow-hidden rounded-2xl shadow-lg ${cardBg}`}
      style={{
        border: '1px solid rgba(139, 115, 85, 0.2)',
      }}
    >
      {/* 和紙紋理背景 */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/rice-paper.png')",
          mixBlendMode: 'multiply'
        }}
      />

      {/* 青海波紋理（右下角裝飾） */}
      <div
        className="absolute -bottom-20 -right-20 w-60 h-60 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50'%3E%3Cpath d='M0 25 Q25 0 50 25 T100 25' fill='none' stroke='%23${accentColor.replace('#', '')}' stroke-width='2'/%3E%3Cpath d='M0 35 Q25 10 50 35 T100 35' fill='none' stroke='%23${accentColor.replace('#', '')}' stroke-width='2'/%3E%3Cpath d='M0 45 Q25 20 50 45 T100 45' fill='none' stroke='%23${accentColor.replace('#', '')}' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          transform: 'scale(2)'
        }}
      />

      <div className={`relative z-10 ${isMobile ? 'p-4' : 'p-6'}`}>
        {/* 頂部：標籤 + 航班資訊 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              {isOutbound ? '去程' : '回程'}
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#2c2623]">
                {flight?.airline || '--'} {flight?.flightNumber || '--'}
              </span>
              <span className="text-xs text-[#756d66]">
                {flight?.departureDate || '--/--'}
              </span>
            </div>
          </div>
          {flight?.hasMeal && (
            <span className="flex items-center gap-1 px-2 py-1 bg-[#2c2623]/5 rounded text-xs text-[#756d66]">
              <UtensilsCrossed className="w-3 h-3" />
              餐食
            </span>
          )}
        </div>

        {/* 主要內容：航班路線 + 圖片 */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
          {/* 左側：圖片（回程時顯示） */}
          {!isOutbound && !isMobile && (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <img
                src={imageUrl}
                alt="目的地"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 100%)'
                }}
              >
                <span
                  className="text-white text-2xl font-serif font-bold"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {departureCity}
                </span>
              </div>
            </div>
          )}

          {/* 中央：航班路線圖示 */}
          <div className="flex-1 flex flex-col justify-center">
            <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
              {/* 出發 */}
              <div className="flex-1 text-center">
                <div
                  className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-1`}
                  style={{ color: accentColor }}
                >
                  {flight?.departureTime || '--:--'}
                </div>
                <div className="text-lg font-bold text-[#2c2623]">
                  {flight?.departureAirport || '--'}
                </div>
                <div className="text-xs text-[#756d66]">
                  {departureCity}
                </div>
              </div>

              {/* 飛行動畫線 */}
              <div className="relative flex-1 h-12 flex items-center justify-center">
                {/* 虛線軌跡 */}
                <div className="absolute w-full top-1/2 border-t-2 border-dashed border-[#2c2623]/20" />

                {/* 飛機圖標（動畫） */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plane className="w-4 h-4 text-white -rotate-90" />
                  </div>
                </motion.div>

                {/* 飛行時間標籤 */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded text-xs text-[#756d66] shadow-sm border border-[#2c2623]/10">
                  {flight?.duration || '--'}
                </div>
              </div>

              {/* 抵達 */}
              <div className="flex-1 text-center">
                <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#2c2623] mb-1`}>
                  {flight?.arrivalTime || '--:--'}
                </div>
                <div className="text-lg font-bold text-[#2c2623]">
                  {flight?.arrivalAirport || '--'}
                </div>
                <div className="text-xs text-[#756d66]">
                  {arrivalCity}
                </div>
              </div>
            </div>
          </div>

          {/* 右側：圖片（去程時顯示） */}
          {isOutbound && !isMobile && (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <img
                src={imageUrl}
                alt="目的地"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(225deg, rgba(0,0,0,0.3) 0%, transparent 100%)'
                }}
              >
                <span
                  className="text-white text-2xl font-serif font-bold"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {arrivalCity}
                </span>
              </div>
            </div>
          )}

          {/* 手機版圖片 */}
          {isMobile && (
            <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-md mt-2">
              <img
                src={imageUrl}
                alt="目的地"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)'
                }}
              >
                <span className="text-white text-lg font-serif font-bold">
                  {isOutbound ? arrivalCity : departureCity}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 底部標籤 */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-[#2c2623]/10 border-dashed">
          <span className="flex items-center gap-1 text-xs text-[#756d66]">
            <Luggage className="w-3 h-3" />
            行李直掛
          </span>
          <span className="text-[#2c2623]/20">·</span>
          <span className="text-xs text-[#756d66]">
            當地時間
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * 從機場字串中提取城市名稱
 */
function extractCityName(airport: string | null | undefined): string {
  if (!airport) return '--'
  if (/[\u4e00-\u9fa5]/.test(airport)) {
    return airport.slice(0, 2)
  }
  return airport
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
    if (coverStyle === 'nature' || coverStyle === 'serene') {
      effectiveFlightStyle = 'chinese'
    } else if (coverStyle === 'luxury') {
      effectiveFlightStyle = 'luxury'
    }
  }

  // 國內無航班 - 不顯示航班區塊
  if (effectiveFlightStyle === 'none') {
    return null
  }

  // Art 風格直接使用專屬組件（透過 flightStyle 或 coverStyle）
  if (effectiveFlightStyle === 'art' || coverStyle === 'art') {
    return <TourFlightSectionArt data={data} viewMode={viewMode} />
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
      className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-white' : 'pt-8 pb-16 bg-white'}
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
