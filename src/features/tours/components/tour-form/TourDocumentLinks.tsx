'use client'

import React from 'react'
import { Combobox } from '@/components/ui/combobox'
import type { Itinerary, Quote } from '@/stores/types'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface TourDocumentLinksProps {
  availableItineraries: Itinerary[]
  availableQuotes: Quote[]
  selectedItineraryId?: string | null
  selectedQuoteId?: string | null
  handleItinerarySelect: (id: string) => void
  handleQuoteSelect: (id: string) => void
}

export function TourDocumentLinks({
  availableItineraries,
  availableQuotes,
  selectedItineraryId,
  selectedQuoteId,
  handleItinerarySelect,
  handleQuoteSelect,
}: TourDocumentLinksProps) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <h3 className="text-lg font-medium text-morandi-primary mb-4">關聯文件（選填）</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-morandi-primary">關聯行程表</label>
          <Combobox
            options={[
              { value: '', label: '獨立旅遊團（無行程表）' },
              ...availableItineraries.map(itinerary => ({
                value: itinerary.id,
                label: `${itinerary.tour_code || '無編號'} - ${stripHtml(itinerary.title) || '未命名'}`,
              })),
            ]}
            value={selectedItineraryId || ''}
            onChange={handleItinerarySelect}
            placeholder="搜尋或選擇行程表..."
            emptyMessage="找不到行程表"
            className="mt-1"
            disabled={!!selectedQuoteId}
          />
          <p className="text-xs text-morandi-secondary mt-1">
            選擇後自動帶入行程資料
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">關聯報價單</label>
          <Combobox
            options={[
              { value: '', label: '獨立旅遊團（無報價單）' },
              ...availableQuotes.map(quote => ({
                value: quote.id,
                label: `${quote.code || '無編號'} - ${stripHtml(quote.name) || stripHtml(quote.destination) || '未命名'}`,
              })),
            ]}
            value={selectedQuoteId || ''}
            onChange={handleQuoteSelect}
            placeholder="搜尋或選擇報價單..."
            emptyMessage="找不到報價單"
            className="mt-1"
            disabled={!!selectedItineraryId}
          />
          <p className="text-xs text-morandi-secondary mt-1">
            選擇後自動帶入報價資料
          </p>
        </div>
      </div>
    </div>
  )
}
