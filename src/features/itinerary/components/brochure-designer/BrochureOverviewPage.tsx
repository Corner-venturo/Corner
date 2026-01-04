'use client'

import React, { forwardRef } from 'react'
import { Plane, Users, BadgeCheck, MapPin, ArrowRight } from 'lucide-react'
import type { BrochureCoverData } from './types'
import type { Itinerary, FlightInfo, DailyItineraryDay } from '@/stores/types'

interface BrochureOverviewPageProps {
  data: BrochureCoverData
  itinerary?: Itinerary | null
}

// 格式化航班時間
const formatFlightTime = (flight?: FlightInfo) => {
  if (!flight) return null
  return {
    flightNumber: flight.flightNumber || '',
    departure: `${flight.departureTime || ''} ${flight.departureAirport || ''}`,
    arrival: `${flight.arrivalTime || ''} ${flight.arrivalAirport || ''}`,
  }
}

// 格式化日期
const formatDate = (dateStr: string, dayIndex: number) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + dayIndex)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const weekday = weekdays[date.getDay()]
    return `${month}/${day} (${weekday})`
  } catch {
    return ''
  }
}

export const BrochureOverviewPage = forwardRef<HTMLDivElement, BrochureOverviewPageProps>(
  function BrochureOverviewPage({ data, itinerary }, ref) {
    const outboundFlight = formatFlightTime(itinerary?.outbound_flight)
    const returnFlight = formatFlightTime(itinerary?.return_flight)
    const dailyItinerary = itinerary?.daily_itinerary || []
    const departureDate = itinerary?.departure_date || ''
    const leaderName = itinerary?.leader?.name || data.companyName
    const leaderPhone = itinerary?.leader?.domesticPhone || data.emergencyContact

    // 日文標題（根據目的地）
    const getJapaneseTitle = () => {
      const city = data.city?.toLowerCase()
      if (city?.includes('kyoto') || city?.includes('osaka') || city?.includes('kansai')) return '関西の旅'
      if (city?.includes('tokyo')) return '東京の旅'
      if (city?.includes('hokkaido')) return '北海道の旅'
      return `${data.city}の旅`
    }

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-row"
        style={{
          width: '100%',
          maxWidth: '840px',
          aspectRatio: '1280 / 1117',
        }}
      >
        {/* 左半頁：航班 + 集合 + 領隊 */}
        <div className="w-1/2 flex flex-col border-r border-border relative bg-white h-full">
          {/* 上方裝飾區 - 青色背景 */}
          <div className="h-[42%] bg-teal-600 relative overflow-hidden flex items-center justify-center p-6">
            {/* 波浪紋背景 */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='10' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M0,10 Q10,0 20,10' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.15'/%3E%3C/svg%3E")`,
              }}
            />

            {/* 日文標題卡片 */}
            <div className="z-10 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded flex flex-col items-center justify-center">
              <h1
                className="text-2xl font-bold text-white tracking-[0.15em] leading-relaxed"
                style={{ writingMode: 'vertical-rl' }}
              >
                {getJapaneseTitle()}
              </h1>
              <div className="h-px w-6 bg-white/50 my-3" />
              <span className="text-white/90 text-[10px] font-medium tracking-widest uppercase">
                Travel Guide
              </span>
            </div>
          </div>

          {/* 下方資訊區 */}
          <div className="flex-grow px-5 pt-4 pb-5 flex flex-col justify-between bg-slate-50/30 relative text-sm">
            {/* 航班資訊 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5 w-5">
                <Plane size={16} className="text-teal-600" />
                <div className="w-px flex-grow bg-teal-600/20 mt-1.5" />
              </div>
              <div className="flex-grow space-y-2">
                <h3 className="font-bold text-slate-800 text-sm border-b border-teal-600/20 pb-1.5 flex justify-between items-end">
                  フライト情報
                  <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Flight</span>
                </h3>
                <div className="space-y-2">
                  {/* 去程 */}
                  {outboundFlight && (
                    <div className="relative pl-3 border-l-2 border-orange-400/40">
                      <span className="absolute -left-[4px] top-1 w-1.5 h-1.5 rounded-full bg-orange-500 border border-white" />
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[9px] font-bold text-orange-500 tracking-wider">OUT</span>
                        <span className="text-[9px] font-mono text-slate-400">{outboundFlight.flightNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="font-bold">{outboundFlight.departure}</span>
                        <ArrowRight size={10} className="text-slate-400" />
                        <span className="font-bold">{outboundFlight.arrival}</span>
                      </div>
                    </div>
                  )}
                  {/* 回程 */}
                  {returnFlight && (
                    <div className="relative pl-3 border-l-2 border-teal-600/40">
                      <span className="absolute -left-[4px] top-1 w-1.5 h-1.5 rounded-full bg-teal-600 border border-white" />
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[9px] font-bold text-teal-600 tracking-wider">IN</span>
                        <span className="text-[9px] font-mono text-slate-400">{returnFlight.flightNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="font-bold">{returnFlight.departure}</span>
                        <ArrowRight size={10} className="text-slate-400" />
                        <span className="font-bold">{returnFlight.arrival}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 集合資訊 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5 w-5">
                <Users size={16} className="text-teal-600" />
                <div className="w-px flex-grow bg-teal-600/20 mt-1.5" />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-slate-800 text-sm border-b border-teal-600/20 pb-1.5 mb-2 flex justify-between items-end">
                  集合のご案内
                  <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Meeting</span>
                </h3>
                <div className="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider self-center">Time</span>
                    <span className="font-bold text-slate-700">
                      {itinerary?.meeting_info?.time || `${departureDate} 06:30`}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider self-start mt-0.5">Place</span>
                    <span className="text-slate-600 leading-relaxed text-[11px]">
                      {itinerary?.meeting_info?.location || '桃園機場第二航廈 3F\n團體櫃檯前'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 領隊資訊 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5 w-5">
                <BadgeCheck size={16} className="text-teal-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-slate-800 text-sm border-b border-teal-600/20 pb-1.5 mb-2 flex justify-between items-end">
                  添乗員
                  <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Guide</span>
                </h3>
                <div className="flex items-center gap-3 bg-teal-600/5 px-3 py-2 rounded border border-teal-600/10">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm border border-white">
                    <BadgeCheck size={16} />
                  </div>
                  <div className="flex-grow flex justify-between items-center">
                    <p className="font-bold text-slate-700 text-sm">{leaderName}</p>
                    <p className="text-xs text-slate-500 font-mono tracking-wider">{leaderPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 頁碼 */}
            <div className="absolute bottom-2 left-4 text-[8px] text-slate-400 font-mono">04</div>
          </div>
        </div>

        {/* 右半頁：行程總攬 */}
        <div className="w-1/2 flex flex-col relative bg-white h-full">
          {/* 標題 */}
          <div className="pt-5 px-5 pb-3 flex-shrink-0">
            <div className="flex items-start justify-between border-b-2 border-teal-600/10 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-widest">行程總攬</h2>
                <p className="text-[9px] text-teal-600 uppercase tracking-[0.15em] mt-1">Itinerary Overview</p>
              </div>
              <MapPin size={28} className="text-teal-600/20" />
            </div>
          </div>

          {/* 每日行程列表 */}
          <div className="flex-grow px-5 pb-5 flex flex-col relative overflow-hidden">
            {/* 時間線 */}
            <div className="absolute left-[2.8rem] top-0 bottom-5 w-px bg-slate-200 z-0" />

            <div className="flex-grow flex flex-col justify-between">
              {dailyItinerary.slice(0, 5).map((day, index) => (
                <div key={index} className="relative flex items-start flex-1">
                  {/* 日期標籤 */}
                  <div className="w-12 flex-shrink-0 flex flex-col items-center z-10 bg-white pt-1">
                    <span className="text-[8px] text-slate-400 font-bold tracking-widest mb-0.5">DAY</span>
                    <span className="text-lg font-bold text-teal-600">{String(index + 1).padStart(2, '0')}</span>
                  </div>

                  {/* 內容 */}
                  <div className="flex-grow pl-4 pb-2 border-b border-dotted border-slate-200">
                    <div className="flex flex-col gap-0.5 mb-1">
                      <span className="text-[9px] font-mono text-slate-400">
                        {formatDate(departureDate, index)}
                      </span>
                      <h4 className="text-sm font-bold text-slate-700 line-clamp-1">
                        {day.title || `第 ${index + 1} 天`}
                      </h4>
                    </div>

                    {/* 標籤 */}
                    {day.activities && day.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {day.activities.slice(0, 2).map((act, i) => (
                          <span
                            key={i}
                            className="text-[8px] px-1.5 py-0.5 bg-teal-600/10 text-teal-700 rounded"
                          >
                            {act.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 描述 */}
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                      {day.activities?.map((a) => a.title).join(' → ') || '行程待定'}
                    </p>
                  </div>
                </div>
              ))}

              {/* 如果行程少於 5 天，顯示裝飾 */}
              {dailyItinerary.length < 5 && (
                <div className="relative flex items-center flex-1 pt-2">
                  <div className="w-12 flex-shrink-0 flex flex-col items-center z-10 bg-white opacity-30">
                    <span className="text-[8px] text-slate-400 font-bold tracking-widest mb-0.5">DAY</span>
                    <span className="text-lg font-bold text-slate-300">
                      {String(dailyItinerary.length + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex-grow pl-4">
                    <div className="w-full flex items-center justify-center h-16 bg-slate-50 border border-slate-100 rounded">
                      <p
                        className="text-sm font-medium text-slate-300 tracking-[0.2em]"
                        style={{ writingMode: 'vertical-rl' }}
                      >
                        旅の思い出は、心の中に。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 頁碼 */}
          <div className="absolute bottom-2 right-4 text-[8px] text-slate-400 font-mono">05</div>
        </div>
      </div>
    )
  }
)
