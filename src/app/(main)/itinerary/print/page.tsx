/**
 * 行程表列印頁面（簡易版）
 * 適用於非 TP/TC 的公司，提供簡潔的 A4 列印格式
 */

'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useItineraryStore, useTourStore, useAuthStore } from '@/stores'
import { formatDateTW } from '@/lib/utils/format-date'
import type { Itinerary, Tour } from '@/stores/types'

function ItineraryPrintContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itineraryId = searchParams.get('itinerary_id')

  const { items: itineraries, fetchAll: fetchItineraries } = useItineraryStore()
  const { items: tours, fetchAll: fetchTours } = useTourStore()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchItineraries(), fetchTours()])
      setLoading(false)
    }
    loadData()
  }, [fetchItineraries, fetchTours])

  useEffect(() => {
    if (!loading && itineraryId) {
      const found = itineraries.find(i => i.id === itineraryId)
      setItinerary(found || null)

      if (found?.tour_id) {
        const foundTour = tours.find(t => t.id === found.tour_id)
        setTour((foundTour as Tour) || null)
      }
    }
  }, [loading, itineraryId, itineraries, tours])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-morandi-gold" />
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-morandi-secondary">找不到行程表</p>
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft size={16} />
          返回
        </Button>
      </div>
    )
  }

  const dailyItinerary = itinerary.daily_itinerary || []
  const companyName = user?.workspace_code || '旅行社'

  return (
    <div className="min-h-screen bg-morandi-container">
      {/* 列印控制列（不列印） */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft size={16} />
          返回
        </Button>
        <Button onClick={handlePrint} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
          <Printer size={16} />
          列印
        </Button>
      </div>

      {/* A4 列印內容 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
        <div className="p-8 print:p-6">
          {/* 標題區 */}
          <div className="border-b-2 border-morandi-gold pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-morandi-primary mb-1">
                  {itinerary.title || '行程表'}
                </h1>
                {itinerary.subtitle && (
                  <p className="text-sm text-morandi-secondary">{itinerary.subtitle}</p>
                )}
              </div>
              <div className="text-right text-sm text-morandi-secondary">
                <p className="font-semibold text-morandi-gold">{companyName}</p>
                {itinerary.tour_code && (
                  <p className="font-mono">{itinerary.tour_code}</p>
                )}
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-morandi-secondary">目的地：</span>
                <span className="font-medium">{itinerary.city || itinerary.country || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-morandi-secondary">出發日期：</span>
                <span className="font-medium">{itinerary.departure_date || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-morandi-secondary">行程天數：</span>
                <span className="font-medium">{dailyItinerary.length} 天</span>
              </div>
              {tour && (
                <div className="flex gap-2">
                  <span className="text-morandi-secondary">團號：</span>
                  <span className="font-medium font-mono">{tour.code}</span>
                </div>
              )}
            </div>
          </div>

          {/* 航班資訊（如果有） */}
          {(itinerary.outbound_flight || itinerary.return_flight) && (
            <div className="mb-6 p-4 bg-morandi-container/30 rounded-lg">
              <h3 className="text-sm font-semibold text-morandi-primary mb-2">航班資訊</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {itinerary.outbound_flight && (
                  <div>
                    <span className="text-morandi-secondary">去程：</span>
                    <span className="ml-2">
                      {itinerary.outbound_flight.airline} {itinerary.outbound_flight.flightNumber}
                      {' '}
                      {itinerary.outbound_flight.departureTime} - {itinerary.outbound_flight.arrivalTime}
                    </span>
                  </div>
                )}
                {itinerary.return_flight && (
                  <div>
                    <span className="text-morandi-secondary">回程：</span>
                    <span className="ml-2">
                      {itinerary.return_flight.airline} {itinerary.return_flight.flightNumber}
                      {' '}
                      {itinerary.return_flight.departureTime} - {itinerary.return_flight.arrivalTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 每日行程表格 */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-morandi-gold text-white">
                <th className="border border-morandi-gold/50 px-3 py-2 text-left w-24">日期</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-left">行程內容</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-20">早餐</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-20">午餐</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-center w-20">晚餐</th>
                <th className="border border-morandi-gold/50 px-3 py-2 text-left w-36">住宿</th>
              </tr>
            </thead>
            <tbody>
              {dailyItinerary.map((day, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-morandi-container/20'}>
                  <td className="border border-morandi-container px-3 py-2">
                    <div className="font-semibold text-morandi-gold">{day.dayLabel}</div>
                    <div className="text-xs text-morandi-secondary">{day.date}</div>
                  </td>
                  <td className="border border-morandi-container px-3 py-2">
                    <div className="font-medium">{day.title}</div>
                    {day.highlight && (
                      <div className="text-xs text-morandi-secondary mt-1">{day.highlight}</div>
                    )}
                  </td>
                  <td className="border border-morandi-container px-3 py-2 text-center text-xs">
                    {day.meals?.breakfast || '-'}
                  </td>
                  <td className="border border-morandi-container px-3 py-2 text-center text-xs">
                    {day.meals?.lunch || '-'}
                  </td>
                  <td className="border border-morandi-container px-3 py-2 text-center text-xs">
                    {day.meals?.dinner || '-'}
                  </td>
                  <td className="border border-morandi-container px-3 py-2 text-xs">
                    {day.accommodation || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 頁尾 */}
          <div className="mt-8 pt-4 border-t border-morandi-container text-xs text-morandi-secondary text-center">
            <p>本行程表由 {companyName} 提供 | 列印日期：{formatDateTW(new Date())}</p>
          </div>
        </div>
      </div>

      {/* 列印樣式 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}

export default function ItineraryPrintPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-morandi-gold" />
      </div>
    }>
      <ItineraryPrintContent />
    </Suspense>
  )
}
