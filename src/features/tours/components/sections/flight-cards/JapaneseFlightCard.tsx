'use client'

import { motion } from 'framer-motion'
import { Plane, UtensilsCrossed } from 'lucide-react'
import { FlightCardProps, FlightInfo } from './types'
import { extractCityName } from './ChineseFlightCard'

interface JapaneseFlightCardProps extends FlightCardProps {
  destinationImage?: string | null
}

/**
 * 日式和紙風格航班卡片 - 帶目的地圖片
 */
export function JapaneseFlightCard({
  flight,
  type,
  viewMode,
  destinationImage,
}: JapaneseFlightCardProps) {
  const isOutbound = type === 'outbound'
  const isMobile = viewMode === 'mobile'

  // 預設圖片（日本富士山/台灣景點）
  const defaultOutboundImage = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80'
  const taiwanImage = 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&q=80'

  // 去程：用封面照片，回程：統一用台灣照片
  const imageUrl = isOutbound ? (destinationImage || defaultOutboundImage) : taiwanImage

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
              <div className="relative flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full h-12 flex items-center justify-center">
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
                </div>
                {/* 飛行時間標籤 - 置中下方 */}
                <div className="text-xs text-[#756d66] mt-1">
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
                  {arrivalCity}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  )
}
