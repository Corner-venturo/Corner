'use client'

import { motion } from 'framer-motion'
import { Plane, Calendar, Clock, Luggage, UtensilsCrossed } from 'lucide-react'
import { FlightCardProps } from './types'

// 雲朵圖標組件
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

// 從機場字串中提取城市名稱
export function extractCityName(airport: string | null | undefined): string {
  if (!airport) return '--'
  if (/[\u4e00-\u9fa5]/.test(airport)) {
    return airport.slice(0, 2)
  }
  return airport
}

/**
 * 中國風航班卡片組件 - 用於 nature/serene 風格
 */
export function ChineseFlightCard({
  flight,
  type,
  viewMode,
}: FlightCardProps) {
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
