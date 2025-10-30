'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ParticipantCounts } from '../types'

interface PrintableQuotationProps {
  quote: any
  quoteName: string
  participantCounts: ParticipantCounts
  sellingPrices: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
    room_types?: Record<string, { adult: number; child: number }>
  }
  categories: any[]
  totalCost: number
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
  accommodationSummary?: Array<{
    name: string
    total_cost: number
    averageCost: number
    days: number
    capacity: number
  }>
}

export const PrintableQuotation: React.FC<PrintableQuotationProps> = ({
  quote,
  quoteName,
  participantCounts,
  sellingPrices,
  categories,
  totalCost,
  isOpen,
  onClose,
  onPrint,
  accommodationSummary = [],
}) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isOpen || !isMounted) return null

  // 計算總人數
  const totalParticipants =
    participantCounts.adult +
    participantCounts.child_with_bed +
    participantCounts.child_no_bed +
    participantCounts.single_room +
    participantCounts.infant

  // 計算總收入
  const totalRevenue =
    participantCounts.adult * sellingPrices.adult +
    participantCounts.child_with_bed * sellingPrices.child_with_bed +
    participantCounts.child_no_bed * sellingPrices.child_no_bed +
    participantCounts.single_room * sellingPrices.single_room +
    participantCounts.infant * sellingPrices.infant

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8 print:p-0 print:bg-transparent print:block"
      onClick={onClose}
      id="printable-quotation-overlay"
    >
      <style>
        {`
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #FAF8F5 !important;
            }

            #printable-quotation-overlay {
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              padding: 0 !important;
              display: block !important;
              z-index: 1 !important;
            }

            /* 僅顯示報價單內容 */
            body > *:not(#printable-quotation-overlay) {
              display: none !important;
            }

            #printable-quotation-overlay .print\\:hidden {
              display: none !important;
            }

            #a4-preview {
              transform: none !important;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              background: #FAF8F5 !important;
            }

            @page {
              size: A4;
              margin: 0;
            }
          }
        `}
      </style>

      {/* 控制按鈕 */}
      <div className="fixed top-4 right-4 z-[10000] flex gap-2 print:hidden">
        <button
          onClick={e => {
            e.stopPropagation()
            onPrint()
          }}
          className="px-4 py-2 bg-[#C9A961] hover:bg-[#B8954E] text-white rounded-lg shadow-lg font-medium"
        >
          列印
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-lg font-medium"
        >
          關閉
        </button>
      </div>

      {/* A4 報價單容器 - 縮放以適應螢幕 */}
      <div
        id="a4-preview"
        className="relative bg-[#FAF8F5] print:shadow-none overflow-hidden print:overflow-visible"
        onClick={e => e.stopPropagation()}
        style={{
          width: '210mm',
          height: '297mm',
          transform: 'scale(0.75)',
          transformOrigin: 'center',
        }}
      >
        {/* 主要內容 */}
        <div
          className="bg-white h-full shadow-[0_2px_20px_rgba(0,0,0,0.08)] rounded-2xl print:shadow-none print:rounded-none flex flex-col"
          style={{ margin: '4mm' }}
        >
          <div
            className="p-2 h-full flex flex-col print:!h-full"
            style={{ height: 'calc(297mm - 8mm)' }}
          >
            {/* 頭部區域 */}
            <div className="mb-1">
              <div className="flex items-start justify-between mb-1.5">
                {/* Logo 與品牌 */}
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A961] to-[#B89851] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-[#3D2914] tracking-wide text-base font-semibold">
                        Venturo Travel
                      </h1>
                      <p className="text-[#8B7355] text-[10px]">專業旅遊規劃</p>
                    </div>
                  </div>
                </div>

                {/* 報價單標題 */}
                <div className="text-right">
                  <div className="inline-block bg-[#FAF8F5] rounded-xl px-3 py-1.5 border border-[#C9A961]/20">
                    <p className="text-[#C9A961] text-[9px] mb-0.5 tracking-widest uppercase">
                      Quotation
                    </p>
                    <h2 className="text-[#3D2914] text-sm font-semibold">旅遊報價單</h2>
                  </div>
                </div>
              </div>

              {/* 旅程標題 */}
              <div className="bg-gradient-to-r from-[#FAF8F5] to-transparent rounded-xl p-2 border-l-4 border-[#C9A961]">
                <p className="text-[#8B7355] text-[10px] mb-0.5">旅遊行程</p>
                <h3 className="text-[#3D2914] text-lg font-semibold mb-0.5">
                  {quoteName || '精選旅遊行程'}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-[#8B7355] text-[10px]">報價單編號：{quote?.code || 'A001'}</p>
                  <span className="text-[#8B7355] text-[10px]">•</span>
                  <p className="text-[#8B7355] text-[10px]">總人數：{totalParticipants} 人</p>
                </div>
              </div>
            </div>

            {/* 基本資訊區 */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {/* 客戶資訊 */}
              <div className="bg-[#FAF8F5] rounded-xl p-1.5">
                <h4 className="text-[#3D2914] text-xs font-semibold mb-1 pb-1 border-b border-[#C9A961]/20">
                  客戶資訊
                </h4>
                <div className="space-y-1">
                  <div>
                    <p className="text-[#8B7355] text-[9px] mb-0.5">姓名</p>
                    <p className="text-[#3D2914] text-[10px] font-medium border-b border-dotted border-gray-300 pb-0.5">
                      　
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7355] text-[9px] mb-0.5">聯絡電話</p>
                    <p className="text-[#3D2914] text-[10px] font-medium border-b border-dotted border-gray-300 pb-0.5">
                      　
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7355] text-[9px] mb-0.5">Email</p>
                    <p className="text-[#3D2914] text-[10px] font-medium border-b border-dotted border-gray-300 pb-0.5">
                      　
                    </p>
                  </div>
                </div>
              </div>

              {/* 承辦資訊 */}
              <div className="bg-[#FAF8F5] rounded-xl p-1.5">
                <h4 className="text-[#3D2914] text-xs font-semibold mb-1 pb-1 border-b border-[#C9A961]/20">
                  承辦資訊
                </h4>
                <div className="space-y-1">
                  <div>
                    <p className="text-[#8B7355] text-[9px] mb-0.5">承辦人</p>
                    <p className="text-[#3D2914] text-[10px] font-medium">
                      {quote?.user?.display_name || '待填寫'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7355] text-[9px] mb-0.5">聯絡電話</p>
                    <p className="text-[#3D2914] text-[10px] font-medium">
                      {quote?.user?.phone || '待填寫'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B7355] text-[9px] mb-0.5">Email</p>
                    <p className="text-[#3D2914] text-[10px] font-medium">
                      {quote?.user?.email || 'service@venturo.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 價格區 */}
            <div className="mb-1">
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/10 rounded-xl p-1.5 border border-[#C9A961]/20">
                <h4 className="text-[#3D2914] text-xs font-semibold mb-1">團費報價</h4>

                <div className="grid grid-cols-4 gap-1.5">
                  {/* 基礎身份 - 只顯示有售價的 */}
                  {sellingPrices.adult > 0 && (
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[#8B7355] text-[10px] mb-0.5">成人</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[#3D2914] text-[9px]">NT$</span>
                        <span className="text-[#C9A961] text-lg font-bold">
                          {sellingPrices.adult.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {sellingPrices.child_with_bed > 0 && (
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[#8B7355] text-[10px] mb-0.5">小孩</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[#3D2914] text-[9px]">NT$</span>
                        <span className="text-[#C9A961] text-lg font-bold">
                          {sellingPrices.child_with_bed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {sellingPrices.child_no_bed > 0 && (
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[#8B7355] text-[10px] mb-0.5">不佔床</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[#3D2914] text-[9px]">NT$</span>
                        <span className="text-[#C9A961] text-lg font-bold">
                          {sellingPrices.child_no_bed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {sellingPrices.single_room > 0 && (
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[#8B7355] text-[10px] mb-0.5">單人房</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[#3D2914] text-[9px]">NT$</span>
                        <span className="text-[#C9A961] text-lg font-bold">
                          {sellingPrices.single_room.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {sellingPrices.infant > 0 && (
                    <div className="bg-white rounded-lg p-1.5">
                      <p className="text-[#8B7355] text-[10px] mb-0.5">嬰兒</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[#3D2914] text-[9px]">NT$</span>
                        <span className="text-[#C9A961] text-lg font-bold">
                          {sellingPrices.infant.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 動態房型 - 從第二個房型開始 */}
                  {accommodationSummary.length > 1 &&
                    accommodationSummary.slice(1).map(room => {
                      const roomPrices = sellingPrices.room_types?.[room.name]
                      if (!roomPrices) return null

                      return (
                        <React.Fragment key={room.name}>
                          {roomPrices.adult > 0 && (
                            <div className="bg-white rounded-lg p-1.5">
                              <p className="text-[#8B7355] text-[10px] mb-0.5">{room.name}-成人</p>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[#3D2914] text-[9px]">NT$</span>
                                <span className="text-[#C9A961] text-lg font-bold">
                                  {roomPrices.adult.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                          {roomPrices.child > 0 && (
                            <div className="bg-white rounded-lg p-1.5">
                              <p className="text-[#8B7355] text-[10px] mb-0.5">{room.name}-小孩</p>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[#3D2914] text-[9px]">NT$</span>
                                <span className="text-[#C9A961] text-lg font-bold">
                                  {roomPrices.child.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                </div>

                <div className="pt-1.5 border-t border-[#C9A961]/20">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-2.5 h-2.5 text-[#C9A961]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-[#8B7355] text-[9px]">
                      報價有效至{' '}
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 費用說明 */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {/* 費用包含 */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-5 h-5 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-[#C9A961]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-[#3D2914] text-[10px] font-semibold">費用包含</h4>
                </div>
                <div className="space-y-0.5">
                  {[
                    '行程表所列之交通費用',
                    '行程表所列之住宿費用',
                    '行程表所列之餐食費用',
                    '行程表所列之門票費用',
                    '專業導遊服務',
                    '旅遊責任險 500 萬元',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#C9A961] mt-1"></div>
                      <p className="text-[#3D2914] text-[9px]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 費用不含 */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-5 h-5 rounded-lg bg-[#3D2914]/5 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-[#8B7355]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h4 className="text-[#3D2914] text-[10px] font-semibold">費用不含</h4>
                </div>
                <div className="space-y-0.5">
                  {[
                    '個人消費及自費項目',
                    '旅遊平安保險（建議自行投保）',
                    '行李超重費用',
                    '簽證費用（如需要）',
                    '小費（導遊、司機等）',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#8B7355] mt-1"></div>
                      <p className="text-[#3D2914] text-[9px]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 重要備註 */}
            <div className="bg-[#FAF8F5] rounded-xl p-1.5 border-l-4 border-[#C9A961] mb-1.5">
              <h4 className="text-[#3D2914] text-[10px] font-semibold mb-0.5">重要備註</h4>
              <div className="space-y-0.5">
                <div className="flex items-start gap-1">
                  <span className="text-[#C9A961] text-[9px] font-semibold mt-0.5">01.</span>
                  <p className="text-[#3D2914] text-[9px]">本報價單有效期限為報價日起 30 天內</p>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-[#C9A961] text-[9px] font-semibold mt-0.5">02.</span>
                  <p className="text-[#3D2914] text-[9px]">
                    行程內容可能因天候、交通等因素彈性調整
                  </p>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-[#C9A961] text-[9px] font-semibold mt-0.5">03.</span>
                  <p className="text-[#3D2914] text-[9px]">最終費用以簽約時確認之人數及價格為準</p>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-[#C9A961] text-[9px] font-semibold mt-0.5">04.</span>
                  <p className="text-[#3D2914] text-[9px]">
                    付款方式：訂金 30%，出發前 7 天付清尾款
                  </p>
                </div>
              </div>
            </div>

            {/* 頁尾 */}
            <div className="pt-1 mt-auto border-t border-[#C9A961]/20">
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#B89851] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#3D2914] text-[9px] font-semibold">Venturo Travel</p>
                    <p className="text-[#8B7355] text-[8px]">專業旅遊規劃服務</p>
                  </div>
                </div>

                <div className="text-right text-[8px]">
                  <div className="flex items-center justify-end gap-0.5 text-[#8B7355] mb-0.5">
                    <svg
                      className="w-2 h-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>02-7751-6051</span>
                  </div>
                  <div className="flex items-center justify-end gap-0.5 text-[#8B7355]">
                    <svg
                      className="w-2 h-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>service@venturo.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部裝飾條 */}
          <div className="h-1 bg-gradient-to-r from-[#C9A961] via-[#D4B76E] to-[#C9A961]"></div>
        </div>
      </div>
    </div>,
    document.body
  )
}
