'use client'

import React, { useMemo, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, X } from 'lucide-react'
import { A5HandbookPrint } from './A5HandbookPrint'
import type { Itinerary } from '@/stores/types'

interface A5HandbookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itinerary: Itinerary | null
}

export function A5HandbookDialog({ open, onOpenChange, itinerary }: A5HandbookDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // 安全取得字串值
  const safeString = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return ''
  }

  // 轉換行程表資料為 A5 手冊格式
  const handbookData = useMemo(() => {
    if (!itinerary) return null

    return {
      title: safeString(itinerary.title) || '行程表',
      subtitle: safeString(itinerary.subtitle),
      tagline: safeString(itinerary.tagline) || 'Corner Travel',
      coverImage: safeString(itinerary.cover_image),
      tourCode: safeString(itinerary.tour_code),
      departureDate: safeString(itinerary.departure_date),
      outboundFlight: itinerary.outbound_flight ? {
        airline: safeString(itinerary.outbound_flight.airline),
        flightNumber: safeString(itinerary.outbound_flight.flightNumber),
        departureAirport: safeString(itinerary.outbound_flight.departureAirport) || 'TPE',
        departureTime: safeString(itinerary.outbound_flight.departureTime),
        arrivalAirport: safeString(itinerary.outbound_flight.arrivalAirport),
        arrivalTime: safeString(itinerary.outbound_flight.arrivalTime),
        departureDate: safeString(itinerary.outbound_flight.departureDate),
      } : undefined,
      returnFlight: itinerary.return_flight ? {
        airline: safeString(itinerary.return_flight.airline),
        flightNumber: safeString(itinerary.return_flight.flightNumber),
        departureAirport: safeString(itinerary.return_flight.departureAirport),
        departureTime: safeString(itinerary.return_flight.departureTime),
        arrivalAirport: safeString(itinerary.return_flight.arrivalAirport) || 'TPE',
        arrivalTime: safeString(itinerary.return_flight.arrivalTime),
        departureDate: safeString(itinerary.return_flight.departureDate),
      } : undefined,
      dailyItinerary: (itinerary.daily_itinerary || []).map((day, index) => ({
        day: index + 1,
        title: safeString(day.title) || `第 ${index + 1} 天`,
        activities: Array.isArray(day.activities) ? day.activities.map(act => ({
          time: safeString(act?.icon), // 使用 icon 作為時間/標識
          title: safeString(act?.title),
          description: safeString(act?.description),
        })) : [],
        meals: {
          breakfast: safeString(day.meals?.breakfast),
          lunch: safeString(day.meals?.lunch),
          dinner: safeString(day.meals?.dinner),
        },
        accommodation: safeString(day.accommodation),
      })),
      companyName: 'Corner Travel',
      companyPhone: '',
      leaderName: safeString(itinerary.leader?.name),
      leaderPhone: safeString(itinerary.leader?.domesticPhone),
    }
  }, [itinerary])

  // 列印功能
  const handlePrint = () => {
    if (!printRef.current) return

    // 建立列印專用視窗
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // 取得列印內容的 HTML
    const printContent = printRef.current.innerHTML

    // 取得樣式
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n')
        } catch {
          return ''
        }
      })
      .join('\n')

    // 寫入列印視窗
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${itinerary?.title || '行程表'} - A5 手冊</title>
          <style>
            ${styles}
            @page {
              size: A5 portrait;
              margin: 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // 等待樣式載入後列印
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  if (!handbookData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[95vh] overflow-hidden p-0 [&>button:last-child]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-morandi-gold" />
              A5 手冊預覽
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} className="mr-1" />
              關閉
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Printer size={16} className="mr-1" />
              列印 A5 手冊
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-6 bg-muted">
          <div className="flex justify-center">
            <div ref={printRef} className="bg-white shadow-lg">
              <A5HandbookPrint data={handbookData} />
            </div>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="px-6 py-3 border-t bg-morandi-container/20 text-sm text-morandi-secondary">
          <p>💡 提示：列印時請選擇 A5 紙張大小，並勾選「背景圖形」選項以獲得最佳效果</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
