'use client'

import { useEffect, useState } from 'react'
import { Tour, Order } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table'

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
        console.error('載入訂單失敗:', err)
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
    <div className="space-y-6">
      <ExpandableOrderTable
        orders={orders as Parameters<typeof ExpandableOrderTable>[0]['orders']}
        showTourInfo={false}
        tourDepartureDate={tour.departure_date}
      />
    </div>
  )
}
