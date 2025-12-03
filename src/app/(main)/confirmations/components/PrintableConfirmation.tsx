/**
 * PrintableConfirmation - 確認單列印版（機票/住宿）
 * 參考 PrintableQuotation 的設計風格，支援 A4 列印
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { COMPANY } from '@/lib/constants/company'
import type { Confirmation, FlightData, AccommodationData } from '@/types/confirmation.types'

interface PrintableConfirmationProps {
  confirmation: Confirmation
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
}

export const PrintableConfirmation: React.FC<PrintableConfirmationProps> = ({
  confirmation,
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
        const { data, error } = await supabase
          .from('company_assets')
          .select('file_path')
          .eq('category', 'logos')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          logger.error('載入 Logo 失敗:', error)
          return
        }

        if (data?.file_path) {
          const { data: urlData } = supabase.storage
            .from('company-assets')
            .getPublicUrl(data.file_path)

          setLogoUrl(`${urlData.publicUrl}?t=${Date.now()}`)
        }
      } catch (error) {
        logger.error('載入 Logo 錯誤:', error)
      }
    }

    if (isOpen) {
      loadLogo()
    }
  }, [isOpen])

  if (!isOpen || !isMounted) return null

  const isFlightConfirmation = confirmation.type === 'flight'
  const title = isFlightConfirmation ? '機票確認單' : '住宿確認單'

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8 print:p-0 print:bg-transparent print:block"
      onClick={onClose}
      id="printable-confirmation-overlay"
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
              margin: 8mm;
            }

            #printable-confirmation-overlay {
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              padding: 0 !important;
              display: block !important;
              z-index: 1 !important;
            }

            /* 僅顯示確認單內容 */
            body > *:not(#printable-confirmation-overlay) {
              display: none !important;
            }

            #printable-confirmation-overlay .print\\:hidden {
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

            table.print-wrapper tbody > tr {
              height: 100%;
            }

            table.print-wrapper tbody > tr > td {
              vertical-align: top;
            }

            /* 防止表格內容被切斷 */
            .avoid-break {
              page-break-inside: avoid;
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
        <div className="bg-white p-8 print:p-0" id="printable-confirmation">
          <table className="print-wrapper print:table hidden">
            {/* 頁首（每頁都會顯示） */}
            <thead>
              <tr>
                <td>
                  <div
                    className="relative pb-4 mb-6"
                    style={{ borderBottom: '1px solid #D4AF37' }}
                  >
                    {/* Logo - 左上角 */}
                    {logoUrl ? (
                      <div
                        className="absolute left-0 top-0"
                        style={{ width: '120px', height: '40px' }}
                      >
                        <img
                          src={logoUrl}
                          alt="Company Logo"
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
                        CONFIRMATION
                      </div>
                      <h1 className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                        {title}
                      </h1>
                    </div>

                    {/* 確認單資訊 */}
                    <div className="text-sm text-gray-600 mt-2 flex justify-between">
                      <span>訂位代號: {confirmation.booking_number}</span>
                      {confirmation.confirmation_number && (
                        <span>確認號碼: {confirmation.confirmation_number}</span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </thead>

            {/* 頁尾（每頁都會顯示） */}
            <tfoot>
              <tr>
                <td>
                  <div className="border-t border-gray-200" style={{
                    marginTop: '24px',
                    paddingTop: '16px'
                  }}>
                    <div className="text-center" style={{ marginBottom: '12px' }}>
                      <p className="text-sm italic" style={{ color: '#6B7280', margin: 0 }}>
                        {COMPANY.subtitle}
                      </p>
                    </div>
                    <div className="text-center text-xs" style={{ color: '#9CA3AF' }}>
                      <span>角落旅行社股份有限公司 © {new Date().getFullYear()}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>

            {/* 主要內容 */}
            <tbody>
              <tr>
                <td>
                  {isFlightConfirmation ? (
                    <FlightConfirmationContent data={confirmation.data as FlightData} />
                  ) : (
                    <AccommodationConfirmationContent data={confirmation.data as AccommodationData} />
                  )}

                  {/* 備註 */}
                  {confirmation.notes && (
                    <div className="mt-6 avoid-break">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">備註</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">
                        {confirmation.notes}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 非列印模式的內容 */}
          <div className="print:hidden">
            <div className="relative pb-4 mb-6" style={{ borderBottom: '1px solid #D4AF37' }}>
              {/* Logo - 左上角 */}
              {logoUrl ? (
                <div
                  className="absolute left-0 top-0"
                  style={{ width: '120px', height: '40px' }}
                >
                  <img
                    src={logoUrl}
                    alt="Company Logo"
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
                  CONFIRMATION
                </div>
                <h1 className="text-xl font-bold" style={{ color: '#6B5B4F' }}>
                  {title}
                </h1>
              </div>

              {/* 確認單資訊 */}
              <div className="text-sm text-gray-600 mt-2 flex justify-between">
                <span>訂位代號: {confirmation.booking_number}</span>
                {confirmation.confirmation_number && (
                  <span>確認號碼: {confirmation.confirmation_number}</span>
                )}
              </div>
            </div>

            {isFlightConfirmation ? (
              <FlightConfirmationContent data={confirmation.data as FlightData} />
            ) : (
              <AccommodationConfirmationContent data={confirmation.data as AccommodationData} />
            )}

            {confirmation.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">備註</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">
                  {confirmation.notes}
                </div>
              </div>
            )}

            {/* 頁尾 - 公司資訊 */}
            <div className="border-t border-gray-200" style={{
              marginTop: '24px',
              paddingTop: '16px'
            }}>
              <div className="text-center" style={{ marginBottom: '12px' }}>
                <p className="text-sm italic" style={{ color: '#6B7280', margin: 0 }}>
                  {COMPANY.subtitle}
                </p>
              </div>
              <div className="text-center text-xs" style={{ color: '#9CA3AF' }}>
                <span>角落旅行社股份有限公司 © {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// 機票確認單內容
const FlightConfirmationContent: React.FC<{ data: FlightData }> = ({ data }) => {
  return (
    <div className="space-y-5">
      {/* 免責聲明 */}
      <div className="text-center text-xs italic py-2 bg-amber-50 rounded" style={{ color: '#92400E' }}>
        **** 此文件資訊僅提供參考, 實際資訊以航空公司及相關旅遊供應商為準 ****
      </div>

      {/* 旅客姓名列表 */}
      <div className="text-sm" style={{ color: '#374151' }}>
        {data.passengers?.map((passenger, idx) => (
          <div key={idx} className="mb-1 font-medium">
            旅客姓名: {String(idx + 1).padStart(2, '0')}. {passenger.nameEn}
          </div>
        ))}
      </div>

      {/* 航班資訊表格 */}
      <div className="avoid-break">
        <table className="w-full text-sm" style={{
          borderCollapse: 'collapse',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <thead>
            <tr style={{
              borderTop: '2px dashed #D4AF37',
              borderBottom: '2px dashed #D4AF37',
              backgroundColor: '#FFFBF0'
            }}>
              <th className="py-3 text-center font-semibold" style={{ width: '120px', color: '#6B5B4F' }}>
                日 期
              </th>
              <th className="py-3 text-left font-semibold" style={{ color: '#6B5B4F' }}>
                時 間  航 班
              </th>
              <th className="py-3 text-left font-semibold" colSpan={2} style={{ color: '#6B5B4F' }}>
                其 他 訊 息
              </th>
            </tr>
          </thead>
          <tbody>
            {data.segments?.map((segment, idx) => (
              <React.Fragment key={idx}>
                {/* 航空公司行 */}
                <tr>
                  <td className="py-1.5"></td>
                  <td className="py-1.5 font-semibold" style={{ color: '#374151' }}>
                    {segment.airline}({segment.flightNumber})
                  </td>
                  <td className="py-1.5" style={{ color: '#6B7280' }}>
                    {'duration' in segment ? (segment.duration as string) : ''}
                  </td>
                  <td className="py-1.5" style={{ width: '110px', color: '#6B7280' }}>
                    {'stops' in segment && typeof segment.stops === 'number'
                      ? segment.stops === 0 ? '/直飛' : `/轉機${segment.stops}次`
                      : ''}
                  </td>
                </tr>
                {/* 出發行 */}
                <tr>
                  <td className="py-1.5" style={{ whiteSpace: 'nowrap', color: '#374151', fontWeight: 500 }}>
                    {segment.departureDate}
                  </td>
                  <td className="py-1.5" style={{ color: '#374151' }}>
                    {segment.departureTime} 出發: {segment.departureAirport}
                  </td>
                  <td className="py-1.5" style={{ width: '180px', color: '#6B7280' }}>
                    {segment.departureTerminal ? `航站${segment.departureTerminal} ` : ''}/{'cabin' in segment ? (segment.cabin as string) : '經濟'} /OK
                  </td>
                  <td className="py-1.5" style={{ width: '110px', color: '#6B7280' }}>
                  </td>
                </tr>
                {/* 抵達行 */}
                <tr style={{
                  borderBottom: idx === (data.segments?.length || 0) - 1 ? 'none' : '1px dashed #D4AF37'
                }}>
                  <td className="py-1.5 pb-3"></td>
                  <td className="py-1.5 pb-3" style={{ color: '#374151' }}>
                    {segment.arrivalTime} 抵達: {segment.arrivalAirport}
                  </td>
                  <td className="py-1.5 pb-3" style={{ color: '#6B7280' }}>
                    {segment.arrivalTerminal ? `航站${segment.arrivalTerminal} ` : ''}/餐點
                  </td>
                  <td className="py-1.5 pb-3" style={{ color: '#6B7280' }}>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 機票號碼 */}
      <div className="text-sm space-y-1.5 bg-gray-50 p-4 rounded-lg border border-gray-200">
        {data.passengers?.map((passenger, idx) => (
          passenger.ticketNumber && (
            <div key={idx} style={{ color: '#374151' }}>
              <span className="font-semibold">機票號碼:</span> {passenger.ticketNumber} - {passenger.nameEn}
            </div>
          )
        ))}
      </div>

      {/* 航空公司確認電話 */}
      {'airlineContacts' in data && Array.isArray(data.airlineContacts) && data.airlineContacts.length > 0 && (
        <div className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="font-semibold mb-2" style={{ color: '#1E40AF' }}>
            航空公司確認電話:
          </div>
          <div className="space-y-1" style={{ color: '#374151' }}>
            {(data.airlineContacts as string[]).map((contact: string, idx: number) => (
              <div key={idx} className="pl-4">
                {contact}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 重要資訊 */}
      {data.importantNotes && data.importantNotes.length > 0 && (
        <div className="avoid-break">
          <div className="text-sm space-y-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
            <div className="font-semibold mb-1" style={{ color: '#92400E' }}>
              ⚠️ 重要資訊
            </div>
            {data.importantNotes.map((note, idx) => (
              <div key={idx} className="flex gap-2" style={{ color: '#78350F' }}>
                <span>•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 住宿確認單內容
const AccommodationConfirmationContent: React.FC<{ data: AccommodationData }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* 飯店資訊 */}
      <div className="avoid-break">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">飯店資訊</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-sm">
          <div className="font-medium text-gray-800 text-base">{data.hotelName}</div>
          <div className="text-gray-700">{data.hotelAddress}</div>
          {data.hotelPhone && data.hotelPhone.length > 0 && (
            <div className="text-gray-700">電話: {data.hotelPhone.join(' / ')}</div>
          )}
        </div>
      </div>

      {/* 入住資訊 */}
      <div className="avoid-break">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">入住資訊</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="text-gray-600 mb-1">入住</div>
            <div className="font-medium text-gray-800">
              {data.checkInDate} {data.checkInTime}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="text-gray-600 mb-1">退房</div>
            <div className="font-medium text-gray-800">
              {data.checkOutDate} {data.checkOutTime}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="text-gray-600 mb-1">房間數量</div>
            <div className="font-medium text-gray-800">{data.roomCount} 間</div>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="text-gray-600 mb-1">住宿天數</div>
            <div className="font-medium text-gray-800">{data.nightCount} 晚</div>
          </div>
        </div>
      </div>

      {/* 房型資訊 */}
      <div className="avoid-break">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">房型資訊</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-sm">
          <div>
            <span className="text-gray-600">房型：</span>
            <span className="font-medium text-gray-800">{data.roomType}</span>
          </div>
          <div>
            <span className="text-gray-600">旅客姓名：</span>
            <span className="font-medium text-gray-800">{data.guestName}</span>
          </div>
          <div>
            <span className="text-gray-600">入住人數：</span>
            <span className="font-medium text-gray-800">{data.guestCapacity}</span>
          </div>
        </div>
      </div>

      {/* 餐點資訊 */}
      {data.meals && data.meals.length > 0 && (
        <div className="avoid-break">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">餐點資訊</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300">
                <th className="py-2 px-3 text-left font-medium text-gray-700">日期</th>
                <th className="py-2 px-3 text-left font-medium text-gray-700">餐點內容</th>
              </tr>
            </thead>
            <tbody>
              {data.meals.map((meal, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 px-3">{meal.date}</td>
                  <td className="py-2 px-3">{meal.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 重要資訊 */}
      {data.importantNotes && (
        <div className="avoid-break">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">重要資訊</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 p-4 rounded border border-yellow-200">
            {data.importantNotes}
          </div>
        </div>
      )}
    </div>
  )
}
