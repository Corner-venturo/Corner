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
        className="relative bg-white shadow-lg overflow-hidden flex flex-col w-full h-full"
      >
        {/* 背景圖片 */}
        <div
          data-element="image"
          data-name="封面背景圖"
          data-src={coverImage}
          className="absolute inset-0 w-full h-full"
          style={imageStyle}
        >
          {!coverImage && (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-slate-500 text-sm">請選擇封面圖片</span>
            </div>
          )}
        </div>

        {/* 漸層遮罩 */}
        <div
          data-element="shape"
          data-name="漸層遮罩"
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"
        />

        {/* 內容層 */}
        <div className="relative z-10 flex flex-col h-full text-white p-5">
          {/* 頂部：客戶名稱 */}
          <div className="flex-none pt-2">
            {clientName && (
              <p
                data-element="text"
                data-name="客戶名稱"
                className="text-[9px] font-bold tracking-[0.15em] uppercase opacity-90 border-l-2 border-amber-500 pl-2"
              >
                {clientName}
              </p>
            )}
          </div>

          {/* 中央：國家 + 城市 */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
            {country && (
              <h3
                data-element="text"
                data-name="國家"
                className="text-sm font-light tracking-[0.4em] uppercase mb-1"
              >
                {country}
              </h3>
            )}
            <h1
              data-element="text"
              data-name="城市"
              className="text-3xl font-extrabold leading-[0.9] tracking-tight drop-shadow-lg"
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
              <div
                data-element="shape"
                data-name="日期背景"
                className="mt-3 inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20"
              >
                <Plane size={12} />
                <span
                  data-element="text"
                  data-name="旅遊日期"
                  className="text-[10px] font-medium tracking-wide"
                >
                  {travelDates}
                </span>
              </div>
            )}
          </div>

          {/* 底部：公司資訊 */}
          <div className="flex-none pt-3 pb-1">
            {/* 分隔線 */}
            <div
              data-element="shape"
              data-name="分隔線"
              className="w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mb-3"
            />

            {/* 公司資訊 */}
            <div className="flex justify-between items-end opacity-90">
              <div className="flex items-center">
                <img
                  data-element="image"
                  data-name="公司Logo"
                  src="/corner-logo.png"
                  alt="Corner Travel"
                  className="h-4 w-auto object-contain"
                />
              </div>
              <div className="text-right">
                <p
                  data-element="text"
                  data-name="聯絡標籤"
                  className="text-[7px] text-morandi-secondary mb-0.5"
                >
                  Emergency Contact
                </p>
                <p
                  data-element="text"
                  data-name="緊急電話"
                  className="text-[10px] font-semibold"
                >
                  {emergencyContact}
                </p>
                <p
                  data-element="text"
                  data-name="緊急信箱"
                  className="text-[8px] text-morandi-secondary"
                >
                  {emergencyEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
