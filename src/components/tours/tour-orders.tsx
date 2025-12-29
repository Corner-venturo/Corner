'use client'

import { useEffect, useState } from 'react'
import { Tour, Order } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { SimpleOrderTable } from '@/components/orders/simple-order-table'
import type { Order as OrderType } from '@/types/order.types'
import { logger } from '@/lib/utils/logger'

interface TourOrdersProps {
  tour: Tour
}

export function TourOrders({ tour }: TourOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('tour_id', tour.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders((data || []) as Order[])
      } catch (err) {
        logger.error('載入訂單失敗:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [tour.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <SimpleOrderTable
      orders={orders as OrderType[]}
      showTourInfo={false}
    />
  )
}
