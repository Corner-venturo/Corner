'use client'

import React, { forwardRef } from 'react'
import { MapPin } from 'lucide-react'
import type { BrochureCoverData } from './types'
import type { Itinerary } from '@/stores/types'

interface BrochureOverviewRightProps {
  data: BrochureCoverData
  itinerary?: Itinerary | null
}

const formatDate = (dateStr: string, dayIndex: number) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + dayIndex)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day} (${weekdays[date.getDay()]})`
  } catch {
    return ''
  }
}

export const BrochureOverviewRight = forwardRef<HTMLDivElement, BrochureOverviewRightProps>(
  function BrochureOverviewRight({ data, itinerary }, ref) {
    const dailyItinerary = itinerary?.daily_itinerary || []
    const departureDate = itinerary?.departure_date || ''

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-col w-full h-full"
      >
        {/* 標題 */}
        <div className="pt-6 px-6 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between border-b-2 border-teal-600/10 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-widest">行程總攬</h2>
              <p className="text-[9px] text-teal-600 uppercase tracking-[0.15em] mt-1">Itinerary Overview</p>
            </div>
            <MapPin size={24} className="text-teal-600/20" />
          </div>
        </div>

        {/* 每日行程 */}
        <div className="flex-grow px-6 pb-6 flex flex-col relative overflow-hidden">
          {/* 時間線 */}
          <div className="absolute left-[2.6rem] top-0 bottom-6 w-px bg-slate-200 z-0" />

          <div className="flex-grow flex flex-col">
            {dailyItinerary.slice(0, 6).map((day, index) => (
              <div
                key={index}
                className="relative flex items-start"
                style={{ flex: index < dailyItinerary.length - 1 ? 1 : 'none' }}
              >
                {/* 日期標籤 */}
                <div className="w-10 flex-shrink-0 flex flex-col items-center z-10 bg-white pt-1">
                  <span className="text-[7px] text-slate-400 font-bold tracking-widest">DAY</span>
                  <span className="text-base font-bold text-teal-600">{String(index + 1).padStart(2, '0')}</span>
                </div>

                {/* 內容 */}
                <div className="flex-grow pl-3 pb-2 border-b border-dotted border-slate-200">
                  <div className="flex flex-col gap-0.5 mb-1">
                    <span className="text-[8px] font-mono text-slate-400">{formatDate(departureDate, index)}</span>
                    <h4 className="text-sm font-bold text-slate-700 line-clamp-1">
                      {day.title || `第 ${index + 1} 天`}
                    </h4>
                  </div>

                  {/* 標籤 */}
                  {day.activities && day.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {day.activities.slice(0, 3).map((act, i) => (
                        <span key={i} className="text-[7px] px-1 py-0.5 bg-teal-600/10 text-teal-700 rounded">
                          {act.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 描述 */}
                  <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">
                    {day.activities?.map((a) => a.title).join(' → ') || '行程待定'}
                  </p>
                </div>
              </div>
            ))}

            {/* 裝飾尾部（只在行程 3 天或以下時顯示） */}
            {dailyItinerary.length > 0 && dailyItinerary.length <= 3 && (
              <div className="relative flex items-center justify-center flex-1 pt-3 min-h-[60px]">
                <div className="flex items-center justify-center px-4 py-2 bg-slate-50/80 border border-slate-100 rounded">
                  <p
                    className="text-[11px] font-medium text-slate-300 tracking-[0.15em]"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    旅の思い出は、心の中に
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部裝飾 + 頁碼 */}
        <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#0d9488 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
        <div className="absolute bottom-3 right-5 text-[9px] text-slate-400 font-mono">05</div>
      </div>
    )
  }
)
