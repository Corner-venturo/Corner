/**
 * 團確單生成邏輯
 */

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import type { Tour } from '@/stores/types'
import type { FlightInfo } from '@/types/flight.types'
import type { QuoteItem, TourRequest } from './requirements-list.types'
import {
  syncConfirmationCreateToCore,
} from '@/features/tour-confirmation/services/confirmationCoreTableSync'

interface UseConfirmationSheetOptions {
  user: { id: string; workspace_id?: string; display_name?: string; chinese_name?: string } | null
  tour: Tour | null
  tourId?: string
  quoteItems: QuoteItem[]
  quoteGroupSize: number | null
  existingRequests: TourRequest[]
  outboundFlight: FlightInfo | null
  returnFlight: FlightInfo | null
}

export function useConfirmationSheet({
  user,
  tour,
  tourId,
  quoteItems,
  quoteGroupSize,
  existingRequests,
  outboundFlight,
  returnFlight,
}: UseConfirmationSheetOptions) {
  const { toast } = useToast()
  const [generatingSheet, setGeneratingSheet] = useState(false)

  const insertConfirmationItems = useCallback(async (sheetId: string) => {
    if (!user || !tour) return

    const workspaceId = tour.workspace_id || user.workspace_id || ''

    // 查詢已存在的項目（避免重複插入）
    const { data: existingItems } = await supabase
      .from('tour_confirmation_items')
      .select('category, supplier_name, title, service_date')
      .eq('sheet_id', sheetId)

    const existingKeys = new Set(
      (existingItems || []).map(item =>
        `${item.category}-${item.supplier_name}-${item.title}-${item.service_date || ''}`
      )
    )

    const allItems: Array<{
      sheet_id: string
      category: string
      service_date: string
      supplier_name: string
      title: string
      description?: string | null
      unit_price?: number | null
      quantity?: number | null
      subtotal?: number | null
      booking_status: string
      sort_order: number
      workspace_id: string
      resource_type?: string | null
      resource_id?: string | null
      latitude?: number | null
      longitude?: number | null
      google_maps_url?: string | null
      notes?: string | null
      itinerary_item_id?: string | null
    }> = []

    // 1. 航班資訊
    if (outboundFlight) {
      const outboundTitle = `去程 ${outboundFlight.flightNumber || ''} ${outboundFlight.departureAirport || ''}→${outboundFlight.arrivalAirport || ''}`
      const outboundKey = `transport-${outboundFlight.airline || ''}-${outboundTitle}-${tour.departure_date || ''}`
      if (!existingKeys.has(outboundKey)) {
        allItems.push({
          sheet_id: sheetId,
          category: 'transport',
          service_date: tour.departure_date || '',
          supplier_name: outboundFlight.airline || '',
          title: outboundTitle,
          description: outboundFlight.departureTime && outboundFlight.arrivalTime
            ? `${outboundFlight.departureAirport} ${outboundFlight.departureTime} → ${outboundFlight.arrivalAirport} ${outboundFlight.arrivalTime}`
            : null,
          booking_status: 'confirmed',
          sort_order: 0,
          workspace_id: workspaceId,
          notes: outboundFlight.duration || null,
        })
      }
    }

    if (returnFlight) {
      const returnTitle = `回程 ${returnFlight.flightNumber || ''} ${returnFlight.departureAirport || ''}→${returnFlight.arrivalAirport || ''}`
      const returnKey = `transport-${returnFlight.airline || ''}-${returnTitle}-${tour.return_date || ''}`
      if (!existingKeys.has(returnKey)) {
        allItems.push({
          sheet_id: sheetId,
          category: 'transport',
          service_date: tour.return_date || '',
          supplier_name: returnFlight.airline || '',
          title: returnTitle,
          description: returnFlight.departureTime && returnFlight.arrivalTime
            ? `${returnFlight.departureAirport} ${returnFlight.departureTime} → ${returnFlight.arrivalAirport} ${returnFlight.arrivalTime}`
            : null,
          booking_status: 'confirmed',
          sort_order: 1,
          workspace_id: workspaceId,
          notes: returnFlight.duration || null,
        })
      }
    }

    // 2. 從報價單項目產生
    const quoteItemsFiltered = quoteItems
      .filter(item => {
        if (item.title.includes('自理') || item.supplierName.includes('自理')) return false
        const existingRequest = existingRequests.find(r =>
          r.category === item.category &&
          r.supplier_name === item.supplierName &&
          r.title === item.title
        )
        if (existingRequest?.hidden) return false
        return true
      })

    quoteItemsFiltered.forEach((item, index) => {
      const serviceDate = item.serviceDate || tour.departure_date || ''
      const itemKey = `${item.category}-${item.supplierName || ''}-${item.title}-${serviceDate}`
      if (existingKeys.has(itemKey)) return

      const useGroupSize = (item.category === 'meal' || item.category === 'activity') && quoteGroupSize
      const qty = useGroupSize ? quoteGroupSize : (item.quantity || 1)
      const unitPrice = item.quotedPrice || null
      const subtotal = unitPrice && qty ? unitPrice * qty : null

      allItems.push({
        sheet_id: sheetId,
        category: item.category,
        service_date: serviceDate,
        supplier_name: item.supplierName || '',
        title: item.title,
        unit_price: unitPrice,
        quantity: qty,
        subtotal: subtotal,
        booking_status: 'pending',
        sort_order: index + 10,
        workspace_id: workspaceId,
        resource_type: item.resourceType || null,
        resource_id: item.resourceId || null,
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        google_maps_url: item.googleMapsUrl || null,
        notes: item.notes || null,
        itinerary_item_id: item.itinerary_item_id || null,
      })
    })

    if (allItems.length > 0) {
      const { data: inserted_items, error } = await supabase
        .from('tour_confirmation_items')
        .insert(allItems)
        .select('id, itinerary_item_id, booking_status')

      if (error) throw error

      // 同步核心表
      if (inserted_items) {
        for (const item of inserted_items) {
          const typed_item = item as { id: string; itinerary_item_id: string | null; booking_status: string | null }
          if (typed_item.itinerary_item_id) {
            syncConfirmationCreateToCore({
              confirmation_item_id: typed_item.id,
              itinerary_item_id: typed_item.itinerary_item_id,
              booking_status: typed_item.booking_status,
            }).catch(err => logger.error('Core table sync failed:', err))
          }
        }
      }
    }
  }, [user, tour, quoteItems, quoteGroupSize, existingRequests, outboundFlight, returnFlight])

  const handleGenerateConfirmationSheet = useCallback(async () => {
    if (!user || !tourId || !tour) {
      toast({ title: '只有旅遊團模式可以產生團確單', variant: 'destructive' })
      return
    }

    const workspaceId = tour.workspace_id || user.workspace_id
    if (!workspaceId) {
      toast({ title: '缺少 workspace 資訊', variant: 'destructive' })
      return
    }

    setGeneratingSheet(true)
    try {
      const { data: existingSheet } = await supabase
        .from('tour_confirmation_sheets')
        .select('id')
        .eq('tour_id', tourId)
        .maybeSingle()

      if (existingSheet) {
        await supabase
          .from('tour_confirmation_items')
          .delete()
          .eq('sheet_id', existingSheet.id)
          .is('actual_cost', null)

        await insertConfirmationItems(existingSheet.id)
        toast({ title: '團確單已更新（已保留已付清項目）' })
      } else {
        const { data: newSheet, error: sheetError } = await supabase
          .from('tour_confirmation_sheets')
          .insert({
            tour_id: tourId,
            tour_code: tour.code,
            tour_name: tour.name,
            departure_date: tour.departure_date,
            return_date: tour.return_date,
            workspace_id: workspaceId,
            status: 'draft',
          })
          .select()
          .single()

        if (sheetError) throw sheetError

        await insertConfirmationItems(newSheet.id)
        toast({ title: '團確單已產生' })
      }
    } catch (error) {
      logger.error('產生團確單失敗:', error)
      toast({ title: '產生團確單失敗', variant: 'destructive' })
    } finally {
      setGeneratingSheet(false)
    }
  }, [user, tourId, tour, toast, insertConfirmationItems])

  return { generatingSheet, handleGenerateConfirmationSheet }
}
