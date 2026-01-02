'use client'

import React, { forwardRef } from 'react'
import { MapPin, Camera, Utensils, Building } from 'lucide-react'
import type { DailyItineraryDay, DailyActivity } from '@/stores/types'

// 活動顏色輪替
const ACTIVITY_COLORS = [
  { bg: 'bg-teal-600/10', border: 'border-teal-600/50', text: 'text-teal-600', accent: 'bg-teal-600' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-500', accent: 'bg-orange-500' },
  { bg: 'bg-slate-600/10', border: 'border-slate-600/50', text: 'text-slate-600', accent: 'bg-slate-600' },
  { bg: 'bg-teal-700/10', border: 'border-teal-700/50', text: 'text-teal-700', accent: 'bg-teal-700' },
]

// 根據圖標 emoji 選擇對應的 Lucide 圖標
const getActivityIcon = (icon?: string) => {
  if (!icon) return MapPin
  // 簡單的 emoji 對應
  if (icon.includes('🍽') || icon.includes('🍜') || icon.includes('🍣') || icon.includes('🍱')) return Utensils
  if (icon.includes('📸') || icon.includes('🎥')) return Camera
  if (icon.includes('🏨') || icon.includes('🛏')) return Building
  return MapPin
}

interface BrochureDailyRightProps {
  dayIndex: number
  day: DailyItineraryDay
  pageNumber?: number
}

// 單一景點版型（1 個活動）
function SingleAttractionLayout({ activity, index }: { activity: DailyActivity; index: number }) {
  const color = ACTIVITY_COLORS[0]
  const Icon = getActivityIcon(activity.icon)

  return (
    <div className="h-full w-full flex flex-col p-6 relative">
      {/* 背景圖片區域 */}
      <div className="absolute inset-0 bg-slate-100">
        {activity.image ? (
          <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={80} className="text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* 內容卡片 */}
      <div className="relative mt-auto">
        <div className="bg-white/90 backdrop-blur-md p-6 shadow-lg border border-white/50 relative overflow-hidden">
          {/* 裝飾圖標 */}
          <div className="absolute -top-4 -right-4 opacity-5">
            <Icon size={120} className="text-teal-600" />
          </div>

          <div className="relative z-10">
            {/* 標題區 */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-[9px] tracking-[0.2em] font-mono text-slate-500 uppercase">
                    Highlight Spot
                  </span>
                </div>
                <h2
                  className="text-3xl font-bold text-slate-800 tracking-tight leading-none"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  {activity.title}
                </h2>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-3xl font-serif font-thin text-teal-600/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5">STOP NO.</span>
              </div>
            </div>

            {/* 圖標裝飾 */}
            {activity.icon && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg">{activity.icon}</span>
                <span className="h-px w-6 bg-slate-300" />
              </div>
            )}

            {/* 描述 */}
            <p
              className="text-slate-700/80 text-sm leading-loose text-justify tracking-wide mb-6 border-l-2 border-teal-600/30 pl-4"
              style={{ fontFamily: "'Zen Old Mincho', serif" }}
            >
              {activity.description || '詳細說明待補充...'}
            </p>

            {/* 資訊列 */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Activity</span>
                  <span className="text-xs font-medium text-slate-700">{activity.icon || '🏛️'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-teal-600">
                <MapPin size={12} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Map View</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 頁面標記 */}
      <div className="absolute bottom-4 right-6 text-white/80 font-mono text-[9px] tracking-widest drop-shadow-md">
        MUST VISIT
      </div>
    </div>
  )
}

// 雙景點版型（2 個活動）
function DualAttractionLayout({ activities }: { activities: DailyActivity[] }) {
  return (
    <div className="h-full w-full flex flex-col p-5 gap-4 overflow-hidden">
      {/* 標題 */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold tracking-widest text-slate-800" style={{ fontFamily: "'Noto Serif JP', serif" }}>
          景點詳情
          <span className="text-sm font-normal text-slate-500 ml-2 opacity-70">Attraction Details</span>
        </h2>
      </div>

      {/* 兩個景點卡片 */}
      <div className="flex-grow flex flex-col gap-4 overflow-hidden">
        {activities.slice(0, 2).map((activity, index) => {
          const color = ACTIVITY_COLORS[index]
          const Icon = getActivityIcon(activity.icon)

          return (
            <div key={index} className="flex-1 flex flex-col bg-white border border-slate-200 shadow-sm overflow-hidden">
              {/* 圖片區 */}
              <div className="h-28 bg-slate-100 relative overflow-hidden">
                {activity.image ? (
                  <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${color.bg} flex items-center justify-center`}>
                    <Icon size={32} className={color.text} style={{ opacity: 0.4 }} />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border border-slate-100 shadow-sm">
                  {index === 0 ? 'Must Visit' : 'Recommended'}
                </div>
              </div>

              {/* 內容區 */}
              <div className="p-4 relative flex-1">
                <div className={`absolute -top-4 right-4 w-8 h-8 ${color.accent} text-white rounded-full flex items-center justify-center shadow-md text-sm font-bold`}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-0.5" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                      {activity.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      {activity.icon || 'Attraction'}
                    </p>
                  </div>
                </div>

                <div className={`h-px w-8 ${color.accent} mb-2`} />

                <p className="text-[11px] text-slate-600 leading-5 text-justify line-clamp-3">
                  {activity.description || '詳細說明待補充...'}
                </p>

                <div className="flex gap-3 mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[9px] text-slate-500">
                    <MapPin size={10} className={color.text} />
                    <span>景點</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 四宮格版型（3-4 個活動）
function QuadAttractionLayout({ activities }: { activities: DailyActivity[] }) {
  return (
    <div className="h-full w-full flex flex-col p-4 relative">
      {/* 背景紋路 */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c2.667 0 5 1.333 7 4 2-2.667 4.333-4 7-4s5 1.333 7 4c2-2.667 4.333-4 7-4v-1c-2.667 0-5 1.333-7 4-2-2.667-4.333-4-7-4S9.333 10.333 7 13c-2-2.667-4.333-4-7-4V8z' fill='%23e5e0d8' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 2x2 網格 */}
      <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full w-full z-10">
        {activities.slice(0, 4).map((activity, index) => {
          const color = ACTIVITY_COLORS[index]
          const Icon = getActivityIcon(activity.icon)
          const isFood = activity.icon?.includes('🍽') || activity.icon?.includes('🍜') || activity.icon?.includes('🍣')

          return (
            <div
              key={index}
              className={`bg-white p-2.5 shadow-sm border border-slate-200 flex flex-col hover:${color.border} transition-colors`}
            >
              {/* 圖片區 */}
              <div className="relative h-[55%] w-full bg-slate-100 overflow-hidden mb-2">
                {activity.image ? (
                  <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${color.bg} flex items-center justify-center`}>
                    <Icon size={28} className={color.text} style={{ opacity: 0.4 }} />
                  </div>
                )}
                <div className={`absolute top-1.5 left-1.5 w-6 h-6 bg-white/90 backdrop-blur flex items-center justify-center font-bold ${color.text} shadow-sm text-xs`}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                {isFood && (
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-slate-700 text-white text-[8px] font-bold tracking-widest uppercase">
                    Gourmet
                  </div>
                )}
              </div>

              {/* 內容區 */}
              <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                    {activity.title}
                  </h3>
                  <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">
                    {activity.icon || ''}
                  </span>
                </div>
                <div className={`w-6 h-0.5 ${color.accent} mb-1.5`} />
                <p className="text-[9px] text-slate-500 leading-4 text-justify line-clamp-3 flex-grow">
                  {activity.description || '詳細說明待補充...'}
                </p>
                <div className={`mt-auto pt-1.5 flex items-center gap-1 text-[8px] ${color.text} font-medium`}>
                  <MapPin size={10} />
                  <span>景點</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const BrochureDailyRight = forwardRef<HTMLDivElement, BrochureDailyRightProps>(
  function BrochureDailyRight({ dayIndex, day, pageNumber }, ref) {
    const activities = day.activities || []
    const activityCount = activities.length

    return (
      <div
        ref={ref}
        className="bg-slate-50 overflow-hidden relative"
        style={{ width: '100%', maxWidth: '420px', aspectRatio: '1 / 1.414' }}
      >
        {/* 根據活動數量選擇版型 */}
        {activityCount === 1 && <SingleAttractionLayout activity={activities[0]} index={0} />}
        {activityCount === 2 && <DualAttractionLayout activities={activities} />}
        {activityCount >= 3 && <QuadAttractionLayout activities={activities} />}
        {activityCount === 0 && (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-slate-300 text-sm">尚無景點資料</p>
          </div>
        )}

        {/* 頁碼 */}
        <div className="absolute bottom-4 right-5 text-slate-400/50 font-mono text-[9px]">
          {String(dayIndex + 1).padStart(2, '0')}-{String(pageNumber || (dayIndex + 1) * 2 + 5).padStart(2, '0')} / DETAIL
        </div>
      </div>
    )
  }
)
