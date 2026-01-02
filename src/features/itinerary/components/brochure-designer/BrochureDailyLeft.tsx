'use client'

import React, { forwardRef } from 'react'
import type { DailyItineraryDay } from '@/stores/types'

// 日文數字對應
const KANJI_NUMBERS = ['壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾']

// 活動顏色輪替
const ACTIVITY_COLORS = [
  { border: 'border-teal-600', text: 'text-teal-600' },
  { border: 'border-orange-500', text: 'text-orange-500' },
  { border: 'border-slate-600', text: 'text-slate-600' },
  { border: 'border-teal-700', text: 'text-teal-700' },
]

interface BrochureDailyLeftProps {
  dayIndex: number // 0-based
  day: DailyItineraryDay
  departureDate?: string
  tripName?: string
  pageNumber?: number
}

const formatDate = (dateStr: string, dayIndex: number) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + dayIndex)
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayNum = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${dayNum} / ${weekdays[date.getDay()]}`
  } catch {
    return ''
  }
}

export const BrochureDailyLeft = forwardRef<HTMLDivElement, BrochureDailyLeftProps>(
  function BrochureDailyLeft({ dayIndex, day, departureDate, tripName, pageNumber }, ref) {
    const dayNumber = dayIndex + 1
    const kanjiNumber = KANJI_NUMBERS[dayIndex] || String(dayNumber)
    const activities = day.activities || []

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '420px', aspectRatio: '1 / 1.414' }}
      >
        {/* 上方標題區 - 45% */}
        <div className="h-[45%] bg-slate-50 relative overflow-hidden flex flex-col p-6 justify-between border-b border-slate-200">
          {/* 背景裝飾 */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-teal-600/10 blur-3xl" />

          {/* 頂部資訊 */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-orange-500 font-bold tracking-[0.2em] text-[10px] uppercase mb-1">
                {tripName || 'Kyoto Exploration'}
              </span>
              <span className="text-slate-500 text-[9px] tracking-widest font-mono border-l-2 border-orange-500 pl-2">
                {formatDate(departureDate || '', dayIndex)}
              </span>
            </div>
            {/* 日文數字裝飾 */}
            <div
              className="font-serif text-teal-600/15 text-4xl font-bold select-none"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              {kanjiNumber}
            </div>
          </div>

          {/* Day 數字 + 標題 */}
          <div className="relative z-10 mt-auto">
            <h1
              className="text-[72px] leading-[0.85] text-teal-600 font-black tracking-tight"
              style={{ fontFamily: "'Zen Old Mincho', serif" }}
            >
              Day<br />{String(dayNumber).padStart(2, '0')}
            </h1>
            <div className="flex flex-col mt-4 pl-2 border-l border-slate-300">
              <span
                className="text-xl text-slate-800 font-bold tracking-wide"
                style={{ fontFamily: "'Noto Serif JP', serif" }}
              >
                {day.title || `第 ${dayNumber} 天`}
              </span>
              {day.highlight && (
                <span className="text-[11px] font-medium tracking-widest text-slate-500 uppercase mt-0.5">
                  {day.highlight}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 下方行程順序 - 55% */}
        <div className="h-[55%] bg-white p-6 overflow-hidden relative">
          {/* 側邊裝飾文字 */}
          <div className="absolute top-4 right-4 text-[9px] text-slate-200 font-mono rotate-90 origin-top-right tracking-widest">
            SEQUENCE
          </div>

          {/* 行程列表 */}
          <div className="flex flex-col h-full justify-center">
            {activities.slice(0, 5).map((activity, index) => {
              const isLast = index === activities.length - 1 || index === 4
              const color = ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]

              return (
                <div key={index} className="flex gap-4 group relative pb-5">
                  {/* 序號圓圈 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full border ${color.border} ${color.text} flex items-center justify-center text-sm bg-white z-10`}
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      {index + 1}
                    </div>
                    {/* 連接線 */}
                    {!isLast && (
                      <div className="h-full w-px bg-slate-200 absolute top-7 left-[13px]" />
                    )}
                  </div>

                  {/* 內容 */}
                  <div className="pt-0.5 flex-1">
                    <h3
                      className="font-bold text-slate-800 text-base leading-tight mb-0.5"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      {activity.title}
                    </h3>
                    {activity.description && (
                      <p className="text-[10px] text-slate-500/80 leading-relaxed line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* 如果超過 5 個活動，顯示 ... */}
            {activities.length > 5 && (
              <div className="text-center text-slate-300 text-xs">
                + {activities.length - 5} more
              </div>
            )}
          </div>

          {/* 頁碼 */}
          <div className="absolute bottom-4 left-5 text-slate-400/50 font-mono text-[9px]">
            P.{String(pageNumber || dayNumber * 2 + 4).padStart(2, '0')}
          </div>
        </div>
      </div>
    )
  }
)
