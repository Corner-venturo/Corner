'use client'

import React, { forwardRef } from 'react'
import { MapPin, Phone, Clock, Wifi } from 'lucide-react'

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
  days?: number[]
}

interface BrochureAccommodationRightProps {
  accommodations: AccommodationInfo[]
  pageNumber?: number
}

// 顏色輪替
const COLORS = [
  { text: 'text-teal-600', bg: 'bg-teal-600/5', border: 'border-teal-600/20', accent: 'bg-teal-600' },
  { text: 'text-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20', accent: 'bg-orange-500' },
  { text: 'text-teal-700', bg: 'bg-teal-700/5', border: 'border-teal-700/20', accent: 'bg-teal-700' },
]

export const BrochureAccommodationRight = forwardRef<HTMLDivElement, BrochureAccommodationRightProps>(
  function BrochureAccommodationRight({ accommodations, pageNumber }, ref) {
    const displayAccommodations = accommodations.slice(0, 3)

    return (
      <div
        ref={ref}
        className="bg-white overflow-hidden flex flex-col w-full h-full relative"
      >
        {/* 背景紋路 */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 標題 */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-orange-500 font-bold tracking-[0.2em] text-[9px] uppercase flex items-center gap-2">
                <span className="w-2 h-px bg-orange-500" />
                Accommodation Guide
              </span>
              <h2 className="text-xl font-bold text-slate-800 tracking-widest mt-2" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                住宿資訊
              </h2>
            </div>
            <h1
              className="text-3xl font-bold text-slate-800/5 select-none"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              厳選宿泊
            </h1>
          </div>
        </div>

        {/* 飯店列表 */}
        <div className="flex-1 px-6 pb-6 flex flex-col gap-4 relative z-10">
          {displayAccommodations.map((hotel, index) => {
            const color = COLORS[index % COLORS.length]

            return (
              <div
                key={index}
                className={`flex-1 flex flex-col justify-center group relative border-l-2 ${color.border} hover:border-opacity-100 pl-5 transition-colors duration-300`}
              >
                <div className="flex flex-col gap-2">
                  {/* 標題列 */}
                  <div className="flex justify-between items-baseline border-b border-slate-200/40 pb-2">
                    <h3
                      className={`text-base font-bold text-slate-800 group-hover:${color.text} transition-colors duration-300`}
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      <span className={`text-[9px] font-sans ${color.text} opacity-60 mr-2 tracking-widest font-normal border ${color.border} px-1 py-px rounded-sm`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {hotel.name}
                    </h3>
                    {/* 入住天數 */}
                    {hotel.days && hotel.days.length > 0 && (
                      <span className={`text-[9px] font-mono ${color.text} opacity-70 px-1.5 py-0.5 ${color.bg} rounded`}>
                        {hotel.days.length === 1
                          ? `Day ${hotel.days[0]}`
                          : `Day ${hotel.days[0]}-${hotel.days[hotel.days.length - 1]}`
                        }
                        <span className="text-slate-400 ml-1">({hotel.days.length}晚)</span>
                      </span>
                    )}
                  </div>

                  {/* 資訊網格 */}
                  <div className="grid grid-cols-[18px_1fr] gap-y-1.5 text-[10px] text-slate-500 items-start">
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 頁碼 */}
        <div className="absolute bottom-3 right-5 font-mono text-slate-400/30 text-[9px] tracking-widest">
          {String(pageNumber || 17).padStart(2, '0')}
        </div>
      </div>
    )
  }
)
