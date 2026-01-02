'use client'

import React, { forwardRef, useMemo } from 'react'
import {
  Hand,
  Calendar,
  Footprints,
  Hotel,
  AlertCircle,
  Phone,
} from 'lucide-react'
import type { BrochureCoverData } from './types'
import type { Itinerary } from '@/stores/types'

// 章節定義
export interface BrochureChapter {
  number: string
  title: string
  titleCn: string
  icon: React.ElementType
  page: number
}

// 預設章節（靜態版本，頁碼會被動態覆蓋）
export const DEFAULT_CHAPTERS: BrochureChapter[] = [
  { number: '01', title: 'Welcome', titleCn: 'はじめに', icon: Hand, page: 3 },
  { number: '02', title: 'Overview', titleCn: '行程總覽', icon: Calendar, page: 4 },
  { number: '03', title: 'Daily Plan', titleCn: '每日行程', icon: Footprints, page: 6 },
  { number: '04', title: 'Stay', titleCn: '住宿資訊', icon: Hotel, page: 12 },
  { number: '05', title: 'Notices', titleCn: '注意事項', icon: AlertCircle, page: 14 },
  { number: '06', title: 'Contact', titleCn: '聯絡我們', icon: Phone, page: 16 },
]

/**
 * 根據行程內容動態計算頁碼
 * 頁面結構：
 * - P1: 封面
 * - P2: 空白頁（封面背面）
 * - P3: 目錄
 * - P4-5: 行程總攬（左右兩頁）
 * - P6+: 每日行程（每天約 2 頁）
 * - 之後: 住宿、注意事項、聯絡
 */
function calculateChapterPages(itinerary?: Itinerary | null): BrochureChapter[] {
  const dailyDays = itinerary?.daily_itinerary?.length || 5
  const pagesPerDay = 2 // 每天行程約佔 2 頁

  // 固定頁碼
  const welcomePage = 3      // 目錄頁（目錄本身就是 Welcome）
  const overviewPage = 4     // 行程總攬開始（P4-5）
  const dailyStartPage = 6   // 每日行程開始

  // 動態計算
  const dailyEndPage = dailyStartPage + (dailyDays * pagesPerDay) - 1
  const stayPage = dailyEndPage + 1
  const noticesPage = stayPage + 2
  const contactPage = noticesPage + 2

  return [
    { number: '01', title: 'Welcome', titleCn: 'はじめに', icon: Hand, page: welcomePage },
    { number: '02', title: 'Overview', titleCn: '行程總覽', icon: Calendar, page: overviewPage },
    { number: '03', title: 'Daily Plan', titleCn: '每日行程', icon: Footprints, page: dailyStartPage },
    { number: '04', title: 'Stay', titleCn: '住宿資訊', icon: Hotel, page: stayPage },
    { number: '05', title: 'Notices', titleCn: '注意事項', icon: AlertCircle, page: noticesPage },
    { number: '06', title: 'Contact', titleCn: '聯絡我們', icon: Phone, page: contactPage },
  ]
}

interface BrochureTableOfContentsProps {
  data: BrochureCoverData
  chapters?: BrochureChapter[]
  tripTitle?: string
  itinerary?: Itinerary | null
}

export const BrochureTableOfContents = forwardRef<HTMLDivElement, BrochureTableOfContentsProps>(
  function BrochureTableOfContents({ data, chapters, tripTitle, itinerary }, ref) {
    const displayTitle = tripTitle || `${data.country} ${data.city} Trip`

    // 根據行程內容動態計算頁碼
    const dynamicChapters = useMemo(() => {
      if (chapters) return chapters
      return calculateChapterPages(itinerary)
    }, [chapters, itinerary])

    return (
      <div
        ref={ref}
        className="relative bg-white overflow-hidden flex flex-col"
        style={{
          width: '100%',
          maxWidth: '420px',
          aspectRatio: '1 / 1.414',
        }}
      >
        {/* 背景點點圖案 */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* 頂部裝飾條 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400/80 z-10" />
        <div className="absolute top-0 right-6 w-12 h-16 bg-cyan-400/10 rounded-b-full z-0" />

        {/* 主要內容區 */}
        <div className="relative z-10 flex flex-col flex-grow p-6 sm:p-8">
          {/* Header */}
          <header className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-cyan-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Guidebook
                </span>
                <span className="text-slate-400 text-[10px] font-medium tracking-widest">
                  VOL. 01
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                CONTENTS
              </h1>
              <p className="text-cyan-500 font-medium text-[10px] sm:text-xs tracking-widest uppercase mt-0.5">
                {displayTitle}
              </p>
            </div>

            {/* 日文裝飾 */}
            <div className="hidden sm:flex h-16 items-center justify-center">
              <h2
                className="text-xl font-bold text-slate-200 select-none tracking-widest leading-none"
                style={{ writingMode: 'vertical-rl' }}
              >
                目 録
              </h2>
            </div>
          </header>

          {/* 章節網格 */}
          <div className="grid grid-cols-2 gap-3 flex-grow">
            {dynamicChapters.map((chapter) => {
              const IconComponent = chapter.icon
              return (
                <div
                  key={chapter.number}
                  className="relative flex flex-col justify-between p-3 sm:p-4 bg-white border border-slate-100 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xl sm:text-2xl font-black text-slate-100">
                      {chapter.number}
                    </span>
                    <div className="p-1.5 bg-slate-50 rounded-full text-slate-500">
                      <IconComponent size={16} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-bold text-slate-800">{chapter.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wider">
                      {chapter.titleCn}
                    </p>
                    <div className="w-full border-t border-dashed border-slate-200 mt-2 pt-1.5 flex justify-end">
                      <span className="text-[10px] font-bold text-slate-400">
                        P. {String(chapter.page).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <footer className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-[8px] font-bold text-slate-400">
                  {data.airportCode || '---'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {data.city}, {data.country}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">
                Bon Voyage
              </p>
              <p className="text-[8px] text-slate-400 font-medium mt-0.5">Page 02</p>
            </div>
          </footer>
        </div>

        {/* 底部裝飾 */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-cyan-400/5 to-transparent rounded-tl-full pointer-events-none z-0" />
      </div>
    )
  }
)
