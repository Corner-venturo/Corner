'use client'

import React, { forwardRef, useState, useCallback } from 'react'
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
  coverImage?: string // 當天封面圖
  onCoverImageChange?: (url: string) => void
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
  function BrochureDailyLeft({ dayIndex, day, departureDate, tripName, pageNumber, coverImage }, ref) {
    const dayNumber = dayIndex + 1
    const kanjiNumber = KANJI_NUMBERS[dayIndex] || String(dayNumber)
    const activities = day.activities || []

    // 本地編輯狀態
    const [localTitle, setLocalTitle] = useState<string | null>(null)
    const displayTitle = localTitle ?? day.title ?? `第 ${dayNumber} 天`

    // 判斷是否使用圖片模式（活動少於 2 個時顯示封面圖）
    const useImageMode = activities.length < 2
    // 使用該天的第一張圖片作為封面
    const dayImage = coverImage || (day.images?.[0] ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url) : undefined)

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-col w-full h-full"
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
                {tripName || 'Japan Travel'}
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
              {/* 可編輯標題 - 限制單行 */}
              <span
                className="text-lg text-slate-800 font-bold tracking-wide line-clamp-1 outline-none hover:bg-white/50 px-1 -mx-1 rounded cursor-text"
                style={{ fontFamily: "'Noto Serif JP', serif" }}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setLocalTitle(e.currentTarget.textContent || '')}
              >
                {displayTitle}
              </span>
              {day.highlight && (
                <span className="text-[11px] font-medium tracking-widest text-slate-500 uppercase mt-0.5">
                  {day.highlight}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 下方區域 - 55% */}
        <div className="h-[55%] relative overflow-hidden">
          {/* 圖片模式：活動少時顯示封面圖 */}
          {useImageMode && dayImage ? (
            <>
              {/* 背景圖片 */}
              <img
                src={dayImage}
                alt={`Day ${dayNumber}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 紋路遮罩 */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              {/* 漸層遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/20" />
              {/* 底部文字 */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white/90 text-sm font-medium drop-shadow-md" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                  {activities[0]?.title || '移動日'}
                </p>
              </div>
            </>
          ) : useImageMode ? (
            /* 無圖片的空白模式 */
            <div className="h-full bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-300 text-sm">移動日</p>
                <p className="text-slate-400/50 text-[10px] mt-1">Travel Day</p>
              </div>
            </div>
          ) : (
            /* 時間軸模式 */
            <div className="h-full bg-white p-5 overflow-hidden">
              {/* 側邊裝飾文字 */}
              <div className="absolute top-4 right-4 text-[9px] text-slate-200 font-mono rotate-90 origin-top-right tracking-widest">
                TIMELINE
              </div>

              {/* 時間軸列表 */}
              <div className="flex flex-col h-full overflow-y-auto">
                {activities.slice(0, 5).map((activity, index) => {
                  const isLast = index === activities.length - 1 || index === 4
                  const dotColors = ['bg-teal-600', 'bg-orange-500', 'bg-teal-700', 'bg-slate-600']
                  const dotColor = dotColors[index % dotColors.length]

                  return (
                    <div key={index} className="flex gap-3 group">
                      {/* 圓點 + 連接線 */}
                      <div className="w-6 shrink-0 flex flex-col items-center pt-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white shadow-sm`} />
                        {!isLast && (
                          <div className="h-full w-px bg-slate-200 mt-1.5" />
                        )}
                      </div>

                      {/* 內容 */}
                      <div className="flex-grow pb-4 border-b border-dashed border-slate-200 last:border-0">
                        <h3
                          className="font-bold text-slate-800 text-sm mb-1"
                          style={{ fontFamily: "'Noto Serif JP', serif" }}
                        >
                          {activity.title}
                        </h3>
                        {activity.description && (
                          <div className="bg-slate-50/80 p-2 rounded text-[9px] text-slate-500 leading-relaxed border border-slate-100 line-clamp-2">
                            {activity.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* 如果超過 5 個活動，顯示 ... */}
                {activities.length > 5 && (
                  <div className="text-center text-slate-300 text-[10px] pt-2">
                    + {activities.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 頁碼 */}
          <div className={`absolute bottom-4 left-5 font-mono text-[9px] ${useImageMode && dayImage ? 'text-white/70' : 'text-slate-400/50'}`}>
            P.{String(pageNumber || dayNumber * 2 + 4).padStart(2, '0')}
          </div>
        </div>
      </div>
    )
  }
)
