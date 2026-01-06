/**
 * BrochurePreviewDialog - 手冊預覽懸浮視窗
 */

'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Loader2, X } from 'lucide-react'
import { useItineraryStore, useAuthStore } from '@/stores'
import { formatDateTW } from '@/lib/utils/format-date'
import type { Itinerary } from '@/stores/types'

interface BrochurePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  itineraryId: string | null
}

export function BrochurePreviewDialog({
  isOpen,
  onClose,
  itineraryId,
}: BrochurePreviewDialogProps) {
  const { items: itineraries, fetchAll } = useItineraryStore()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchAll().then(() => setLoading(false))
    }
  }, [isOpen, fetchAll])

  useEffect(() => {
    if (!loading && itineraryId) {
      const found = itineraries.find(i => i.id === itineraryId)
      setItinerary(found || null)
    }
  }, [loading, itineraryId, itineraries])

  const handlePrint = () => {
    // 開新視窗列印
    const printWindow = window.open('', '_blank')
    if (!printWindow || !itinerary) return

    const dailyItinerary = itinerary.daily_itinerary || []
    const companyName = user?.workspace_code || '旅行社'

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${itinerary.title || '行程表'}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #c9aa7c; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #3a3633; margin-bottom: 4px; }
          .subtitle { font-size: 14px; color: #8b8680; }
          .company { text-align: right; color: #c9aa7c; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; font-size: 14px; }
          .info-label { color: #8b8680; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
          th { background: #c9aa7c; color: white; padding: 8px; text-align: left; border: 1px solid #c9aa7c; }
          td { padding: 8px; border: 1px solid #e8e5e0; }
          tr:nth-child(even) { background: #f6f4f1; }
          .day-label { font-weight: 600; color: #c9aa7c; }
          .day-date { font-size: 11px; color: #8b8680; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e5e0; text-align: center; font-size: 12px; color: #8b8680; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div class="title">${itinerary.title || '行程表'}</div>
              ${itinerary.subtitle ? `<div class="subtitle">${itinerary.subtitle}</div>` : ''}
            </div>
            <div class="company">${companyName}</div>
          </div>
          <div class="info-grid">
            <div><span class="info-label">目的地：</span>${itinerary.city || itinerary.country || '-'}</div>
            <div><span class="info-label">出發日期：</span>${itinerary.departure_date || '-'}</div>
            <div><span class="info-label">行程天數：</span>${dailyItinerary.length} 天</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">日期</th>
              <th>行程內容</th>
              <th style="width: 70px; text-align: center;">早餐</th>
              <th style="width: 70px; text-align: center;">午餐</th>
              <th style="width: 70px; text-align: center;">晚餐</th>
              <th style="width: 120px;">住宿</th>
            </tr>
          </thead>
          <tbody>
            ${dailyItinerary.map((day, index) => `
              <tr>
                <td>
                  <div class="day-label">${day.dayLabel || `Day ${index + 1}`}</div>
                  <div class="day-date">${day.date || ''}</div>
                </td>
                <td>
                  <div style="font-weight: 500;">${day.title || ''}</div>
                  ${day.highlight ? `<div style="font-size: 12px; color: #8b8680;">${day.highlight}</div>` : ''}
                </td>
                <td style="text-align: center; font-size: 12px;">${day.meals?.breakfast || '-'}</td>
                <td style="text-align: center; font-size: 12px;">${day.meals?.lunch || '-'}</td>
                <td style="text-align: center; font-size: 12px;">${day.meals?.dinner || '-'}</td>
                <td style="font-size: 12px;">${day.accommodation || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          本行程表由 ${companyName} 提供 | 列印日期：${formatDateTW(new Date())}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const dailyItinerary = itinerary?.daily_itinerary || []
  const companyName = user?.workspace_code || '旅行社'

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <span>簡易行程表</span>
            {itinerary && (
              <span className="text-sm text-morandi-secondary font-normal">
                - {itinerary.title}
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={!itinerary}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Printer size={16} />
              列印
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-white">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
            </div>
          ) : !itinerary ? (
            <div className="h-64 flex items-center justify-center text-morandi-secondary">
              找不到行程表
            </div>
          ) : (
            <div className="p-6">
              {/* 標題區 */}
              <div className="border-b-2 border-morandi-gold pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-morandi-primary mb-1">
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
                </div>
              </div>

              {/* 每日行程表格 */}
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-morandi-gold text-white">
                    <th className="border border-morandi-gold/50 px-3 py-2 text-left w-20">日期</th>
                    <th className="border border-morandi-gold/50 px-3 py-2 text-left">行程內容</th>
                    <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">早餐</th>
                    <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">午餐</th>
                    <th className="border border-morandi-gold/50 px-3 py-2 text-center w-16">晚餐</th>
                    <th className="border border-morandi-gold/50 px-3 py-2 text-left w-32">住宿</th>
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
              <div className="mt-6 pt-4 border-t border-morandi-container text-xs text-morandi-secondary text-center">
                <p>本行程表由 {companyName} 提供</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
