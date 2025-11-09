/**
 * PrintableQuickQuote - 快速報價單列印版（類似 Excel 範本）
 */

'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'
import { Quote, QuickQuoteItem } from '@/types/quote.types'
import { supabase } from '@/lib/supabase/client'

interface PrintableQuickQuoteProps {
  quote: Quote
  items: QuickQuoteItem[]
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
}

export const PrintableQuickQuote: React.FC<PrintableQuickQuoteProps> = ({
  quote,
  items,
  isOpen,
  onClose,
  onPrint,
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
        // 從 company_assets 資料表取得 Logo
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
          // 取得公開 URL，加上時間戳避免快取
          const { data: urlData } = supabase.storage
            .from('company-assets')
            .getPublicUrl(data.file_path)

          // 加上時間戳避免瀏覽器快取舊圖片
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

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const balanceAmount = totalAmount - (quote.received_amount || 0)

  if (!isOpen || !isMounted) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8 print:p-0 print:bg-transparent print:block"
      onClick={onClose}
      id="printable-quick-quote-overlay"
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

            #printable-quick-quote-overlay {
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
            body > *:not(#printable-quick-quote-overlay) {
              display: none !important;
            }

            #printable-quick-quote-overlay .print\\:hidden {
              display: none !important;
            }

            /* 防止表格行被切斷 */
            table tr {
              page-break-inside: avoid;
            }

            /* 使用 table 的 thead/tfoot 來實作固定頁首頁尾 */
            table.print-wrapper {
              width: 100%;
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
        <div className="bg-white p-8 print:p-4" id="printable-quote">
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
                        報價請款單
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
                  {/* 客戶資訊區 */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-24">團體名稱：</span>
                      <span className="flex-1 border-b border-gray-300">{quote.customer_name}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">團體編號：</span>
                      <span className="flex-1 border-b border-gray-300">
                        {quote.tour_code || ''}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">聯絡電話：</span>
                      <span className="flex-1 border-b border-gray-300">
                        {quote.contact_phone || ''}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">承辦業務：</span>
                      <span className="flex-1 border-b border-gray-300">
                        {quote.handler_name || 'William'}
                      </span>
                    </div>
                    <div className="flex col-span-2">
                      <span className="font-semibold w-24">通訊地址：</span>
                      <span className="flex-1 border-b border-gray-300">
                        {quote.contact_address || ''}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-24">開單日期：</span>
                      <span className="flex-1 border-b border-gray-300">
                        {quote.issue_date || new Date().toISOString().split('T')[0]}
                      </span>
                    </div>
                  </div>

                  {/* 收費明細表標題 */}
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: '#6B5B4F' }}>
                      收費明細表 ▽
                    </h3>
                  </div>

                  {/* 收費明細表 */}
                  <table
                    className="w-full mb-6 text-sm"
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
                          className="px-3 py-2 text-left"
                          style={{
                            width: '35%',
                            borderBottom: '1px solid #E5E7EB',
                            color: '#6B5B4F',
                            fontWeight: 600,
                          }}
                        >
                          摘要
                        </th>
                        <th
                          className="px-3 py-2 text-center"
                          style={{
                            width: '10%',
                            borderBottom: '1px solid #E5E7EB',
                            borderLeft: '1px solid #E5E7EB',
                            color: '#6B5B4F',
                            fontWeight: 600,
                          }}
                        >
                          數量
                        </th>
                        <th
                          className="px-3 py-2 text-center"
                          style={{
                            width: '15%',
                            borderBottom: '1px solid #E5E7EB',
                            borderLeft: '1px solid #E5E7EB',
                            color: '#6B5B4F',
                            fontWeight: 600,
                          }}
                        >
                          單價
                        </th>
                        <th
                          className="px-3 py-2 text-center"
                          style={{
                            width: '15%',
                            borderBottom: '1px solid #E5E7EB',
                            borderLeft: '1px solid #E5E7EB',
                            color: '#6B5B4F',
                            fontWeight: 600,
                          }}
                        >
                          金額
                        </th>
                        <th
                          className="px-3 py-2 text-left"
                          style={{
                            width: '25%',
                            borderBottom: '1px solid #E5E7EB',
                            borderLeft: '1px solid #E5E7EB',
                            color: '#6B5B4F',
                            fontWeight: 600,
                          }}
                        >
                          備註
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 只顯示有資料的項目 */}
                      {items.map((item, index) => (
                        <tr key={item.id} className="h-8">
                          <td
                            className="px-2 py-1"
                            style={{
                              borderBottom:
                                index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                              color: '#4B5563',
                            }}
                          >
                            {item.description || '\u00A0'}
                          </td>
                          <td
                            className="px-2 py-1 text-center"
                            style={{
                              borderBottom:
                                index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                              borderLeft: '1px solid #E5E7EB',
                              color: '#4B5563',
                            }}
                          >
                            {item.quantity !== 0 ? item.quantity : '\u00A0'}
                          </td>
                          <td
                            className="px-2 py-1 text-right"
                            style={{
                              borderBottom:
                                index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                              borderLeft: '1px solid #E5E7EB',
                              color: '#4B5563',
                            }}
                          >
                            {item.unit_price !== 0 ? item.unit_price.toLocaleString() : '\u00A0'}
                          </td>
                          <td
                            className="px-2 py-1 text-right"
                            style={{
                              borderBottom:
                                index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                              borderLeft: '1px solid #E5E7EB',
                              color: '#6B5B4F',
                              fontWeight: 600,
                            }}
                          >
                            {item.amount !== 0 ? item.amount.toLocaleString() : '\u00A0'}
                          </td>
                          <td
                            className="px-2 py-1"
                            style={{
                              borderBottom:
                                index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                              borderLeft: '1px solid #E5E7EB',
                              color: '#4B5563',
                            }}
                          >
                            {item.notes || '\u00A0'}
                          </td>
                        </tr>
                      ))}
                      {/* 如果沒有項目，顯示提示訊息 */}
                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center"
                            style={{ color: '#9CA3AF' }}
                          >
                            尚無收費項目
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* 金額統計區 */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div
                      className="p-3"
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: '#FAF7F2',
                      }}
                    >
                      <div className="text-sm font-semibold mb-1" style={{ color: '#6B5B4F' }}>
                        應收金額
                      </div>
                      <div className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                        NT$ {totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div
                      className="p-3"
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: '#FAF7F2',
                      }}
                    >
                      <div className="text-sm font-semibold mb-1" style={{ color: '#6B5B4F' }}>
                        已收金額
                      </div>
                      <div className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                        NT$ {(quote.received_amount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div
                      className="p-3"
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: '#FAF7F2',
                      }}
                    >
                      <div className="text-sm font-semibold mb-1" style={{ color: '#6B5B4F' }}>
                        應收餘額
                      </div>
                      <div
                        className="text-xl font-bold"
                        style={{ color: balanceAmount > 0 ? '#DC2626' : '#059669' }}
                      >
                        NT$ {balanceAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 付款資訊區 */}
                  <div
                    className="grid grid-cols-2 gap-6 pt-4 text-sm"
                    style={{ borderTop: '1px solid #E5E7EB' }}
                  >
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                        匯款資訊
                      </h4>
                      <div className="space-y-1" style={{ color: '#4B5563' }}>
                        <div>戶名：角落旅行社股份有限公司</div>
                        <div>銀行：國泰世華銀行 (013)</div>
                        <div>分行：大同分行 (0626)</div>
                        <div>帳號：062-03-500821-2</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                        支票資訊
                      </h4>
                      <div className="space-y-1" style={{ color: '#4B5563' }}>
                        <div>抬頭：角落旅行社股份有限公司</div>
                        <div className="font-semibold" style={{ color: '#DC2626' }}>
                          禁止背書轉讓
                        </div>
                        <div className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          （請於出發日前付清餘額）
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 收據資訊 */}
                  <div className="mt-4 pt-4 text-sm" style={{ borderTop: '1px solid #E5E7EB' }}>
                    <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                      收據資訊
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex">
                        <span className="font-semibold w-32" style={{ color: '#4B5563' }}>
                          開立代收轉付抬頭：
                        </span>
                        <span className="flex-1" style={{ borderBottom: '1px solid #E5E7EB' }}>
                          {'\u00A0'}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-32" style={{ color: '#4B5563' }}>
                          開立代收轉付統編：
                        </span>
                        <span className="flex-1" style={{ borderBottom: '1px solid #E5E7EB' }}>
                          {'\u00A0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 螢幕顯示版本（不使用 table 結構） */}
          <div className="print:hidden">
            {/* Logo 和標題 */}
            <div className="relative mb-6 pb-4" style={{ borderBottom: '1px solid #D4AF37' }}>
              {logoUrl ? (
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
              ) : (
                <div className="absolute left-0 top-0 text-xs" style={{ color: '#9CA3AF' }}>
                  角落旅行社
                </div>
              )}
              <div className="relative z-10 text-center py-2">
                <div
                  className="text-sm tracking-widest mb-1"
                  style={{ color: '#D4AF37', fontWeight: 500 }}
                >
                  QUOTATION
                </div>
                <h1 className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                  報價請款單
                </h1>
              </div>
            </div>

            {/* 客戶資訊 */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex">
                <span className="font-semibold w-24">團體名稱：</span>
                <span className="flex-1 border-b border-gray-300">{quote.customer_name}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-24">團體編號：</span>
                <span className="flex-1 border-b border-gray-300">{quote.tour_code || ''}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-24">聯絡電話：</span>
                <span className="flex-1 border-b border-gray-300">{quote.contact_phone || ''}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-24">承辦業務：</span>
                <span className="flex-1 border-b border-gray-300">
                  {quote.handler_name || 'William'}
                </span>
              </div>
              <div className="flex col-span-2">
                <span className="font-semibold w-24">通訊地址：</span>
                <span className="flex-1 border-b border-gray-300">
                  {quote.contact_address || ''}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold w-24">開單日期：</span>
                <span className="flex-1 border-b border-gray-300">
                  {quote.issue_date || new Date().toISOString().split('T')[0]}
                </span>
              </div>
            </div>

            {/* 收費明細表 */}
            <div className="mb-2">
              <h3 className="text-lg font-semibold" style={{ color: '#6B5B4F' }}>
                收費明細表 ▽
              </h3>
            </div>
            <table
              className="w-full mb-6 text-sm"
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
                    className="px-3 py-2 text-left"
                    style={{
                      width: '35%',
                      borderBottom: '1px solid #E5E7EB',
                      color: '#6B5B4F',
                      fontWeight: 600,
                    }}
                  >
                    摘要
                  </th>
                  <th
                    className="px-3 py-2 text-center"
                    style={{
                      width: '10%',
                      borderBottom: '1px solid #E5E7EB',
                      borderLeft: '1px solid #E5E7EB',
                      color: '#6B5B4F',
                      fontWeight: 600,
                    }}
                  >
                    數量
                  </th>
                  <th
                    className="px-3 py-2 text-center"
                    style={{
                      width: '15%',
                      borderBottom: '1px solid #E5E7EB',
                      borderLeft: '1px solid #E5E7EB',
                      color: '#6B5B4F',
                      fontWeight: 600,
                    }}
                  >
                    單價
                  </th>
                  <th
                    className="px-3 py-2 text-center"
                    style={{
                      width: '15%',
                      borderBottom: '1px solid #E5E7EB',
                      borderLeft: '1px solid #E5E7EB',
                      color: '#6B5B4F',
                      fontWeight: 600,
                    }}
                  >
                    金額
                  </th>
                  <th
                    className="px-3 py-2 text-left"
                    style={{
                      width: '25%',
                      borderBottom: '1px solid #E5E7EB',
                      borderLeft: '1px solid #E5E7EB',
                      color: '#6B5B4F',
                      fontWeight: 600,
                    }}
                  >
                    備註
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="h-8">
                    <td
                      className="px-2 py-1"
                      style={{
                        borderBottom: index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                        color: '#4B5563',
                      }}
                    >
                      {item.description || '\u00A0'}
                    </td>
                    <td
                      className="px-2 py-1 text-center"
                      style={{
                        borderBottom: index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                        borderLeft: '1px solid #E5E7EB',
                        color: '#4B5563',
                      }}
                    >
                      {item.quantity !== 0 ? item.quantity : '\u00A0'}
                    </td>
                    <td
                      className="px-2 py-1 text-right"
                      style={{
                        borderBottom: index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                        borderLeft: '1px solid #E5E7EB',
                        color: '#4B5563',
                      }}
                    >
                      {item.unit_price !== 0 ? item.unit_price.toLocaleString() : '\u00A0'}
                    </td>
                    <td
                      className="px-2 py-1 text-right"
                      style={{
                        borderBottom: index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                        borderLeft: '1px solid #E5E7EB',
                        color: '#6B5B4F',
                        fontWeight: 600,
                      }}
                    >
                      {item.amount !== 0 ? item.amount.toLocaleString() : '\u00A0'}
                    </td>
                    <td
                      className="px-2 py-1"
                      style={{
                        borderBottom: index === items.length - 1 ? 'none' : '1px solid #E5E7EB',
                        borderLeft: '1px solid #E5E7EB',
                        color: '#4B5563',
                      }}
                    >
                      {item.notes || '\u00A0'}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center" style={{ color: '#9CA3AF' }}>
                      尚無收費項目
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 金額統計 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div
                className="p-3"
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#FAF7F2',
                }}
              >
                <div className="text-sm font-semibold mb-1" style={{ color: '#6B5B4F' }}>
                  應收金額
                </div>
                <div className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                  NT$ {totalAmount.toLocaleString()}
                </div>
              </div>
              <div
                className="p-3"
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#FAF7F2',
                }}
              >
                <div className="text-sm font-semibold mb-1" style={{ color: '#6B5B4F' }}>
                  已收金額
                </div>
                <div className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                  NT$ {(quote.received_amount || 0).toLocaleString()}
                </div>
              </div>
              <div
                className="p-3"
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#FAF7F2',
                }}
              >
                <div className="text-sm font-semibold mb-1" style={{ color: '#6B5B4F' }}>
                  應收餘額
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: balanceAmount > 0 ? '#DC2626' : '#059669' }}
                >
                  NT$ {balanceAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 付款資訊 */}
            <div
              className="grid grid-cols-2 gap-6 pt-4 text-sm mb-6"
              style={{ borderTop: '1px solid #E5E7EB' }}
            >
              <div>
                <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                  匯款資訊
                </h4>
                <div className="space-y-1" style={{ color: '#4B5563' }}>
                  <div>戶名：角落旅行社股份有限公司</div>
                  <div>銀行：國泰世華銀行 (013)</div>
                  <div>分行：大同分行 (0626)</div>
                  <div>帳號：062-03-500821-2</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                  支票資訊
                </h4>
                <div className="space-y-1" style={{ color: '#4B5563' }}>
                  <div>抬頭：角落旅行社股份有限公司</div>
                  <div className="font-semibold" style={{ color: '#DC2626' }}>
                    禁止背書轉讓
                  </div>
                  <div className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                    （請於出發日前付清餘額）
                  </div>
                </div>
              </div>
            </div>

            {/* 收據資訊 */}
            <div className="pt-4 text-sm mb-6" style={{ borderTop: '1px solid #E5E7EB' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#6B5B4F' }}>
                收據資訊
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex">
                  <span className="font-semibold w-32" style={{ color: '#4B5563' }}>
                    開立代收轉付抬頭：
                  </span>
                  <span className="flex-1" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {'\u00A0'}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32" style={{ color: '#4B5563' }}>
                    開立代收轉付統編：
                  </span>
                  <span className="flex-1" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {'\u00A0'}
                  </span>
                </div>
              </div>
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
