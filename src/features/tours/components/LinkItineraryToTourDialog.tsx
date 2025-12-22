/**
 * LinkItineraryToTourDialog - 旅遊團行程表對話框
 * 功能：建立新行程表 / 查看已關聯行程表
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, FileText, Loader2, ExternalLink, Calendar, MapPin } from 'lucide-react'
import { useItineraryStore } from '@/stores'
import type { Tour, Itinerary } from '@/stores/types'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface LinkItineraryToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

export function LinkItineraryToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkItineraryToTourDialogProps) {
  const router = useRouter()
  const { items: itineraries, fetchAll, create, loading } = useItineraryStore()
  const [isCreating, setIsCreating] = useState(false)

  // 載入行程表資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
    }
  }, [isOpen, fetchAll])

  // 已關聯此旅遊團的行程表
  const linkedItineraries = useMemo(() => {
    return itineraries.filter(i => {
      const item = i as Itinerary & { _deleted?: boolean }
      return i.tour_id === tour.id && !item._deleted
    })
  }, [itineraries, tour.id])

  // 建立新行程表
  const handleCreateNew = async () => {
    try {
      setIsCreating(true)

      // 從旅遊團帶入航班資訊
      const tourWithFlight = tour as typeof tour & {
        outbound_flight?: { text?: string } | null
        return_flight?: { text?: string } | null
      }

      const newItinerary = await create({
        title: tour.name,
        tour_id: tour.id,
        tour_code: tour.code,
        status: 'draft',
        departure_date: tour.departure_date || '',
        city: tour.location || '',
        daily_itinerary: [],
        tagline: '',
        subtitle: '',
        description: '',
        cover_image: '',
        country: '',
        features: [],
        focus_cards: [],
        outbound_flight: tourWithFlight.outbound_flight?.text ? {
          airline: '',
          flightNumber: tourWithFlight.outbound_flight.text,
          departureAirport: '',
          departureTime: '',
          arrivalAirport: '',
          arrivalTime: '',
        } : undefined,
        return_flight: tourWithFlight.return_flight?.text ? {
          airline: '',
          flightNumber: tourWithFlight.return_flight.text,
          departureAirport: '',
          departureTime: '',
          arrivalAirport: '',
          arrivalTime: '',
        } : undefined,
      } as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

      if (newItinerary?.id) {
        onClose()
        router.push(`/itinerary/new?id=${newItinerary.id}`)
      }
    } catch (error) {
      console.error('建立行程表失敗:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // 查看已連結的行程表
  const handleViewItinerary = (itinerary: Itinerary) => {
    onClose()
    router.push(`/itinerary/new?id=${itinerary.id}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>行程表</DialogTitle>
          <DialogDescription>
            為「{tour.name}」建立行程表
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 建立新行程表 */}
          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-morandi-primary/20 flex items-center justify-center shrink-0">
              {isCreating ? (
                <Loader2 className="w-5 h-5 text-morandi-primary animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-morandi-primary" />
              )}
            </div>
            <div>
              <div className="font-medium text-morandi-primary">建立新行程表</div>
              <div className="text-sm text-morandi-secondary">為此旅遊團建立全新的行程表</div>
            </div>
          </button>

          {/* 已關聯的行程表 */}
          {linkedItineraries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-morandi-gold" />
                <span className="text-sm font-medium text-morandi-primary">已建立的行程表</span>
              </div>
              <div className="space-y-2">
                {linkedItineraries.map(itinerary => (
                  <button
                    key={itinerary.id}
                    onClick={() => handleViewItinerary(itinerary)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {itinerary.tour_code && (
                          <span className="font-mono text-sm text-morandi-gold">{itinerary.tour_code}</span>
                        )}
                        <span className="text-morandi-text truncate">{stripHtml(itinerary.title) || '未命名'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                        {itinerary.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {itinerary.city}
                          </span>
                        )}
                        {itinerary.departure_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {itinerary.departure_date}
                          </span>
                        )}
                        {itinerary.daily_itinerary?.length > 0 && (
                          <span>{itinerary.daily_itinerary.length} 天</span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-morandi-secondary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 載入中 */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
              <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
