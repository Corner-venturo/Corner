'use client'

import React, { forwardRef } from 'react'
import { Plane, Users, BadgeCheck, ArrowRight } from 'lucide-react'
import type { BrochureCoverData } from './types'
import type { Itinerary, FlightInfo } from '@/stores/types'

interface BrochureOverviewLeftProps {
  data: BrochureCoverData
  itinerary?: Itinerary | null
  overviewImage?: string
}

const formatFlightTime = (flight?: FlightInfo) => {
  if (!flight) return null
  return {
    airline: flight.airline || '',
    flightNumber: flight.flightNumber || '',
    departure: `${flight.departureTime || ''} ${flight.departureAirport || ''}`,
    arrival: `${flight.arrivalTime || ''} ${flight.arrivalAirport || ''}`,
  }
}

export const BrochureOverviewLeft = forwardRef<HTMLDivElement, BrochureOverviewLeftProps>(
  function BrochureOverviewLeft({ data, itinerary, overviewImage }, ref) {
    const outboundFlight = formatFlightTime(itinerary?.outbound_flight)
    const returnFlight = formatFlightTime(itinerary?.return_flight)
    const departureDate = itinerary?.departure_date || ''
    const leaderName = itinerary?.leader?.name || '領隊'
    const leaderPhone = itinerary?.leader?.domesticPhone || data.emergencyContact

    const getJapaneseTitle = () => {
      const city = data.city?.toLowerCase()
      if (city?.includes('kyoto') || city?.includes('osaka')) return '関西の旅'
      if (city?.includes('tokyo')) return '東京の旅'
      if (city?.includes('hokkaido')) return '北海道の旅'
      if (city?.includes('chiang')) return 'タイの旅'
      return `${data.city || 'Journey'}`
    }

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-col w-full h-full"
      >
        {/* 上方裝飾區 - 50% */}
        <div className="h-[50%] bg-teal-600 relative overflow-hidden flex items-center justify-center p-4">
          {/* 背景圖片 */}
          {overviewImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${overviewImage})` }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='10' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              }}
            />
          )}
          {/* 漸層遮罩 */}
          {overviewImage && (
            <div className="absolute inset-0 bg-gradient-to-b from-teal-600/60 via-teal-600/40 to-teal-600/80" />
          )}
          <div className="z-10 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded flex flex-col items-center">
            <h1
              className="text-lg sm:text-xl font-bold text-white tracking-[0.12em] leading-relaxed"
              style={{ writingMode: 'vertical-rl' }}
            >
              {getJapaneseTitle()}
            </h1>
            <div className="h-px w-5 bg-white/50 my-1.5" />
            <span className="text-white/80 text-[8px] font-medium tracking-widest uppercase">Travel Guide</span>
          </div>
        </div>

        {/* 下方資訊區 - 50% */}
        <div className="h-[50%] px-4 pt-3 pb-4 flex flex-col gap-2 bg-slate-50/50 relative overflow-hidden">
          {/* 航班資訊 */}
          <div className="flex gap-2">
            <div className="flex flex-col items-center pt-0.5 w-4 flex-shrink-0">
              <Plane size={14} className="text-teal-600" />
              <div className="w-px flex-grow bg-teal-600/20 mt-1" />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-slate-500 text-[10px] border-b border-teal-600/20 pb-1 mb-1.5 flex justify-between items-end">
                航班資訊．フライト情報
                <span className="text-[8px] text-slate-400 font-normal uppercase tracking-wider">Flight</span>
              </h3>
              <div className="space-y-1.5">
                {outboundFlight && (
                  <div className="relative pl-2.5 border-l-2 border-orange-400/50">
                    <span className="absolute -left-[3px] top-1 w-1 h-1 rounded-full bg-orange-500" />
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[8px] font-bold text-orange-500">去程</span>
                      <span className="text-[8px] text-slate-500">
                        {outboundFlight.airline && <span className="mr-1">{outboundFlight.airline}</span>}
                        <span className="font-mono text-slate-400">{outboundFlight.flightNumber}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-700">
                      <span className="font-semibold">{outboundFlight.departure}</span>
                      <ArrowRight size={8} className="text-slate-400" />
                      <span className="font-semibold">{outboundFlight.arrival}</span>
                    </div>
                  </div>
                )}
                {returnFlight && (
                  <div className="relative pl-2.5 border-l-2 border-teal-600/50">
                    <span className="absolute -left-[3px] top-1 w-1 h-1 rounded-full bg-teal-600" />
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[8px] font-bold text-teal-600">回程</span>
                      <span className="text-[8px] text-slate-500">
                        {returnFlight.airline && <span className="mr-1">{returnFlight.airline}</span>}
                        <span className="font-mono text-slate-400">{returnFlight.flightNumber}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-700">
                      <span className="font-semibold">{returnFlight.departure}</span>
                      <ArrowRight size={8} className="text-slate-400" />
                      <span className="font-semibold">{returnFlight.arrival}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 集合資訊 */}
          <div className="flex gap-2">
            <div className="flex flex-col items-center pt-0.5 w-4 flex-shrink-0">
              <Users size={14} className="text-teal-600" />
              <div className="w-px flex-grow bg-teal-600/20 mt-1" />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-slate-500 text-[10px] border-b border-teal-600/20 pb-1 mb-1.5 flex justify-between items-end">
                集合資訊．集合のご案内
                <span className="text-[8px] text-slate-400 font-normal uppercase tracking-wider">Meeting</span>
              </h3>
              <div className="bg-white px-2.5 py-2 rounded border border-slate-200 shadow-sm">
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-[10px]">
                  <span className="text-[8px] font-bold text-slate-400 uppercase self-center">Time</span>
                  <span className="font-semibold text-slate-700">
                    {itinerary?.meeting_info?.time || departureDate}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase self-start mt-0.5">Place</span>
                  <span className="text-slate-600 leading-relaxed text-[10px]">
                    {itinerary?.meeting_info?.location || '桃園機場第二航廈\n團體櫃檯前'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 領隊資訊 */}
          <div className="flex gap-2">
            <div className="flex flex-col items-center pt-0.5 w-4 flex-shrink-0">
              <BadgeCheck size={14} className="text-teal-600" />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-slate-500 text-[10px] border-b border-teal-600/20 pb-1 mb-1.5 flex justify-between items-end">
                領隊．添乗員
                <span className="text-[8px] text-slate-400 font-normal uppercase tracking-wider">Guide</span>
              </h3>
              <div className="flex items-center gap-2 bg-teal-600/5 px-2.5 py-2 rounded border border-teal-600/10">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm">
                  <BadgeCheck size={14} />
                </div>
                <div className="flex-grow flex justify-between items-center">
                  <p className="font-bold text-slate-700 text-xs">{leaderName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{leaderPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 頁碼 */}
          <div className="absolute bottom-3 left-5 text-[9px] text-slate-400 font-mono">04</div>
        </div>
      </div>
    )
  }
)
