/**
 * 機票行程單生成工具
 * 用於將 Trip.com 等訂票憑證轉換為 Corner 風格
 */

'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { CornerFlightItinerary } from '@/features/itinerary/components/CornerFlightItinerary'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'

// 預設資料（從 PDF 提取）
const SAMPLE_DATA_1 = {
  order_number: '1658108572922800',
  passenger_name: 'LAI TINGCHANG',
  outbound_flight: {
    departure_airport: '台灣桃園國際機場',
    departure_terminal: 'T2',
    departure_datetime: '2025年11月23日 08:50',
    arrival_airport: '成田國際機場',
    arrival_terminal: 'T1',
    arrival_datetime: '2025年11月23日 12:55',
    airline: '長榮航空',
    flight_number: 'BR198',
    cabin_class: '經濟艙',
    booking_reference: 'D6GSOT',
    eticket_number: '695-5529257547',
  },
  return_flight: {
    departure_airport: '成田國際機場',
    departure_terminal: 'T1',
    departure_datetime: '2025年11月25日 22:05',
    arrival_airport: '台灣桃園國際機場',
    arrival_terminal: 'T1',
    arrival_datetime: '2025年11月26日 01:25',
    airline: '日本樂桃航空',
    flight_number: 'MM627',
    cabin_class: '經濟艙',
    booking_reference: 'NEU9X2',
  },
  outbound_baggage: {
    personal_item: '每人1件',
    carry_on: '每人1件，每件7公斤',
    checked: '每人1件，每件23公斤',
  },
  return_baggage: {
    personal_item: '每人1件',
    carry_on: '每人1件',
    checked: '每人1件，每件20公斤',
  },
}

const PRINT_STYLES = `
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    @page {
      size: A4;
      margin: 10mm;
    }

    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* 隱藏所有非列印內容 */
    body > *:not(#flight-itinerary-printable) {
      display: none !important;
    }

    #flight-itinerary-printable {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      background: transparent !important;
      padding: 0 !important;
      display: block !important;
      box-shadow: none !important;
    }

    #flight-itinerary-printable > div {
      box-shadow: none !important;
      border-radius: 0 !important;
      max-width: 100% !important;
      background: transparent !important;
      padding: 0 !important;
    }

    .print\\:hidden {
      display: none !important;
    }
  }
`

export default function FlightItineraryPage() {
  const [currentItinerary, setCurrentItinerary] = useState(1)
  const [isOpen, setIsOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const getCurrentData = () => {
    switch (currentItinerary) {
      case 1: return SAMPLE_DATA_1
      default: return SAMPLE_DATA_1
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Button onClick={() => setIsOpen(true)}>開啟機票行程單</Button>
      </div>
    )
  }

  if (!mounted) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8 print:p-0 print:bg-transparent print:block"
      onClick={handleClose}
      id="flight-itinerary-printable"
    >
      <style>{PRINT_STYLES}</style>

      <div
        className="bg-white rounded-lg max-w-[900px] w-full max-h-[90vh] overflow-y-auto print:max-w-full print:rounded-none print:max-h-none print:overflow-visible print:shadow-none"
        onClick={e => e.stopPropagation()}
      >
        {/* 控制面板 - 只在螢幕上顯示 */}
        <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-lg">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={currentItinerary === 1 ? 'default' : 'outline'}
              onClick={() => setCurrentItinerary(1)}
            >
              LAI TINGCHANG (台北-東京)
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 mr-4">
              <Button
                size="sm"
                variant={language === 'zh' ? 'default' : 'outline'}
                onClick={() => setLanguage('zh')}
              >
                中文
              </Button>
              <Button
                size="sm"
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>
            <Button size="sm" onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600">
              <Printer size={16} className="mr-2" />
              列印 / 儲存 PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* 行程單內容 */}
        <div className="print:p-0">
          <CornerFlightItinerary data={getCurrentData()} language={language} />
        </div>
      </div>
    </div>,
    document.body
  )
}
