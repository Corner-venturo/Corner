'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { OrderMember, CustomerDietaryMap, OrderCodeMap } from '../types'
import { toast } from 'sonner'

const supabase = supabaseClient as any

/**
 * Hook for managing tour members data
 * Handles loading members, order codes, and dietary restrictions
 */
export function useTourMembers(tourId: string) {
  const [members, setMembers] = useState<OrderMember[]>([])
  const [orderCodes, setOrderCodes] = useState<OrderCodeMap>({})
  const [dietaryMap, setDietaryMap] = useState<CustomerDietaryMap>({})
  const [originalDietaryMap, setOriginalDietaryMap] = useState<CustomerDietaryMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [tourId])

  const loadMembers = async () => {
    try {
      // 1. Find all orders for this tour
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('tour_id', tourId)

      if (ordersError) throw ordersError

      const orderIds = orders?.map((o: { id: string }) => o.id) || []

      // Build order code map
      const codeMap: OrderCodeMap = {}
      orders?.forEach((o: { id: string; order_number: string | null }) => {
        codeMap[o.id] = o.order_number || '-'
      })
      setOrderCodes(codeMap)

      if (orderIds.length === 0) {
        setMembers([])
        setLoading(false)
        return
      }

      // 2. Fetch all members for these orders
      const { data: membersData, error: membersError } = await supabase
        .from('order_members')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true })

      if (membersError) throw membersError

      setMembers((membersData || []) as unknown as OrderMember[])

      // 3. Load dietary restrictions from customers table
      const customerIds = (membersData || [])
        .filter((m: OrderMember) => m.customer_id)
        .map((m: OrderMember) => m.customer_id) as string[]

      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, dietary_restrictions')
          .in('id', customerIds)

        const dietary: CustomerDietaryMap = {}
        customersData?.forEach((c: { id: string; dietary_restrictions: string | null }) => {
          dietary[c.id] = c.dietary_restrictions || ''
        })
        setDietaryMap(dietary)
        setOriginalDietaryMap(dietary)
      }
    } catch (error) {
      logger.error('載入團員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDietaryRestrictions = (customerId: string | null): string => {
    if (!customerId) return ''
    return dietaryMap[customerId] || ''
  }

  const handleDietaryChange = async (customerId: string | null, value: string) => {
    if (!customerId) {
      toast.error('此團員未關聯顧客資料，無法儲存飲食禁忌')
      return
    }

    // Update local state immediately
    setDietaryMap(prev => ({ ...prev, [customerId]: value }))

    try {
      // Sync to customers table
      const { error } = await supabase
        .from('customers')
        .update({ dietary_restrictions: value || null })
        .eq('id', customerId)

      if (error) throw error

      // Show success if value changed
      if (originalDietaryMap[customerId] !== value) {
        toast.success('飲食禁忌已同步更新至顧客資料')
        setOriginalDietaryMap(prev => ({ ...prev, [customerId]: value }))
      }
    } catch (error) {
      logger.error('更新飲食禁忌失敗:', error)
      toast.error('更新飲食禁忌失敗')
      // Revert local state
      setDietaryMap(prev => ({ ...prev, [customerId]: originalDietaryMap[customerId] || '' }))
    }
  }

  return {
    members,
    setMembers,
    orderCodes,
    dietaryMap,
    loading,
    getDietaryRestrictions,
    handleDietaryChange,
    reload: loadMembers,
  }
}
