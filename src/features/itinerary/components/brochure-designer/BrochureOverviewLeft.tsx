'use client'

import React, { forwardRef } from 'react'
import { Plane, Users, BadgeCheck, ArrowRight } from 'lucide-react'
import type { BrochureCoverData } from './types'
import type { Itinerary, FlightInfo } from '@/stores/types'

interface BrochureOverviewLeftProps {
  data: BrochureCoverData
  itinerary?: Itinerary | null
}

const formatFlightTime = (flight?: FlightInfo) => {
  if (!flight) return null
  return {
    flightNumber: flight.flightNumber || '',
    departure: `${flight.departureTime || ''} ${flight.departureAirport || ''}`,
    arrival: `${flight.arrivalTime || ''} ${flight.arrivalAirport || ''}`,
  }
}

export const BrochureOverviewLeft = forwardRef<HTMLDivElement, BrochureOverviewLeftProps>(
  function BrochureOverviewLeft({ data, itinerary }, ref) {
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
        className="bg-white overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '420px', aspectRatio: '1 / 1.414' }}
      >
        {/* 上方裝飾區 */}
        <div className="h-[38%] bg-teal-600 relative overflow-hidden flex items-center justify-center p-6">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='10' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="z-10 bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-4 rounded flex flex-col items-center">
            <h1
              className="text-xl sm:text-2xl font-bold text-white tracking-[0.12em] leading-relaxed"
              style={{ writingMode: 'vertical-rl' }}
            >
              {getJapaneseTitle()}
            </h1>
            <div className="h-px w-6 bg-white/50 my-2" />
            <span className="text-white/80 text-[9px] font-medium tracking-widest uppercase">Travel Guide</span>
          </div>
        </div>

        {/* 下方資訊區 */}
        <div className="flex-grow px-6 pt-5 pb-6 flex flex-col gap-4 bg-slate-50/50 relative">
          {/* 航班資訊 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-0.5 w-5 flex-shrink-0">
              <Plane size={16} className="text-teal-600" />
              <div className="w-px flex-grow bg-teal-600/20 mt-1" />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-slate-800 text-sm border-b border-teal-600/20 pb-1 mb-2 flex justify-between items-end">
                フライト情報
                <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Flight</span>
              </h3>
              <div className="space-y-2">
                {outboundFlight && (
                  <div className="relative pl-3 border-l-2 border-orange-400/50">
                    <span className="absolute -left-[4px] top-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[9px] font-bold text-orange-500">OUT</span>
                      <span className="text-[9px] font-mono text-slate-400">{outboundFlight.flightNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span className="font-semibold">{outboundFlight.departure}</span>
                      <ArrowRight size={10} className="text-slate-400" />
                      <span className="font-semibold">{outboundFlight.arrival}</span>
                    </div>
                  </div>
                )}
                {returnFlight && (
                  <div className="relative pl-3 border-l-2 border-teal-600/50">
                    <span className="absolute -left-[4px] top-1 w-1.5 h-1.5 rounded-full bg-teal-600" />
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[9px] font-bold text-teal-600">IN</span>
                      <span className="text-[9px] font-mono text-slate-400">{returnFlight.flightNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span className="font-semibold">{returnFlight.departure}</span>
                      <ArrowRight size={10} className="text-slate-400" />
                      <span className="font-semibold">{returnFlight.arrival}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 集合資訊 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-0.5 w-5 flex-shrink-0">
              <Users size={16} className="text-teal-600" />
              <div className="w-px flex-grow bg-teal-600/20 mt-1" />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-slate-800 text-sm border-b border-teal-600/20 pb-1 mb-2 flex justify-between items-end">
                集合のご案内
                <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Meeting</span>
              </h3>
              <div className="bg-white px-3 py-2.5 rounded border border-slate-200 shadow-sm">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase self-center">Time</span>
                  <span className="font-semibold text-slate-700">
                    {itinerary?.meeting_info?.time || departureDate}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase self-start mt-0.5">Place</span>
                  <span className="text-slate-600 leading-relaxed text-[11px]">
                    {itinerary?.meeting_info?.location || '桃園機場第二航廈\n團體櫃檯前'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 領隊資訊 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-0.5 w-5 flex-shrink-0">
              <BadgeCheck size={16} className="text-teal-600" />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-slate-800 text-sm border-b border-teal-600/20 pb-1 mb-2 flex justify-between items-end">
                添乗員
                <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Guide</span>
              </h3>
              <div className="flex items-center gap-3 bg-teal-600/5 px-3 py-2.5 rounded border border-teal-600/10">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm">
                  <BadgeCheck size={16} />
                </div>
                <div className="flex-grow flex justify-between items-center">
                  <p className="font-bold text-slate-700 text-sm">{leaderName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{leaderPhone}</p>
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
