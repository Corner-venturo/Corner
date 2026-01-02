'use client'

import React, { forwardRef } from 'react'
import { MapPin, Phone, Clock, Wifi, Train, Ship } from 'lucide-react'
import type { DailyItineraryDay } from '@/stores/types'

interface AccommodationInfo {
  name: string
  nameEn?: string
  address?: string
  addressEn?: string
  phone?: string
  checkIn?: string
  checkOut?: string
  image?: string
  amenities?: string[]
  access?: string
  accessIcon?: 'train' | 'boat' | 'walk'
}

interface BrochureAccommodationProps {
  accommodations: AccommodationInfo[]
  pageNumber?: number
}

// 從每日行程提取住宿資訊
export function extractAccommodations(dailyItinerary: DailyItineraryDay[]): AccommodationInfo[] {
  const seen = new Set<string>()
  const result: AccommodationInfo[] = []

  for (const day of dailyItinerary) {
    if (day.accommodation && !seen.has(day.accommodation)) {
      seen.add(day.accommodation)
      result.push({
        name: day.accommodation,
        nameEn: day.accommodationUrl ? undefined : day.accommodation,
        image: day.images?.[0] ? (typeof day.images[0] === 'string' ? day.images[0] : day.images[0].url) : undefined,
      })
    }
  }

  return result.slice(0, 3) // 最多顯示 3 間
}

// 顏色輪替
const COLORS = [
  { text: 'text-teal-600', bg: 'bg-teal-600/5', border: 'border-teal-600/20', accent: 'bg-teal-600' },
  { text: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20', accent: 'bg-orange-500' },
  { text: 'text-teal-700', bg: 'bg-teal-700/5', border: 'border-teal-700/20', accent: 'bg-teal-700' },
]

export const BrochureAccommodation = forwardRef<HTMLDivElement, BrochureAccommodationProps>(
  function BrochureAccommodation({ accommodations, pageNumber }, ref) {
    const displayAccommodations = accommodations.slice(0, 3)

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-row"
        style={{ width: '100%', maxWidth: '840px', aspectRatio: '1280 / 1117' }}
      >
        {/* 左側：圖片區 */}
        <div className="w-1/2 h-full bg-slate-50 relative flex flex-col justify-between px-6 py-8 gap-4 overflow-hidden border-r border-slate-200/50">
          {/* 背景紋路 */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

          {displayAccommodations.map((hotel, index) => {
            const color = COLORS[index % COLORS.length]
            const isEven = index % 2 === 1

            return (
              <div
                key={index}
                className={`relative w-full flex-1 flex items-center ${isEven ? 'flex-row-reverse' : ''} group z-10`}
              >
                {/* 圖片 */}
                <div className="w-[82%] h-full relative overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-md">
                  {hotel.image ? (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full ${color.bg} flex items-center justify-center`}>
                      <span className={`text-4xl ${color.text} opacity-30`}>🏨</span>
                    </div>
                  )}
                  <div className={`absolute inset-0 ${color.bg} mix-blend-multiply pointer-events-none`} />
                </div>

                {/* 側邊編號 */}
                <div
                  className={`absolute ${isEven ? 'left-0' : 'right-0'} h-full flex flex-col items-center justify-start pt-3 gap-2 w-[18%]`}
                >
                  <span className={`font-serif text-2xl ${color.text} opacity-60 font-light`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className={`w-px h-8 ${color.bg}`} style={{ backgroundColor: `${color.text.replace('text-', '')}20` }} />
                  <span
                    className="font-serif text-[10px] tracking-[0.15em] text-slate-500 opacity-70"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {hotel.name.slice(0, 6)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 右側：資訊區 */}
        <div className="w-1/2 flex flex-col h-full bg-white relative">
          {/* 背景紋路 */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* 標題 */}
          <div className="absolute top-0 left-0 w-full pt-5 px-8 z-20 flex justify-between items-start pointer-events-none">
            <span className="text-orange-500 font-bold tracking-[0.2em] text-[9px] uppercase flex items-center gap-2">
              <span className="w-2 h-px bg-orange-500" />
              Accommodation Guide
            </span>
            <h1
              className="text-3xl font-bold text-slate-800/5 absolute right-6 top-6 select-none"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              厳選宿泊施設
            </h1>
          </div>

          {/* 飯店列表 */}
          <div className="w-full h-full flex flex-col justify-between px-8 py-12 gap-4 relative z-10">
            {displayAccommodations.map((hotel, index) => {
              const color = COLORS[index % COLORS.length]
              const AccessIcon = hotel.accessIcon === 'boat' ? Ship : Train

              return (
                <div
                  key={index}
                  className={`flex-1 flex flex-col justify-center group relative border-l ${color.border} hover:border-opacity-100 pl-6 transition-colors duration-300`}
                >
                  <div className="flex flex-col gap-3">
                    {/* 標題 */}
                    <div className="flex justify-between items-baseline border-b border-slate-200/40 pb-2">
                      <h2
                        className={`text-lg font-bold text-slate-800 group-hover:${color.text} transition-colors duration-300`}
                        style={{ fontFamily: "'Noto Serif JP', serif" }}
                      >
                        <span className={`text-[9px] font-sans ${color.text} opacity-60 mr-2 tracking-widest font-normal border ${color.border} px-1 py-px rounded-sm`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {hotel.name}
                      </h2>
                      {hotel.nameEn && (
                        <span className="text-[9px] font-serif italic text-slate-500 opacity-60">
                          {hotel.nameEn}
                        </span>
                      )}
                    </div>

                    {/* 資訊網格 */}
                    <div className="grid grid-cols-[20px_1fr] gap-y-1.5 text-[10px] text-slate-500 items-baseline">
                      {hotel.address && (
                        <>
                          <MapPin size={12} className="text-slate-400 mt-0.5" />
                          <p className="leading-relaxed text-slate-700">
                            {hotel.address}
                            {hotel.addressEn && (
                              <span className="block text-[9px] text-slate-400 mt-0.5">
                                {hotel.addressEn}
                              </span>
                            )}
                          </p>
                        </>
                      )}
                      {hotel.phone && (
                        <>
                          <Phone size={12} className="text-slate-400" />
                          <p className="tracking-wider text-slate-700">{hotel.phone}</p>
                        </>
                      )}
                      {(hotel.checkIn || hotel.checkOut) && (
                        <>
                          <Clock size={12} className="text-slate-400" />
                          <p className="text-slate-700">
                            IN {hotel.checkIn || '15:00'}
                            <span className="text-slate-300 mx-1">/</span>
                            OUT {hotel.checkOut || '11:00'}
                          </p>
                        </>
                      )}
                    </div>

                    {/* 標籤 */}
                    <div className="flex items-center gap-2 pt-1">
                      {hotel.amenities?.slice(0, 2).map((amenity, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 ${color.bg} ${color.text} text-[9px] tracking-wider rounded-sm`}
                        >
                          {amenity}
                        </span>
                      ))}
                      {!hotel.amenities?.length && (
                        <span className={`px-1.5 py-0.5 ${color.bg} ${color.text} text-[9px] tracking-wider rounded-sm flex items-center gap-1`}>
                          <Wifi size={10} />
                          Free Wi-Fi
                        </span>
                      )}
                      {hotel.access && (
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <AccessIcon size={10} />
                          <span>{hotel.access}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 頁碼 */}
          <div className="absolute bottom-4 right-6 font-mono text-slate-400/30 text-[9px] tracking-widest z-20">
            PAGE.{String(pageNumber || 20).padStart(2, '0')}
          </div>
        </div>
      </div>
    )
  }
)
