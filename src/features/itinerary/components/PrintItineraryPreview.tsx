'use client'

import React from 'react'
import Image from 'next/image'

interface DailyScheduleItem {
  day: string
  route: string
  meals: { breakfast: string; lunch: string; dinner: string }
  accommodation: string
}

interface FlightOption {
  airline: string
  outbound: { code: string; from: string; fromCode: string; time: string; to: string; toCode: string; arrivalTime: string }
  return: { code: string; from: string; fromCode: string; time: string; to: string; toCode: string; arrivalTime: string }
}

interface HighlightSpot {
  name: string
  nameEn: string
  tags: string[]
  description: string
  imageUrl?: string
}

interface SightDetail {
  name: string
  nameEn: string
  description: string
  imageUrl?: string
  note?: string
}

interface PrintItineraryData {
  // 封面
  coverImage: string
  tagline: string
  taglineEn: string
  title: string
  subtitle: string
  price: string
  priceNote: string
  country: string
  city: string

  // 每日行程
  dailySchedule: DailyScheduleItem[]

  // 航班
  flightOptions: FlightOption[]

  // 行程特色
  highlightImages: string[]
  highlightSpots: HighlightSpot[]

  // 景點介紹
  sights: SightDetail[]
}

interface PrintItineraryPreviewProps {
  data: PrintItineraryData
}

export function PrintItineraryPreview({ data }: PrintItineraryPreviewProps) {
  return (
    <div className="print-itinerary bg-white">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .page-break {
            page-break-after: always;
          }

          .avoid-break {
            page-break-inside: avoid;
          }

          .page-number-preview {
            display: none !important;
          }
        }

        @media screen {
          .page-break {
            position: relative;
            border-bottom: 2px dashed #F89520;
            margin-bottom: 10mm;
            padding-bottom: 10mm;
          }

          .page-break::after {
            content: '───────── 分頁線 ─────────';
            position: absolute;
            bottom: -6mm;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0 20px;
            color: #F89520;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
          }
        }

        .print-itinerary {
          width: 210mm;
          font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #414042;
          font-size: 10pt;
          line-height: 1.4;
        }

        .a4-page {
          position: relative;
          min-height: 297mm;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 10mm;
        }
      `}</style>

      {/* 封面頁 */}
      <div className="page-break a4-page relative w-full h-[297mm] flex flex-col">
        {/* 頂部標籤 */}
        <div className="px-4 py-3">
          <div className="text-xs font-bold text-white bg-transparent">角落嚴選行程</div>
        </div>

        {/* 封面圖片 */}
        <div className="relative w-full" style={{ height: '140mm' }}>
          {data.coverImage ? (
            <img
              src={data.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl font-bold mb-2">📍</div>
                <div className="text-sm opacity-80">請選擇國家和城市</div>
              </div>
            </div>
          )}
        </div>

        {/* 標語 */}
        <div className="px-4 pt-2">
          <div className="text-[8pt] font-bold tracking-wider text-gray-600">{data.taglineEn}</div>
        </div>

        {/* 標籤與標題 */}
        <div className="px-4 pt-4">
          <div className="inline-block bg-[#F89520] text-white text-xs font-bold px-2 py-1">
            {data.tagline}
          </div>
          <h1 className="text-[30pt] font-bold leading-tight mt-1">{data.title}</h1>

          {/* 詩意文案 */}
          <div className="mt-5 text-[10pt] font-serif leading-relaxed text-gray-700">
            {data.subtitle.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        {/* 價格 */}
        <div className="px-4 pt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-[9pt] font-bold">參考費用</span>
            <span className="text-[28.5pt] font-black text-gray-800">NT${data.price}</span>
            <span className="text-[22.5pt] font-bold">起</span>
          </div>
          <div className="text-[9pt] font-bold mt-1">{data.priceNote}</div>
        </div>
      </div>

      {/* 行程規劃頁 */}
      <div className="page-break a4-page px-4 py-8">
        {/* 標題 */}
        <div className="text-center mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="text-[15pt] font-bold inline-block relative">
            <span className="relative z-10">行程規劃</span>
          </h2>
          <div className="text-[8pt] font-bold text-gray-500 mt-1 tracking-widest">ITINERARY</div>
        </div>

        {/* 每日行程 */}
        <div className="space-y-0">
          {data.dailySchedule.map((day, index) => (
            <div key={index} className="avoid-break mb-3">
              {/* 日期標籤與路線 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-[40pt] min-h-[50pt] bg-[#F89520] flex items-center justify-center px-1 py-2">
                  <div className="text-white text-[11pt] font-bold text-center leading-tight">{day.day}</div>
                </div>
                <div className="flex-1 py-1">
                  <p className="text-[9pt] leading-relaxed">{day.route}</p>
                </div>
              </div>

              {/* 分隔線 */}
              <div className="ml-[52pt] mt-2 mb-1 border-t border-gray-200"></div>

              {/* 餐食與住宿 */}
              <div className="ml-[52pt] space-y-0.5">
                <p className="text-[8pt]">
                  <span className="font-bold">早餐｜</span>
                  <span>{day.meals.breakfast}</span>
                  <span className="mx-1">・</span>
                  <span className="font-bold">午餐｜</span>
                  <span>{day.meals.lunch}</span>
                  <span className="mx-1">・</span>
                  <span className="font-bold">晚餐｜</span>
                  <span>{day.meals.dinner}</span>
                </p>
                {day.accommodation && (
                  <p className="text-[8pt]">
                    <span className="font-bold">住宿｜</span>
                    <span>{day.accommodation}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 備註 */}
        <div className="mt-4 ml-2 text-[8pt] text-gray-600">
          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
          行程僅供參考，實際行程將視交通狀況調整順序或進行變動
        </div>
      </div>

      {/* 參考航班頁 */}
      <div className="page-break a4-page px-4 py-8">
        {/* 標題 */}
        <div className="text-center mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="text-[15pt] font-bold">參考航班</h2>
          <div className="text-[8pt] font-bold text-gray-500 mt-1 tracking-widest">FLIGHTS</div>
        </div>

        {/* 航班表格 */}
        <div className="space-y-6">
          {data.flightOptions.map((option, idx) => (
            <div key={idx} className="avoid-break">
              {/* 表頭 */}
              <table className="w-full border-collapse text-[8pt]">
                <thead>
                  <tr className="bg-[#F89520] text-white">
                    <th className="border-r border-white py-2 px-3 text-left font-bold">航空公司</th>
                    <th className="border-r border-white py-2 px-3 text-left font-bold">航班代號</th>
                    <th className="border-r border-white py-2 px-3 text-left font-bold">出發地點</th>
                    <th className="border-r border-white py-2 px-3 text-left font-bold">出發時間</th>
                    <th className="border-r border-white py-2 px-3 text-left font-bold">抵達地點</th>
                    <th className="py-2 px-3 text-left font-bold">抵達時間</th>
                  </tr>
                </thead>
              </table>

              {/* 航班資料 */}
              <table className="w-full border-collapse text-[8pt] mt-0">
                <tbody>
                  {/* 去程 */}
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 text-center" style={{ width: '85pt' }}>{option.airline}</td>
                    <td className="py-2 px-3 text-center" style={{ width: '85pt' }}>{option.outbound.code}</td>
                    <td className="py-2 px-3 text-center" style={{ width: '114pt' }}>
                      {option.outbound.from} <span className="text-[7pt] text-gray-500">{option.outbound.fromCode}</span>
                    </td>
                    <td className="py-2 px-3 text-center" style={{ width: '56pt' }}>{option.outbound.time}</td>
                    <td className="py-2 px-3 text-center" style={{ width: '114pt' }}>
                      {option.outbound.to} <span className="text-[7pt] text-gray-500">{option.outbound.toCode}</span>
                    </td>
                    <td className="py-2 px-3 text-center" style={{ width: '56pt' }}>{option.outbound.arrivalTime}</td>
                  </tr>
                  {/* 回程 */}
                  <tr className="border-b-2 border-[#F89520]">
                    <td className="py-2 px-3 text-center">{option.airline}</td>
                    <td className="py-2 px-3 text-center">{option.return.code}</td>
                    <td className="py-2 px-3 text-center">
                      {option.return.from} <span className="text-[7pt] text-gray-500">{option.return.fromCode}</span>
                    </td>
                    <td className="py-2 px-3 text-center">{option.return.time}</td>
                    <td className="py-2 px-3 text-center">
                      {option.return.to} <span className="text-[7pt] text-gray-500">{option.return.toCode}</span>
                    </td>
                    <td className="py-2 px-3 text-center">{option.return.arrivalTime}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* 備註 */}
        <div className="mt-4 ml-2 text-[8pt] text-gray-600">
          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
          航班時間僅供參考，實際時間以航空公司公告為準
        </div>
      </div>

      {/* 行程特色頁 */}
      <div className="page-break a4-page px-4 py-8">
        {/* 標題 */}
        <div className="text-center mb-6 border-t border-b border-gray-300 py-4">
          <h2 className="text-[15pt] font-bold">行程特色</h2>
          <div className="text-[8pt] font-bold text-gray-500 mt-1 tracking-widest">HIGHLIGHTS</div>
        </div>

        {/* 特色圖片 */}
        <div className="flex gap-2 mb-6 justify-center">
          {data.highlightImages.slice(0, 3).map((img, idx) => (
            <div key={idx} className="w-[65mm] h-[65mm] bg-gray-200 flex items-center justify-center rounded overflow-hidden">
              {img ? (
                <img src={img} alt={`Highlight ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-xs">圖片 {idx + 1}</div>
              )}
            </div>
          ))}
        </div>

        {/* 景點列表 */}
        <div className="space-y-3">
          {data.highlightSpots.map((spot, idx) => (
            <div key={idx} className="avoid-break">
              {/* 標籤 */}
              <div className="flex gap-2 mb-1">
                {spot.tags.map((tag, tagIdx) => (
                  <span key={tagIdx} className="inline-block bg-[#F89520] text-white text-[8pt] font-bold px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>

              {/* 景點名稱 */}
              <h3 className="text-[10pt] font-bold ml-10">{spot.name}</h3>
              <p className="text-[8pt] text-gray-500 ml-10 mt-0.5">{spot.nameEn}</p>

              {/* 說明文字 */}
              <p className="text-[9pt] leading-relaxed mt-2 ml-2 text-justify">{spot.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 景點介紹頁 */}
      <div className="a4-page px-4 py-8">
        {/* 標題 */}
        <div className="text-center mb-8 border-t border-b border-gray-300 py-4">
          <h2 className="text-[15pt] font-bold">景點介紹</h2>
          <div className="text-[8pt] font-bold text-gray-500 mt-1 tracking-widest">SIGHTS</div>
        </div>

        {/* 景點詳情 */}
        <div className="space-y-6">
          {data.sights.map((sight, idx) => (
            <div key={idx} className="avoid-break flex gap-4">
              {/* 左側圖片 */}
              <div className="flex-shrink-0 w-[212pt] h-[151pt] bg-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-xs">景點圖片</div>
              </div>

              {/* 右側內容 */}
              <div className="flex-1 pt-0">
                {/* 標籤 */}
                <div className="inline-block bg-[#F89520] text-white text-[8pt] font-bold px-2 py-0.5 mb-2">
                  行程景點
                </div>

                {/* 景點名稱 */}
                <h3 className="text-[10pt] font-bold">
                  {sight.name} <span className="text-[8pt] font-normal text-gray-500">{sight.nameEn}</span>
                </h3>

                {/* 說明文字 */}
                <p className="text-[10pt] leading-relaxed mt-2 text-justify">{sight.description}</p>

                {/* 備註 */}
                {sight.note && (
                  <p className="text-[8pt] text-gray-600 mt-2">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                    {sight.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
