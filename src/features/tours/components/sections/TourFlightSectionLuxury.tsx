'use client'

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import type { FlightInfo } from '@/types/flight.types'

// Luxury 配色
const LUXURY = {
  primary: '#2C5F4D',
  secondary: '#C69C6D',
  accent: '#8F4F4F',
  background: '#FDFBF7',
  surface: '#FFFFFF',
  text: '#2D3436',
  muted: '#636E72',
}

interface TourFlightSectionLuxuryProps {
  data: {
    outboundFlight?: FlightInfo | null
    returnFlight?: FlightInfo | null
  }
  viewMode: 'desktop' | 'mobile'
}

// 格式化日期
function formatFlightDate(dateStr: string | undefined | null): { date: string; day: string } {
  if (!dateStr) return { date: '--', day: '--' }
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return { date: '--', day: '--' }
    const month = date.getMonth()
    const dayOfMonth = date.getDate()
    const dayOfWeek = date.getDay()
    if (isNaN(month) || isNaN(dayOfMonth) || isNaN(dayOfWeek)) return { date: '--', day: '--' }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return {
      date: `${month + 1}.${dayOfMonth.toString().padStart(2, '0')}`,
      day: days[dayOfWeek]
    }
  } catch {
    return { date: '--', day: '--' }
  }
}

export function TourFlightSectionLuxury({ data, viewMode }: TourFlightSectionLuxuryProps) {
  const isMobile = viewMode === 'mobile'
  const hasFlightInfo = data.outboundFlight || data.returnFlight

  if (!hasFlightInfo) return null

  return (
    <section
      className={isMobile ? 'py-8' : 'py-16'}
      style={{ backgroundColor: LUXURY.background }}
    >
      <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 卡片容器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl shadow-lg border overflow-hidden relative"
          style={{ borderColor: '#f0f0f0' }}
        >
          {/* 左側強調線 */}
          <div
            className="absolute top-0 left-0 w-2 h-full"
            style={{ backgroundColor: LUXURY.primary }}
          />

          {/* 標題區 */}
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-end ${isMobile ? 'p-6 pb-4' : 'p-8 lg:p-12 pb-6'} gap-4`}>
            <div>
              <span
                className="italic block mb-1"
                style={{
                  color: LUXURY.secondary,
                  fontFamily: "'Noto Serif TC', serif",
                  fontSize: isMobile ? '1rem' : '1.125rem'
                }}
              >
                Your Journey Begins
              </span>
              <h2
                className={`font-bold ${isMobile ? 'text-xl' : 'text-3xl'}`}
                style={{
                  color: LUXURY.text,
                  fontFamily: "'Noto Serif TC', serif"
                }}
              >
                航班資訊詳情
              </h2>
            </div>
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: LUXURY.muted }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: LUXURY.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>航班時間僅供參考，請以最終電子機票為主</span>
            </div>
          </div>

          {/* 航班表格 */}
          <div className={`overflow-x-auto ${isMobile ? 'px-4 pb-6' : 'px-8 lg:px-12 pb-8'}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: LUXURY.muted }}>Type</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: LUXURY.muted }}>Date</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: LUXURY.muted }}>Airline</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: LUXURY.muted }}>Flight No.</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: LUXURY.muted }}>Schedule</th>
                  {!isMobile && (
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: LUXURY.muted }}>Class</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* 去程 */}
                {data.outboundFlight && (
                  <FlightRow
                    flight={data.outboundFlight}
                    type="outbound"
                    isMobile={isMobile}
                  />
                )}
                {/* 回程 */}
                {data.returnFlight && (
                  <FlightRow
                    flight={data.returnFlight}
                    type="return"
                    isMobile={isMobile}
                  />
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// 航班行組件
function FlightRow({
  flight,
  type,
  isMobile
}: {
  flight: FlightInfo
  type: 'outbound' | 'return'
  isMobile: boolean
}) {
  const isOutbound = type === 'outbound'
  const { date, day } = formatFlightDate(flight.departureDate)
  const iconBgColor = isOutbound ? `${LUXURY.primary}10` : `${LUXURY.secondary}10`
  const iconColor = isOutbound ? LUXURY.primary : LUXURY.secondary

  return (
    <tr
      className="group hover:bg-muted transition-colors"
      style={{ borderBottom: `1px solid #f0f0f0` }}
    >
      {/* Type */}
      <td className="py-6 px-4">
        <div
          className="flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          {/* 統一使用起飛圖案 */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
          <span className="text-[9px] font-bold uppercase mt-0.5">
            {isOutbound ? 'Out' : 'In'}
          </span>
        </div>
      </td>

      {/* Date */}
      <td className="py-6 px-4">
        <span
          className="text-lg font-medium"
          style={{
            color: LUXURY.text,
            fontFamily: "'Noto Serif TC', serif"
          }}
        >
          {date}
        </span>
        <span
          className="text-xs font-normal ml-2"
          style={{ color: LUXURY.muted }}
        >
          {day}
        </span>
      </td>

      {/* Airline */}
      <td className="py-6 px-4">
        <span className="font-bold" style={{ color: LUXURY.text }}>
          {flight.airline || '--'}
        </span>
      </td>

      {/* Flight No */}
      <td className="py-6 px-4 font-mono" style={{ color: LUXURY.muted }}>
        {flight.flightNumber || '--'}
      </td>

      {/* Schedule */}
      <td className="py-6 px-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div>
            <div
              className={`font-bold ${isMobile ? 'text-base' : 'text-xl'}`}
              style={{ color: LUXURY.text }}
            >
              {flight.departureTime || '--:--'}
            </div>
            <div
              className="text-[10px] font-bold tracking-wider"
              style={{ color: LUXURY.muted }}
            >
              {flight.departureAirport || '--'}
            </div>
          </div>

          {/* 箭頭 */}
          <div className="h-px w-6 md:w-8 bg-border relative">
            <div
              className="absolute -top-1 right-0 w-2 h-2 border-t border-r rotate-45"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          <div>
            <div
              className={`font-bold ${isMobile ? 'text-base' : 'text-xl'}`}
              style={{ color: LUXURY.text }}
            >
              {flight.arrivalTime || '--:--'}
            </div>
            <div
              className="text-[10px] font-bold tracking-wider"
              style={{ color: LUXURY.muted }}
            >
              {flight.arrivalAirport || '--'}
            </div>
          </div>
        </div>
      </td>

      {/* Class */}
      {!isMobile && (
        <td className="py-6 px-4 text-right">
          <span
            className="inline-block px-3 py-1 rounded-full border text-xs"
            style={{ borderColor: '#E5E7EB', color: LUXURY.muted }}
          >
            Economy
          </span>
        </td>
      )}
    </tr>
  )
}
