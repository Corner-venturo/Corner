/**
 * PrintableQuotation - 團體報價單列印版（簡約版）
 * 與 PrintableQuickQuote 使用相同的設計風格
 */

'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'
import { ParticipantCounts } from '../types'
import { supabase } from '@/lib/supabase/client'

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
  const [logoUrl, setLogoUrl] = useState<string>('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 載入 Logo
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('company_assets')
          .select('file_path')
          .eq('category', 'logos')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          console.error('載入 Logo 失敗:', error)
          return
        }

        if (data?.file_path) {
          const { data: urlData } = supabase.storage
            .from('company-assets')
            .getPublicUrl(data.file_path)

          setLogoUrl(`${urlData.publicUrl}?t=${Date.now()}`)
        }
      } catch (error) {
        console.error('載入 Logo 錯誤:', error)
      }
    }

    if (isOpen) {
      loadLogo()
    }
  }, [isOpen])

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

  // 計算利潤率
  const profitRate = totalCost > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

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
              background: white !important;
            }

            @page {
              size: A4;
              margin: 1cm;
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

            /* 防止表格行被切斷 */
            table tr {
              page-break-inside: avoid;
            }

            /* 使用 table 的 thead/tfoot 來實作固定頁首頁尾 */
            table.print-wrapper {
              width: 100%;
              height: 100vh; /* 佔滿整個視窗高度 */
              border-collapse: collapse;
            }

            table.print-wrapper thead {
              display: table-header-group;
            }

            table.print-wrapper tfoot {
              display: table-footer-group;
            }

            table.print-wrapper tbody {
              display: table-row-group;
            }

            table.print-wrapper tbody > tr {
              height: 100%; /* tbody 的內容區佔滿剩餘空間 */
            }

            table.print-wrapper tbody > tr > td {
              vertical-align: top; /* 內容靠上對齊 */
            }

            /* 防止表格內容被切斷 */
            .avoid-break {
              page-break-inside: avoid;
            }

            /* 頁碼 */
            body {
              counter-reset: page 0;
            }

            .page-number::before {
              counter-increment: page;
              content: counter(page);
            }

            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
      <div
        className="bg-white rounded-lg max-w-[1000px] w-full max-h-[90vh] overflow-y-auto print:max-w-full print:rounded-none print:max-h-none print:overflow-visible"
        onClick={e => e.stopPropagation()}
      >
        {/* 控制按鈕（列印時隱藏） */}
        <div className="flex justify-end gap-2 p-4 print:hidden">
          <Button onClick={onClose} variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            關閉
          </Button>
          <Button onClick={onPrint} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover">
            <Printer className="h-4 w-4" />
            列印
          </Button>
        </div>

        {/* 列印內容 */}
        <div className="bg-white p-8 print:p-4" id="printable-quotation">
          <table className="print-wrapper print:table hidden">
            {/* 頁首（每頁都會顯示） */}
            <thead>
              <tr>
                <td>
                  <div
                    className="relative mb-1 pb-4"
                    style={{ borderBottom: '1px solid #D4AF37', marginTop: '6px' }}
                  >
                    {/* Logo - 左上角 */}
                    {logoUrl ? (
                      <div
                        className="absolute left-0 top-0"
                        style={{ width: '120px', height: '40px' }}
                      >
                        <img
                          src={logoUrl}
                          alt="角落旅行社 Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'left top',
                          }}
                        />
                      </div>
                    ) : (
                      <div className="absolute left-0 top-0 text-xs" style={{ color: '#9CA3AF' }}>
                        角落旅行社
                      </div>
                    )}
                    {/* 標題 */}
                    <div className="relative z-10 text-center py-2">
                      <div
                        className="text-sm tracking-widest mb-1"
                        style={{ color: '#D4AF37', fontWeight: 500 }}
                      >
                        QUOTATION
                      </div>
                      <h1 className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                        旅遊報價單
                      </h1>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>

            {/* 頁尾（每頁都會顯示） */}
            <tfoot>
              <tr>
                <td>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-center py-1">
                      <p className="text-sm text-gray-600 italic">
                        如果可以，讓我們一起探索世界上每個角落
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 px-4">
                      <span>角落旅行社股份有限公司 © {new Date().getFullYear()}</span>
                      <span>
                        第 <span className="page-number"></span> 頁
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>

            {/* 主要內容 */}
            <tbody>
              <tr>
                <td>
                  {/* 旅程資訊區 */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex">
                        <span className="font-semibold w-32">行程名稱：</span>
                        <span className="flex-1 border-b border-gray-300">
                          {quoteName || '精選旅遊行程'}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">報價單編號：</span>
                        <span className="flex-1 border-b border-gray-300">{quote?.code || ''}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">總人數：</span>
                        <span className="flex-1 border-b border-gray-300">
                          {totalParticipants} 人
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32">有效期限：</span>
                        <span className="flex-1 border-b border-gray-300">
                          {quote?.valid_until
                            ? new Date(quote.valid_until).toLocaleDateString('zh-TW')
                            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
                                'zh-TW'
                              )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 團費報價表 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#6B5B4F' }}>
                      團費報價 ▽
                    </h3>
                    <table
                      className="w-full text-sm"
                      style={{
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#FAF7F2' }}>
                          <th
                            className="px-4 py-3 text-center"
                            style={{
                              borderBottom: '1px solid #E5E7EB',
                              color: '#6B5B4F',
                              fontWeight: 600,
                            }}
                          >
                            身份
                          </th>
                          <th
                            className="px-4 py-3 text-center"
                            style={{
                              borderBottom: '1px solid #E5E7EB',
                              borderLeft: '1px solid #E5E7EB',
                              color: '#6B5B4F',
                              fontWeight: 600,
                            }}
                          >
                            單價
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellingPrices.adult > 0 && (
                          <tr>
                            <td
                              className="px-4 py-3 text-center"
                              style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                            >
                              成人
                            </td>
                            <td
                              className="px-4 py-3 text-center text-lg font-semibold"
                              style={{
                                borderBottom: '1px solid #E5E7EB',
                                borderLeft: '1px solid #E5E7EB',
                                color: '#6B5B4F',
                              }}
                            >
                              NT$ {sellingPrices.adult.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {sellingPrices.child_with_bed > 0 && (
                          <tr>
                            <td
                              className="px-4 py-3 text-center"
                              style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                            >
                              小孩佔床
                            </td>
                            <td
                              className="px-4 py-3 text-center text-lg font-semibold"
                              style={{
                                borderBottom: '1px solid #E5E7EB',
                                borderLeft: '1px solid #E5E7EB',
                                color: '#6B5B4F',
                              }}
                            >
                              NT$ {sellingPrices.child_with_bed.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {sellingPrices.child_no_bed > 0 && (
                          <tr>
                            <td
                              className="px-4 py-3 text-center"
                              style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                            >
                              小孩不佔床
                            </td>
                            <td
                              className="px-4 py-3 text-center text-lg font-semibold"
                              style={{
                                borderBottom: '1px solid #E5E7EB',
                                borderLeft: '1px solid #E5E7EB',
                                color: '#6B5B4F',
                              }}
                            >
                              NT$ {sellingPrices.child_no_bed.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {sellingPrices.single_room > 0 && (
                          <tr>
                            <td
                              className="px-4 py-3 text-center"
                              style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                            >
                              單人房差價
                            </td>
                            <td
                              className="px-4 py-3 text-center text-lg font-semibold"
                              style={{
                                borderBottom: '1px solid #E5E7EB',
                                borderLeft: '1px solid #E5E7EB',
                                color: '#6B5B4F',
                              }}
                            >
                              NT$ {sellingPrices.single_room.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {sellingPrices.infant > 0 && (
                          <tr>
                            <td className="px-4 py-3 text-center" style={{ color: '#4B5563' }}>
                              嬰兒
                            </td>
                            <td
                              className="px-4 py-3 text-center text-lg font-semibold"
                              style={{ borderLeft: '1px solid #E5E7EB', color: '#6B5B4F' }}
                            >
                              NT$ {sellingPrices.infant.toLocaleString()}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 費用說明 */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                        費用包含
                      </h4>
                      <ul className="space-y-1 text-sm" style={{ color: '#4B5563' }}>
                        <li>• 行程表所列之交通費用</li>
                        <li>• 行程表所列之住宿費用</li>
                        <li>• 行程表所列之餐食費用</li>
                        <li>• 行程表所列之門票費用</li>
                        <li>• 專業導遊服務</li>
                        <li>• 旅遊責任險 500 萬元</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                        費用不含
                      </h4>
                      <ul className="space-y-1 text-sm" style={{ color: '#4B5563' }}>
                        <li>• 個人護照及簽證費用</li>
                        <li>• 行程外之自費行程</li>
                        <li>• 個人消費及小費</li>
                        <li>• 行李超重費用</li>
                        <li>• 單人房差價</li>
                      </ul>
                    </div>
                  </div>

                  {/* 注意事項 */}
                  <div
                    className="pt-4 text-sm"
                    style={{ borderTop: '1px solid #E5E7EB', color: '#4B5563' }}
                  >
                    <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                      注意事項
                    </h4>
                    <ul className="space-y-1">
                      <li>
                        • 本報價單有效期限至{' '}
                        {quote?.valid_until
                          ? new Date(quote.valid_until).toLocaleDateString('zh-TW')
                          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
                              'zh-TW'
                            )}
                        ，逾期請重新報價。
                      </li>
                      <li>• 最終價格以確認訂單時之匯率及費用為準。</li>
                      <li>• 如遇旺季或特殊節日，價格可能會有調整。</li>
                      <li>• 出發前 30 天內取消，需支付團費 30% 作為取消費。</li>
                      <li>• 出發前 14 天內取消，需支付團費 50% 作為取消費。</li>
                      <li>• 出發前 7 天內取消，需支付團費 100% 作為取消費。</li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 螢幕顯示版本（不使用 table 結構） */}
          <div className="print:hidden">
            {/* Logo 和標題 */}
            <div className="relative mb-6 pb-4" style={{ borderBottom: '2px solid #D4AF37' }}>
              {/* Logo - 左上角 */}
              {logoUrl && (
                <div className="absolute left-0 top-0" style={{ width: '120px', height: '40px' }}>
                  <img
                    src={logoUrl}
                    alt="角落旅行社 Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'left top',
                    }}
                  />
                </div>
              )}
              <div className="relative z-10 text-center py-4">
                <div
                  className="text-sm tracking-widest mb-1"
                  style={{ color: '#D4AF37', fontWeight: 500 }}
                >
                  QUOTATION
                </div>
                <h1 className="text-xl font-bold" style={{ color: '#2D3436' }}>
                  旅遊報價單
                </h1>
              </div>
            </div>

            {/* 旅程資訊 */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex">
                  <span className="font-semibold w-32">行程名稱：</span>
                  <span className="flex-1 border-b border-gray-300">
                    {quoteName || '精選旅遊行程'}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">報價單編號：</span>
                  <span className="flex-1 border-b border-gray-300">{quote?.code || ''}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">總人數：</span>
                  <span className="flex-1 border-b border-gray-300">{totalParticipants} 人</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">有效期限：</span>
                  <span className="flex-1 border-b border-gray-300">
                    {quote?.valid_until
                      ? new Date(quote.valid_until).toLocaleDateString('zh-TW')
                      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
            </div>

            {/* 團費報價表 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#6B5B4F' }}>
                團費報價 ▽
              </h3>
              <table
                className="w-full text-sm"
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#FAF7F2' }}>
                    <th
                      className="px-4 py-3 text-center"
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        color: '#6B5B4F',
                        fontWeight: 600,
                      }}
                    >
                      身份
                    </th>
                    <th
                      className="px-4 py-3 text-center"
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        borderLeft: '1px solid #E5E7EB',
                        color: '#6B5B4F',
                        fontWeight: 600,
                      }}
                    >
                      單價
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sellingPrices.adult > 0 && (
                    <tr>
                      <td
                        className="px-4 py-3 text-center"
                        style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                      >
                        成人
                      </td>
                      <td
                        className="px-4 py-3 text-center text-lg font-semibold"
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          borderLeft: '1px solid #E5E7EB',
                          color: '#6B5B4F',
                        }}
                      >
                        NT$ {sellingPrices.adult.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {sellingPrices.child_with_bed > 0 && (
                    <tr>
                      <td
                        className="px-4 py-3 text-center"
                        style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                      >
                        小孩佔床
                      </td>
                      <td
                        className="px-4 py-3 text-center text-lg font-semibold"
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          borderLeft: '1px solid #E5E7EB',
                          color: '#6B5B4F',
                        }}
                      >
                        NT$ {sellingPrices.child_with_bed.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {sellingPrices.child_no_bed > 0 && (
                    <tr>
                      <td
                        className="px-4 py-3 text-center"
                        style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                      >
                        小孩不佔床
                      </td>
                      <td
                        className="px-4 py-3 text-center text-lg font-semibold"
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          borderLeft: '1px solid #E5E7EB',
                          color: '#6B5B4F',
                        }}
                      >
                        NT$ {sellingPrices.child_no_bed.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {sellingPrices.single_room > 0 && (
                    <tr>
                      <td
                        className="px-4 py-3 text-center"
                        style={{ borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}
                      >
                        單人房差價
                      </td>
                      <td
                        className="px-4 py-3 text-center text-lg font-semibold"
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          borderLeft: '1px solid #E5E7EB',
                          color: '#6B5B4F',
                        }}
                      >
                        NT$ {sellingPrices.single_room.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {sellingPrices.infant > 0 && (
                    <tr>
                      <td className="px-4 py-3 text-center" style={{ color: '#4B5563' }}>
                        嬰兒
                      </td>
                      <td
                        className="px-4 py-3 text-center text-lg font-semibold"
                        style={{ borderLeft: '1px solid #E5E7EB', color: '#6B5B4F' }}
                      >
                        NT$ {sellingPrices.infant.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 費用說明 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                  費用包含
                </h4>
                <ul className="space-y-1 text-sm" style={{ color: '#4B5563' }}>
                  <li>• 行程表所列之交通費用</li>
                  <li>• 行程表所列之住宿費用</li>
                  <li>• 行程表所列之餐食費用</li>
                  <li>• 行程表所列之門票費用</li>
                  <li>• 專業導遊服務</li>
                  <li>• 旅遊責任險 500 萬元</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                  費用不含
                </h4>
                <ul className="space-y-1 text-sm" style={{ color: '#4B5563' }}>
                  <li>• 個人護照及簽證費用</li>
                  <li>• 行程外之自費行程</li>
                  <li>• 個人消費及小費</li>
                  <li>• 行李超重費用</li>
                  <li>• 單人房差價</li>
                </ul>
              </div>
            </div>

            {/* 注意事項 */}
            <div
              className="pt-4 mb-6 text-sm"
              style={{ borderTop: '1px solid #E5E7EB', color: '#4B5563' }}
            >
              <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                注意事項
              </h4>
              <ul className="space-y-1">
                <li>
                  • 本報價單有效期限至{' '}
                  {quote?.valid_until
                    ? new Date(quote.valid_until).toLocaleDateString('zh-TW')
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')}
                  ，逾期請重新報價。
                </li>
                <li>• 最終價格以確認訂單時之匯率及費用為準。</li>
                <li>• 如遇旺季或特殊節日，價格可能會有調整。</li>
                <li>• 出發前 30 天內取消，需支付團費 30% 作為取消費。</li>
                <li>• 出發前 14 天內取消，需支付團費 50% 作為取消費。</li>
                <li>• 出發前 7 天內取消，需支付團費 100% 作為取消費。</li>
              </ul>
            </div>

            {/* 副標題和頁腳 */}
            <div className="text-center mt-8 pt-4">
              <p className="text-base text-gray-600 italic mb-4">
                如果可以，讓我們一起探索世界上每個角落
              </p>
              <p className="text-xs text-gray-500">
                角落旅行社股份有限公司 © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
