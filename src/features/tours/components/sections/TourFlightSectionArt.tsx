'use client'

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { ART } from './utils/art-theme'
import type { FlightInfo } from '@/types/flight.types'

// Brutalist 陰影
const brutalistShadow = '6px 6px 0px 0px rgba(28,28,28,1)'

interface TourFlightSectionArtProps {
  data: {
    outboundFlight?: FlightInfo | null
    returnFlight?: FlightInfo | null
  }
  viewMode: 'desktop' | 'mobile'
}

// 格式化日期為藝術雜誌風格
// 支援多種格式：
// - "10/21" (月/日) → "21 OCT"
// - "2024-10-21" (ISO) → "21 OCT 2024"
// - "10/21/2024" (月/日/年) → "21 OCT 2024"
function formatFlightDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  try {
    // 嘗試解析 "MM/DD" 格式（不含年份）
    const mmddMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/)
    if (mmddMatch) {
      const month = parseInt(mmddMatch[1], 10) - 1 // 0-indexed
      const day = parseInt(mmddMatch[2], 10)
      if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
        return `${day} ${months[month]}`
      }
    }

    // 嘗試解析 "MM/DD/YYYY" 格式
    const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mmddyyyyMatch) {
      const month = parseInt(mmddyyyyMatch[1], 10) - 1
      const day = parseInt(mmddyyyyMatch[2], 10)
      const year = parseInt(mmddyyyyMatch[3], 10)
      if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
        return `${day} ${months[month]} ${year}`
      }
    }

    // 嘗試解析 ISO 格式 "YYYY-MM-DD"
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const day = date.getDate()
      const month = date.getMonth()
      const year = date.getFullYear()
      // 過濾掉異常年份（2001 代表解析錯誤）
      if (year < 2020 || year > 2100) {
        return ''
      }
      return `${day} ${months[month]} ${year}`
    }

    return ''
  } catch {
    return ''
  }
}

// Brutalist 風格航班卡片
function FlightCard({
  flight,
  type,
  isMobile,
}: {
  flight: FlightInfo
  type: 'outbound' | 'return'
  isMobile: boolean
}) {
  const dateDisplay = formatFlightDate(flight.departureDate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative border-2 group cursor-pointer transition-all duration-300 ${
        isMobile ? 'p-6' : 'p-8'
      }`}
      style={{
        borderColor: ART.ink,
        backgroundColor: ART.paper,
        boxShadow: brutalistShadow,
      }}
      whileHover={{
        backgroundColor: ART.ink,
      }}
    >
      {/* 類型標籤 - 角落 */}
      <span
        className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 group-hover:text-white"
        style={{
          fontFamily: "'Cinzel', serif",
          color: ART.ink,
        }}
      >
        {type === 'outbound' ? 'OUTBOUND' : 'INBOUND'}
      </span>

      {/* 大型機場代碼浮水印 */}
      <div
        className="absolute top-0 right-0 text-[120px] leading-none font-black opacity-5 pointer-events-none select-none transition-opacity duration-300 group-hover:opacity-10"
        style={{
          fontFamily: "'Cinzel', serif",
        }}
      >
        {flight.departureAirport || 'TPE'}
      </div>

      {/* 主要內容 */}
      <div className={`relative z-10 ${isMobile ? 'mt-8' : 'mt-12'}`}>
        {/* 航線 */}
        <div className="flex items-center justify-between">
          {/* 出發 */}
          <div>
            <div
              className={`font-black tracking-tighter transition-colors duration-300 group-hover:text-white ${
                isMobile ? 'text-4xl' : 'text-6xl'
              }`}
              style={{
                fontFamily: "'Cinzel', serif",
                color: ART.ink,
              }}
            >
              {flight.departureAirport || 'TPE'}
            </div>
            <div
              className="text-sm mt-2 transition-colors duration-300 group-hover:text-morandi-muted"
              style={{
                fontFamily: 'monospace',
                color: '#6B7280',
              }}
            >
              {flight.departureTime || '--:--'}
            </div>
          </div>

          {/* 虛線航班路線 */}
          <div className="flex-1 mx-8 flex items-center justify-center">
            <div className="flex items-center w-full max-w-[200px]">
              <div
                className="flex-1 border-t-2 border-dashed transition-colors duration-300 group-hover:border-morandi-muted"
                style={{ borderColor: `${ART.ink}30` }}
              />
              <Plane
                className="w-5 h-5 mx-2 -rotate-90 transition-colors duration-300 group-hover:text-white"
                style={{ color: ART.ink }}
              />
              <div
                className="flex-1 border-t-2 border-dashed transition-colors duration-300 group-hover:border-morandi-muted"
                style={{ borderColor: `${ART.ink}30` }}
              />
            </div>
          </div>

          {/* 抵達 */}
          <div className="text-right">
            <div
              className={`font-black tracking-tighter transition-colors duration-300 group-hover:text-white ${
                isMobile ? 'text-4xl' : 'text-6xl'
              }`}
              style={{
                fontFamily: "'Cinzel', serif",
                color: ART.ink,
              }}
            >
              {flight.arrivalAirport || 'FUK'}
            </div>
            <div
              className="text-sm mt-2 transition-colors duration-300 group-hover:text-morandi-muted"
              style={{
                fontFamily: 'monospace',
                color: '#6B7280',
              }}
            >
              {flight.arrivalTime || '--:--'}
            </div>
          </div>
        </div>

        {/* 航班詳情 */}
        <div
          className={`flex justify-between items-end border-t mt-6 pt-4 transition-colors duration-300 group-hover:border-morandi-muted ${
            isMobile ? 'flex-col gap-4' : ''
          }`}
          style={{ borderColor: `${ART.ink}20` }}
        >
          <div>
            <span
              className="block text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 group-hover:text-morandi-muted"
              style={{ color: '#9CA3AF' }}
            >
              Flight
            </span>
            <span
              className="text-lg transition-colors duration-300 group-hover:text-white"
              style={{
                fontFamily: 'monospace',
                color: ART.ink,
              }}
            >
              {flight.airline} {flight.flightNumber}
            </span>
          </div>
          {dateDisplay && (
            <div className={isMobile ? '' : 'text-right'}>
              <span
                className="block text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 group-hover:text-morandi-muted"
                style={{ color: '#9CA3AF' }}
              >
                Date
              </span>
              <span
                className="text-lg transition-colors duration-300 group-hover:text-white"
                style={{
                  fontFamily: 'monospace',
                  color: ART.ink,
                }}
              >
                {dateDisplay}
              </span>
            </div>
          )}
          {flight.duration && (
            <div className={isMobile ? '' : 'text-right'}>
              <span
                className="block text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 group-hover:text-morandi-muted"
                style={{ color: '#9CA3AF' }}
              >
                Duration
              </span>
              <span
                className="text-lg transition-colors duration-300 group-hover:text-white"
                style={{
                  fontFamily: 'monospace',
                  color: ART.ink,
                }}
              >
                {flight.duration}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function TourFlightSectionArt({ data, viewMode }: TourFlightSectionArtProps) {
  const isMobile = viewMode === 'mobile'
  const hasFlightInfo = data.outboundFlight || data.returnFlight

  if (!hasFlightInfo) return null

  return (
    <section
      className={isMobile ? 'py-12' : 'py-24'}
      style={{ backgroundColor: ART.paper }}
    >
      <div className={isMobile ? 'px-4' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 標題區 - Brutalist 風格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${isMobile ? 'mb-8' : 'mb-16'}`}
        >
          <span
            className="block text-xs tracking-[0.3em] uppercase mb-4"
            style={{
              fontFamily: "'Cinzel', serif",
              color: ART.clay,
            }}
          >
            Flight Manifest
          </span>
          <h2
            className={`font-black leading-none tracking-tighter ${
              isMobile ? 'text-4xl' : 'text-6xl'
            }`}
            style={{
              fontFamily: "'Cinzel', 'Noto Serif TC', serif",
              color: ART.ink,
            }}
          >
            航班資訊
          </h2>
        </motion.div>

        {/* 航班卡片 - 網格佈局 */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
          {/* 去程 */}
          {data.outboundFlight && (
            <FlightCard
              flight={data.outboundFlight}
              type="outbound"
              isMobile={isMobile}
            />
          )}
          {/* 回程 */}
          {data.returnFlight && (
            <FlightCard
              flight={data.returnFlight}
              type="return"
              isMobile={isMobile}
            />
          )}
        </div>

        {/* 備註 - 打字機風格 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p
            className="text-xs tracking-wider"
            style={{
              fontFamily: 'monospace',
              color: '#9CA3AF',
            }}
          >
            * 航班時間僅供參考，請以最終電子機票為主
          </p>
        </motion.div>
      </div>
    </section>
  )
}
