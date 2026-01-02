'use client'

import React, { forwardRef } from 'react'
import { Plane } from 'lucide-react'
import type { BrochureCoverData } from './types'

interface BrochureCoverPreviewProps {
  data: BrochureCoverData
}

export const BrochureCoverPreview = forwardRef<HTMLDivElement, BrochureCoverPreviewProps>(
  function BrochureCoverPreview({ data }, ref) {
    const {
      clientName,
      country,
      city,
      travelDates,
      coverImage,
      coverImagePosition,
      companyName,
      emergencyContact,
      emergencyEmail,
    } = data

    // 計算圖片背景位置
    const imageStyle: React.CSSProperties = coverImage
      ? {
          backgroundImage: `url(${coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: coverImagePosition
            ? `${coverImagePosition.x}% ${coverImagePosition.y}%`
            : 'center',
        }
      : {}

    return (
      <div
        ref={ref}
        className="relative bg-white shadow-2xl overflow-hidden flex flex-col"
        style={{
          // A5 比例: 148mm x 210mm = 1:1.414
          width: '100%',
          maxWidth: '420px',
          aspectRatio: '1 / 1.414',
        }}
      >
        {/* 背景圖片 */}
        <div className="absolute inset-0 w-full h-full" style={imageStyle}>
          {!coverImage && (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-slate-500 text-sm">請選擇封面圖片</span>
            </div>
          )}
        </div>

        {/* 漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />

        {/* 內容層 */}
        <div className="relative z-10 flex flex-col h-full text-white p-6 sm:p-8">
          {/* 頂部：客戶名稱 */}
          <div className="flex-none pt-2 sm:pt-4">
            {clientName && (
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase opacity-90 border-l-2 border-amber-500 pl-2 sm:pl-3">
                {clientName}
              </p>
            )}
          </div>

          {/* 中央：國家 + 城市 */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 sm:gap-2">
            {country && (
              <h3 className="text-base sm:text-xl font-light tracking-[0.4em] uppercase mb-1">
                {country}
              </h3>
            )}
            <h1
              className="text-4xl sm:text-6xl font-extrabold leading-[0.9] tracking-tight drop-shadow-2xl"
              style={{
                background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.85))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {city || 'CITY'}
            </h1>

            {/* 旅遊日期 */}
            {travelDates && (
              <div className="mt-4 sm:mt-6 inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20">
                <Plane size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium tracking-wide">{travelDates}</span>
              </div>
            )}
          </div>

          {/* 底部：公司資訊 */}
          <div className="flex-none pt-4 sm:pt-6 pb-2">
            {/* 分隔線 */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mb-4 sm:mb-6" />

            {/* 公司資訊 */}
            <div className="flex justify-between items-end opacity-90">
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider text-gray-300">
                  Organized by
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-amber-500 flex items-center justify-center font-bold text-[10px] sm:text-xs text-white">
                    C
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-wide">{companyName}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[10px] text-gray-300 mb-0.5">Emergency Contact</p>
                <p className="text-xs sm:text-sm font-semibold">{emergencyContact}</p>
                <p className="text-[9px] sm:text-xs text-gray-300">{emergencyEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
