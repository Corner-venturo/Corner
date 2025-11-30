'use client'

import { Tour } from '@/stores/types'
import { useOrderStore } from '@/stores'
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table'

interface TourOrdersProps {
  tour: Tour
}

export function TourOrders({ tour }: TourOrdersProps) {
  const { items: orders } = useOrderStore()

  const tourOrders = orders.filter(order => order.tour_id === tour.id)

  return (
    <div className="space-y-6">
      <ExpandableOrderTable
        orders={tourOrders}
        showTourInfo={false}
        tourDepartureDate={tour.departure_date}
      />
    </div>
  )
}
