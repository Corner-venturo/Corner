'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  TourDepartureData,
  TourDepartureMeal,
  TourDepartureAccommodation,
  TourDepartureActivity,
  TourDepartureOther,
} from '@/types/tour-departure.types'

const supabase = supabaseClient

export function useTourDepartureData(tourId: string, open: boolean) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<TourDepartureData | null>(null)
  const [meals, setMeals] = useState<TourDepartureMeal[]>([])
  const [accommodations, setAccommodations] = useState<TourDepartureAccommodation[]>([])
  const [activities, setActivities] = useState<TourDepartureActivity[]>([])
  const [others, setOthers] = useState<TourDepartureOther[]>([])

  const loadDepartureData = async () => {
    try {
      setLoading(true)

      // 載入主表資料
      const { data: mainData, error: mainError } = await (supabase as any)
        .from('tour_departure_data')
        .select('*')
        .eq('tour_id', tourId)
        .single()

      if (mainError && mainError.code !== 'PGRST116') {
        throw mainError
      }

      if (mainData) {
        setData(mainData as unknown as TourDepartureData)

        // 載入餐食
        const { data: mealsData } = await (supabase as any)
          .from('tour_departure_meals')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setMeals((mealsData || []) as TourDepartureMeal[])

        // 載入住宿
        const { data: accomData } = await (supabase as any)
          .from('tour_departure_accommodations')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setAccommodations((accomData || []) as TourDepartureAccommodation[])

        // 載入活動
        const { data: activData } = await (supabase as any)
          .from('tour_departure_activities')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setActivities((activData || []) as TourDepartureActivity[])

        // 載入其他
        const { data: othersData } = await (supabase as any)
          .from('tour_departure_others')
          .select('*')
          .eq('departure_data_id', mainData.id)
          .order('date', { ascending: true })
          .order('display_order', { ascending: true })
        setOthers((othersData || []) as TourDepartureOther[])
      } else {
        setData({
          id: '',
          tour_id: tourId,
          service_fee_per_person: 1500,
          petty_cash: 0,
        } as unknown as TourDepartureData)
      }
    } catch (error) {
      logger.error('載入出團資料失敗:', error)
      toast.error('載入失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!data) return

    setSaving(true)
    try {
      let departureDataId = data.id

      if (!departureDataId) {
        // 新增
        const { data: newData, error } = await (supabase as any)
          .from('tour_departure_data')
          .insert({
            ...data,
            tour_id: tourId,
          })
          .select()
          .single()

        if (error) throw error
        departureDataId = newData.id
        setData(prev => ({ ...prev!, id: departureDataId }))
      } else {
        // 更新
        const { error } = await (supabase as any)
          .from('tour_departure_data')
          .update(data)
          .eq('id', departureDataId)

        if (error) throw error
      }

      toast.success('儲存成功')
      return true
    } catch (error) {
      logger.error('儲存失敗:', error)
      toast.error('儲存失敗')
      return false
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadDepartureData()
    }
  }, [open, tourId])

  return {
    loading,
    saving,
    data,
    setData,
    meals,
    setMeals,
    accommodations,
    setAccommodations,
    activities,
    setActivities,
    others,
    setOthers,
    loadDepartureData,
    handleSave,
  }
}
