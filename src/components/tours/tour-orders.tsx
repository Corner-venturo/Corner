'use client'

import { Tour } from '@/stores/types'
import { useOrderStore } from '@/stores'
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table'

interface TourOrdersProps {
  tour: Tour
}

export function TourOrders({ tour }: TourOrdersProps) {
  const { items: orders } = useOrderStore()

  // 過濾出屬於這個旅遊團的訂單
  const tourOrders = orders.filter(order => order.tour_id === tour.id) as any

  // Debug: 顯示訂單篩選資訊
  console.log('TourOrders Debug:', {
    tourId: tour.id,
    tourCode: tour.code,
    allOrdersCount: orders.length,
    filteredOrdersCount: tourOrders.length,
    allOrders: orders.map(o => ({ id: o.id, number: o.order_number, tour_id: o.tour_id })),
    filteredOrders: tourOrders.map((o: any) => ({ id: o.id, number: o.order_number, tour_id: o.tour_id }))
  })

  return (
    <div className="space-y-6">
      {/* 直接使用現有的 ExpandableOrderTable 組件 */}
      <ExpandableOrderTable
        orders={tourOrders}
        showTourInfo={false} // 因為已經在旅遊團內，不需要顯示旅遊團資訊
        tourDepartureDate={tour.departure_date} // 傳遞出發日期給成員管理使用
      />
    </div>
  )
}
