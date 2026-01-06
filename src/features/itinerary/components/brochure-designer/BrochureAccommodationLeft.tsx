'use client'

import React, { forwardRef } from 'react'
import type { DailyItineraryDay } from '@/stores/types'

export interface AccommodationInfo {
  name: string
  image?: string
  days?: number[]
}

interface BrochureAccommodationLeftProps {
  accommodations: AccommodationInfo[]
  pageNumber?: number
}

// 顏色輪替
const COLORS = [
  { text: 'text-teal-600', bg: 'bg-teal-600/5', border: 'border-teal-600/20', accent: 'bg-teal-600' },
  { text: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20', accent: 'bg-orange-500' },
  { text: 'text-teal-700', bg: 'bg-teal-700/5', border: 'border-teal-700/20', accent: 'bg-teal-700' },
]

// 從每日行程提取住宿資訊（按飯店分組，記錄住宿天數）
export function extractAccommodations(dailyItinerary: DailyItineraryDay[]): AccommodationInfo[] {
  const hotelMap = new Map<string, AccommodationInfo>()

  dailyItinerary.forEach((day, index) => {
    if (!day.accommodation) return

    const existing = hotelMap.get(day.accommodation)
    if (existing) {
      existing.days?.push(index + 1)
    } else {
      const image = day.images?.[0]
        ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url)
        : undefined

      hotelMap.set(day.accommodation, {
        name: day.accommodation,
        image,
        days: [index + 1],
      })
    }
  })

  return Array.from(hotelMap.values()).slice(0, 3)
}

export const BrochureAccommodationLeft = forwardRef<HTMLDivElement, BrochureAccommodationLeftProps>(
  function BrochureAccommodationLeft({ accommodations, pageNumber }, ref) {
    const displayAccommodations = accommodations.slice(0, 3)

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-col w-full h-full relative"
      >
        {/* 背景紋路 */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* 標題區 */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-px bg-orange-500" />
            <span className="text-orange-500 font-bold tracking-[0.2em] text-[9px] uppercase">
              Accommodation
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-slate-800 tracking-widest"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            宿泊施設
          </h1>
          <p className="text-[10px] text-slate-500 mt-1">嚴選住宿介紹</p>
        </div>

        {/* 圖片區 */}
        <div className="flex-1 px-6 pb-6 flex flex-col gap-4 relative z-10">
          {displayAccommodations.map((hotel, index) => {
            const color = COLORS[index % COLORS.length]

            return (
              <div
                key={index}
                className="flex-1 relative overflow-hidden rounded-lg shadow-sm group"
              >
                {/* 圖片 */}
                {hotel.image ? (
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className={`absolute inset-0 ${color.bg} flex items-center justify-center`}>
                    <span className={`text-5xl ${color.text} opacity-30`}>🏨</span>
                  </div>
                )}

                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* 編號 + 名稱 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className={`text-xs font-mono opacity-80 ${color.text.replace('text-', 'text-')}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-lg font-bold mt-0.5" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                        {hotel.name}
                      </h3>
                    </div>
                    {/* 入住天數 */}
                    {hotel.days && hotel.days.length > 0 && (
                      <span className="text-[10px] font-mono bg-white/20 backdrop-blur px-2 py-1 rounded">
                        Day {hotel.days.length === 1
                          ? hotel.days[0]
                          : `${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 頁碼 */}
        <div className="absolute bottom-3 left-5 text-[9px] text-slate-400 font-mono">
          {String(pageNumber || 16).padStart(2, '0')}
        </div>
      </div>
    )
  }
)
