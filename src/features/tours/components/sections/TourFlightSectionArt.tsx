'use client'

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'

// Art/Magazine 配色 - 根據 HTML 模板
const ART = {
  black: '#0a0a0a',
  paper: '#f4f1ea',
  accent: '#D4AF37',
  ink: '#1a1a1a',
  clay: '#c76d54',
  sage: '#8da399',
}

interface FlightInfo {
  airline?: string | null
  flightNumber?: string | null
  departureAirport?: string | null
  departureTime?: string | null
  departureDate?: string | null
  arrivalAirport?: string | null
  arrivalTime?: string | null
  duration?: string | null
  hasMeal?: boolean | null
}

interface TourFlightSectionArtProps {
  data: {
    outboundFlight?: FlightInfo | null
    returnFlight?: FlightInfo | null
  }
  viewMode: 'desktop' | 'mobile'
}

// 格式化日期為藝術雜誌風格
function formatFlightDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    if (isNaN(day) || isNaN(month) || isNaN(year)) return ''
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${day} ${months[month]} ${year}`
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
      className={`relative border group cursor-pointer transition-all duration-300 ${
        isMobile ? 'p-6' : 'p-8'
      }`}
      style={{
        borderColor: ART.ink,
        backgroundColor: ART.paper,
      }}
      whileHover={{
        backgroundColor: ART.black,
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
              className="text-sm mt-2 transition-colors duration-300 group-hover:text-gray-400"
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
                className="flex-1 border-t-2 border-dashed transition-colors duration-300 group-hover:border-gray-600"
                style={{ borderColor: `${ART.ink}30` }}
              />
              <Plane
                className="w-5 h-5 mx-2 rotate-90 transition-colors duration-300 group-hover:text-white"
                style={{ color: ART.ink }}
              />
              <div
                className="flex-1 border-t-2 border-dashed transition-colors duration-300 group-hover:border-gray-600"
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
              className="text-sm mt-2 transition-colors duration-300 group-hover:text-gray-400"
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
          className={`flex justify-between items-end border-t mt-6 pt-4 transition-colors duration-300 group-hover:border-gray-700 ${
            isMobile ? 'flex-col gap-4' : ''
          }`}
          style={{ borderColor: `${ART.ink}20` }}
        >
          <div>
            <span
              className="block text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 group-hover:text-gray-500"
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
                className="block text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 group-hover:text-gray-500"
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
                className="block text-[10px] uppercase tracking-widest mb-1 transition-colors duration-300 group-hover:text-gray-500"
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
