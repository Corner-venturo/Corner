/**
 * 機票行程單生成工具
 * 用於將 Trip.com 等訂票憑證轉換為 Corner 風格
 */

'use client'

import React, { useState } from 'react'
import { CornerFlightItinerary } from '@/features/itinerary/components/CornerFlightItinerary'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, FileText } from 'lucide-react'

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
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')

  const getCurrentData = () => {
    switch (currentItinerary) {
      case 1: return SAMPLE_DATA_1
      default: return SAMPLE_DATA_1
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <FileText size={16} />
          開啟機票行程單
        </Button>
      </div>
    )
  }

  return (
    <>
      <style>{PRINT_STYLES}</style>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0 print:max-w-full print:rounded-none print:max-h-none print:overflow-visible print:shadow-none" id="flight-itinerary-printable">
          {/* 控制面板 - 只在螢幕上顯示 */}
          <div className="print:hidden sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
            <DialogHeader className="flex-row items-center gap-2">
              <DialogTitle className="sr-only">機票行程單</DialogTitle>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={currentItinerary === 1 ? 'default' : 'outline'}
                  onClick={() => setCurrentItinerary(1)}
                >
                  LAI TINGCHANG (台北-東京)
                </Button>
              </div>
            </DialogHeader>
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
              <Button size="sm" onClick={handlePrint} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
                <Printer size={16} />
                列印 / 儲存 PDF
              </Button>
            </div>
          </div>

          {/* 行程單內容 */}
          <div className="print:p-0">
            <CornerFlightItinerary data={getCurrentData()} language={language} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
