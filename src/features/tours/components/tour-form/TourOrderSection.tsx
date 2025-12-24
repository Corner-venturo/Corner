'use client'

import React from 'react'
import { AddOrderForm, type OrderFormData } from '@/components/orders/add-order-form'

interface TourOrderSectionProps {
  newOrder: Partial<OrderFormData>
  setNewOrder: React.Dispatch<React.SetStateAction<Partial<OrderFormData>>>
}

export function TourOrderSection({ newOrder, setNewOrder }: TourOrderSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-morandi-primary mb-4">
        同時新增訂單（選填）
      </h3>

      <AddOrderForm tourId="embedded" value={newOrder} onChange={setNewOrder} />

      <div className="bg-morandi-container/20 p-3 rounded-lg mt-4">
        <p className="text-xs text-morandi-secondary">
          提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。
        </p>
      </div>
    </div>
  )
}
