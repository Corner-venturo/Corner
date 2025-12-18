'use client'

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'

// Dreamscape 配色
const DREAM = {
  base: '#fdfbf7',
  lavender: '#e6e6fa',
  peach: '#ffe5b4',
  sky: '#e0f7fa',
  text: '#4a4a4a',
  accent: '#ff7f50',
  purple: '#9370db',
  sand: '#fcf6e9',
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

interface TourFlightSectionDreamscapeProps {
  data: {
    outboundFlight?: FlightInfo | null
    returnFlight?: FlightInfo | null
    departureDate?: string | null
  }
  viewMode: 'desktop' | 'mobile'
}

// 格式化日期為 DEC 24 格式
function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  try {
    // 嘗試解析 "MM/DD" 格式
    const mmddMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/)
    if (mmddMatch) {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      const month = parseInt(mmddMatch[1], 10) - 1
      const day = parseInt(mmddMatch[2], 10)
      if (month >= 0 && month < 12) return `${months[month]} ${day}`
    }
    // 嘗試 ISO 格式
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      const day = date.getDate()
      return `${month} ${day}`
    }
    return ''
  } catch {
    return ''
  }
}

// 單程航班節點
function FlightNode({
  flight,
  type,
  departureDate,
  isMobile,
}: {
  flight: FlightInfo
  type: 'outbound' | 'return'
  departureDate?: string | null
  isMobile: boolean
}) {
  const isOutbound = type === 'outbound'
  const dateDisplay = formatDateShort(flight.departureDate || departureDate)
  const fromAirport = flight.departureAirport || (isOutbound ? 'TPE' : '---')
  const toAirport = flight.arrivalAirport || '---'
  const flightInfo = [flight.airline, flight.flightNumber].filter(Boolean).join(' ') || ''
  const duration = flight.duration || ''

  return (
    <div className={`flex justify-between items-center relative w-full ${isMobile ? 'flex-col gap-8' : ''}`}>
      {/* 起點 */}
      <motion.div
        className="text-center group"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          className="w-4 h-4 rounded-full mb-4 mx-auto ring-4 transition-all"
          style={{
            backgroundColor: DREAM.accent,
            boxShadow: `0 0 0 4px ${DREAM.accent}33`,
          }}
          whileHover={{ scale: 1.25 }}
        />
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: isMobile ? '1.5rem' : '1.875rem',
            color: DREAM.text,
          }}
        >
          {fromAirport}
        </div>
        {dateDisplay && (
          <div
            className="text-xs uppercase tracking-widest mt-1"
            style={{ color: `${DREAM.text}80` }}
          >
            {dateDisplay}
          </div>
        )}
      </motion.div>

      {/* 中間航班資訊 */}
      {!isMobile && (
        <>
          {/* 連接線 */}
          <div
            className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2"
            style={{ backgroundColor: `${DREAM.text}1a` }}
          />

          {/* 航班資訊氣泡 */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-full border shadow-sm flex gap-4 items-center bg-white z-10"
            style={{ borderColor: `${DREAM.purple}33` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.span
              style={{ color: DREAM.purple }}
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plane className="w-5 h-5" />
            </motion.span>
            <span
              className="text-xs"
              style={{
                fontFamily: 'monospace',
                color: `${DREAM.text}99`,
              }}
            >
              {flightInfo && <span>{flightInfo}</span>}
              {flightInfo && duration && <span> · </span>}
              {duration && <span>{duration}</span>}
              {!flightInfo && !duration && <span>航班資訊</span>}
            </span>
          </motion.div>
        </>
      )}

      {/* 手機版航班資訊 */}
      {isMobile && (
        <motion.div
          className="px-6 py-3 rounded-full border shadow-sm flex gap-3 items-center bg-white"
          style={{ borderColor: `${DREAM.purple}33` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.span
            style={{ color: DREAM.purple }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Plane className="w-5 h-5 rotate-90" />
          </motion.span>
          <span className="text-xs" style={{ fontFamily: 'monospace', color: `${DREAM.text}99` }}>
            {flightInfo || '航班資訊'}
            {duration && ` · ${duration}`}
          </span>
        </motion.div>
      )}

      {/* 終點 */}
      <motion.div
        className="text-center group"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div
          className="w-4 h-4 rounded-full mb-4 mx-auto ring-4 transition-all"
          style={{
            backgroundColor: DREAM.purple,
            boxShadow: `0 0 0 4px ${DREAM.purple}33`,
          }}
          whileHover={{ scale: 1.25 }}
        />
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: isMobile ? '1.5rem' : '1.875rem',
            color: DREAM.text,
          }}
        >
          {toAirport}
        </div>
        <div
          className="text-xs uppercase tracking-widest mt-1"
          style={{ color: `${DREAM.text}80` }}
        >
          {isOutbound ? 'ARRIVAL' : 'HOME'}
        </div>
      </motion.div>
    </div>
  )
}

export function TourFlightSectionDreamscape({ data, viewMode }: TourFlightSectionDreamscapeProps) {
  const isMobile = viewMode === 'mobile'
  const outbound = data.outboundFlight
  const returnFlight = data.returnFlight

  // 如果沒有航班資料，不顯示
  if (!outbound && !returnFlight) return null

  return (
    <section
      className="py-24 relative w-full overflow-hidden"
      style={{ backgroundColor: DREAM.base }}
    >
      {/* 頂部分隔線 */}
      <div
        className="absolute top-0 left-0 w-full h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${DREAM.purple}4d, transparent)`,
        }}
      />

      <div className="max-w-[1600px] mx-auto px-6 relative z-10">
        {/* 玻璃卡片容器 */}
        <motion.div
          className="w-full rounded-[4rem] p-12 lg:p-20 relative overflow-hidden group"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Hover 光效 */}
          <div
            className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.4), transparent, rgba(255,255,255,0.4))`,
            }}
          />

          <div className={`flex ${isMobile ? 'flex-col gap-12' : 'flex-col lg:flex-row justify-between items-center gap-12'} relative z-10`}>
            {/* 標題 */}
            <div className={`${isMobile ? 'text-center' : 'text-center lg:text-left'}`}>
              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: isMobile ? '1.5rem' : '2.25rem',
                  color: `${DREAM.text}66`,
                }}
              >
                The Passage
              </h2>
              <div
                style={{
                  fontFamily: "'La Belle Aurore', cursive",
                  fontSize: isMobile ? '2rem' : '3.75rem',
                  color: DREAM.purple,
                }}
              >
                Flight Path
              </div>
            </div>

            {/* 航班路線 */}
            <div className="flex-1 w-full max-w-4xl relative">
              {/* 去程 */}
              {outbound && (
                <div className={returnFlight ? 'mb-12' : ''}>
                  <FlightNode
                    flight={outbound}
                    type="outbound"
                    departureDate={data.departureDate}
                    isMobile={isMobile}
                  />
                </div>
              )}

              {/* 回程 */}
              {returnFlight && (
                <div className="pt-8 border-t" style={{ borderColor: `${DREAM.text}1a` }}>
                  <div className="text-xs uppercase tracking-widest mb-6 text-center" style={{ color: `${DREAM.text}66` }}>
                    Return Journey
                  </div>
                  <FlightNode
                    flight={returnFlight}
                    type="return"
                    isMobile={isMobile}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 載入 Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=La+Belle+Aurore&display=swap');
      `}</style>
    </section>
  )
}
