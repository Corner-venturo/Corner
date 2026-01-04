'use client'

import React, { forwardRef } from 'react'
import { MapPin } from 'lucide-react'
import type { DailyItineraryDay } from '@/stores/types'

interface BrochureDailyRightProps {
  dayIndex: number
  day: DailyItineraryDay
  pageNumber?: number
}

// 日式圖案 SVG
const JAPANESE_PATTERNS = {
  torii: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M3 6h18v2H3V6zm2 2v14h2V8H5zm10 0v14h2V8h-2zM2 4h20v2H2V4z" />
    </svg>
  ),
  sakura: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M12 2C9.5 5 8 8 8 12c0 2.5 1.5 4.5 4 4.5s4-2 4-4.5c0-4-1.5-7-4-10zm-5 8c-2 0-4 1.5-4 4s2 4 4 4c1 0 2-.5 2.5-1C8.5 16 8 14 8 12c0-1-.5-2-1-2zm10 0c-.5 0-1 1-1 2 0 2-.5 4-1.5 5 .5.5 1.5 1 2.5 1 2 0 4-1.5 4-4s-2-4-4-4z" />
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M2 12c2-2 4-3 6-3s4 1 6 3 4 3 6 3v2c-2 0-4-1-6-3s-4-3-6-3-4 1-6 3v-2zm0 4c2-2 4-3 6-3s4 1 6 3 4 3 6 3v2c-2 0-4-1-6-3s-4-3-6-3-4 1-6 3v-2z" />
    </svg>
  ),
  fan: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M12 22c-5.5 0-10-4.5-10-10h2c0 4.4 3.6 8 8 8s8-3.6 8-8h2c0 5.5-4.5 10-10 10zM12 2v10l7-7c-1.5-2-4-3-7-3z" />
    </svg>
  ),
}

const PATTERN_KEYS = Object.keys(JAPANESE_PATTERNS) as (keyof typeof JAPANESE_PATTERNS)[]

export const BrochureDailyRight = forwardRef<HTMLDivElement, BrochureDailyRightProps>(
  function BrochureDailyRight({ dayIndex, day, pageNumber }, ref) {
    const activities = day.activities || []

    // 取得活動的圖片
    const getActivityImage = (activity: typeof activities[0], index: number) => {
      // 優先使用活動自己的圖片
      if (activity.image) return activity.image
      // 其次使用當天的圖片
      if (day.images && day.images[index]) {
        const img = day.images[index]
        return typeof img === 'string' ? img : img.url
      }
      return null
    }

    // 根據活動數量決定版面
    const activityCount = activities.length

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden relative w-full h-full flex flex-col p-6"
      >
        {/* 背景網格 */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23e5e0d8' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        {/* 標題 */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3 relative z-10">
          <h2 className="text-lg font-bold tracking-widest text-slate-800" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            景點介紹
            <span className="text-[11px] font-normal text-slate-400 ml-2 opacity-70">Highlights</span>
          </h2>
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-slate-400 rounded-full" />
            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50" />
            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-20" />
          </div>
        </div>

        {/* 景點列表 */}
        <div className="flex-grow flex flex-col gap-3 relative z-10 overflow-y-auto">
          {activityCount <= 2 ? (
            // 2個以下：大圖模式
            activities.slice(0, 2).map((activity, index) => {
              const image = getActivityImage(activity, index)
              const pattern = JAPANESE_PATTERNS[PATTERN_KEYS[index % PATTERN_KEYS.length]]
              const colors = ['text-teal-600', 'text-orange-500']

              return (
                <div key={index} className="flex-1 flex flex-col rounded-lg overflow-hidden border border-slate-100">
                  {/* 圖片區域 */}
                  {image ? (
                    <div className="h-32 relative overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      <MapPin size={24} className="text-slate-300" />
                    </div>
                  )}

                  {/* 文字區域 */}
                  <div className="p-3 bg-white flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={colors[index % colors.length]}>{pattern}</span>
                      <h3
                        className="font-bold text-slate-800 text-sm"
                        style={{ fontFamily: "'Noto Serif JP', serif" }}
                      >
                        {activity.title}
                      </h3>
                    </div>
                    {activity.description && (
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-3">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          ) : activityCount <= 4 ? (
            // 3-4個：2x2 網格
            <div className="grid grid-cols-2 gap-2 flex-1">
              {activities.slice(0, 4).map((activity, index) => {
                const image = getActivityImage(activity, index)
                const pattern = JAPANESE_PATTERNS[PATTERN_KEYS[index % PATTERN_KEYS.length]]
                const colors = ['text-teal-600', 'text-orange-500', 'text-slate-600', 'text-teal-700']

                return (
                  <div key={index} className="flex flex-col rounded-lg overflow-hidden border border-slate-100">
                    {/* 圖片 */}
                    {image ? (
                      <div className="h-20 relative overflow-hidden bg-slate-100">
                        <img
                          src={image}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                        <MapPin size={16} className="text-slate-300" />
                      </div>
                    )}

                    {/* 文字 */}
                    <div className="p-2 bg-white flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={colors[index % colors.length]}>{pattern}</span>
                        <h3 className="font-bold text-slate-800 text-[11px] line-clamp-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                          {activity.title}
                        </h3>
                      </div>
                      {activity.description && (
                        <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // 5個以上：緊湊列表
            <>
              {activities.slice(0, 5).map((activity, index) => {
                const image = getActivityImage(activity, index)
                const pattern = JAPANESE_PATTERNS[PATTERN_KEYS[index % PATTERN_KEYS.length]]
                const colors = ['text-teal-600', 'text-orange-500', 'text-slate-600', 'text-teal-700', 'text-orange-600']

                return (
                  <div key={index} className="flex gap-3 p-2 rounded-lg border border-slate-100 bg-white">
                    {/* 小圖 */}
                    {image ? (
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-slate-100">
                        <img
                          src={image}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0">
                        <MapPin size={14} className="text-slate-300" />
                      </div>
                    )}

                    {/* 文字 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={colors[index % colors.length]}>{pattern}</span>
                        <h3 className="font-bold text-slate-800 text-[11px] line-clamp-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                          {activity.title}
                        </h3>
                      </div>
                      {activity.description && (
                        <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* 底部裝飾 */}
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 relative z-10">
          <p className="text-[9px] text-slate-400 text-center">
            行程內容可能依當地情況調整，敬請見諒
          </p>
        </div>

        {/* 頁碼 */}
        <div className="absolute bottom-4 right-5 text-slate-400/50 font-mono text-[9px]">
          {String(dayIndex + 1).padStart(2, '0')}-{String(pageNumber || (dayIndex + 1) * 2 + 5).padStart(2, '0')} / SPOTS
        </div>
      </div>
    )
  }
)
