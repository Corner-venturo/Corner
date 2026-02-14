'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useWorkspaceId } from '@/lib/workspace-context'
import type { Tour, Itinerary } from '@/stores/types'
import { LABELS } from '../constants/labels'
import { logger } from '@/lib/utils/logger'

interface TourItinerarySelectorProps {
  selectedTourId: string
  selectedItineraryId: string
  onTourChange: (tourId: string, tourCode: string, tourName: string) => void
  onItineraryChange: (itineraryId: string, itineraryName: string) => void
}

/**
 * 團/行程選擇器
 * 使用 Select 組件（較簡單，滾動更順暢）
 */
export function TourItinerarySelector({
  selectedTourId,
  selectedItineraryId,
  onTourChange,
  onItineraryChange,
}: TourItinerarySelectorProps) {
  const workspaceId = useWorkspaceId()
  const [tours, setTours] = useState<Tour[]>([])
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loadingTours, setLoadingTours] = useState(false)
  const [loadingItineraries, setLoadingItineraries] = useState(false)

  // 載入團列表（排除封存的）
  useEffect(() => {
    if (!workspaceId) return

    const fetchTours = async () => {
      setLoadingTours(true)
      const { data } = await supabase
        .from('tours')
        .select('id, code, name, status, archived')
        .or('archived.is.null,archived.eq.false')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setTours(data as Tour[])
      setLoadingTours(false)
    }

    fetchTours().catch((err) => logger.error('[fetchTours]', err))
  }, [workspaceId])

  // 根據選擇的團載入行程列表
  useEffect(() => {
    if (!selectedTourId) {
      setItineraries([])
      return
    }

    const fetchItineraries = async () => {
      setLoadingItineraries(true)
      const { data } = await supabase
        .from('itineraries')
        .select('id, title, version')
        .eq('tour_id', selectedTourId)
        .order('created_at', { ascending: false })

      if (data) setItineraries(data as unknown as Itinerary[])
      setLoadingItineraries(false)
    }

    fetchItineraries().catch((err) => logger.error('[fetchItineraries]', err))
  }, [selectedTourId])

  const handleTourChange = (tourId: string) => {
    const tour = tours.find((t) => t.id === tourId)
    onTourChange(tourId, tour?.code || '', tour?.name || '')
    onItineraryChange('', '') // 清除行程選擇
  }

  const handleItineraryChange = (itineraryId: string) => {
    const itinerary = itineraries.find((i) => i.id === itineraryId)
    onItineraryChange(itineraryId, itinerary?.title || '')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-morandi-primary">
          {LABELS.selectTour}
        </label>
        <Select
          value={selectedTourId}
          onValueChange={handleTourChange}
          disabled={loadingTours}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={loadingTours ? LABELS.loading : LABELS.selectTour} />
          </SelectTrigger>
          <SelectContent>
            {tours.map((tour) => (
              <SelectItem key={tour.id} value={tour.id}>
                {tour.code ? `${tour.code} - ${tour.name || ''}` : tour.name || `(${LABELS.noName})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-morandi-primary">
          {LABELS.selectItinerary}
        </label>
        <Select
          value={selectedItineraryId}
          onValueChange={handleItineraryChange}
          disabled={!selectedTourId || loadingItineraries}
        >
          <SelectTrigger className="mt-1">
            <SelectValue
              placeholder={
                !selectedTourId
                  ? LABELS.selectTourFirst
                  : loadingItineraries
                    ? LABELS.loading
                    : itineraries.length === 0
                      ? LABELS.noItinerary
                      : `${LABELS.selectItinerary}...`
              }
            />
          </SelectTrigger>
          <SelectContent>
            {itineraries.map((itinerary) => (
              <SelectItem key={itinerary.id} value={itinerary.id}>
                {itinerary.title || `(${LABELS.noName})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
