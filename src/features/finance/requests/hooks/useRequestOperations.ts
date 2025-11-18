import { useCallback } from 'react'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { RequestFormData, BatchRequestFormData, RequestItem } from '../types'

export function useRequestOperations() {
  const { payment_requests, createPaymentRequest, addPaymentItem } = usePayments()

  // Generate request number preview
  const generateRequestNumber = useCallback(() => {
    const year = new Date().getFullYear()
    const count = payment_requests.length + 1
    return `PR${year}${count.toString().padStart(4, '0')}`
  }, [payment_requests.length])

  // Create single request
  const createRequest = useCallback(
    async (
      formData: RequestFormData,
      items: RequestItem[],
      tourName: string,
      tourCode: string,
      orderNumber?: string
    ) => {
      if (!formData.tour_id || items.length === 0) return null

      // Create payment request
      const request = await createPaymentRequest({
        tour_id: formData.tour_id,
        code: tourCode,
        tour_name: tourName,
        order_id: formData.order_id || undefined,
        order_number: orderNumber,
        request_date: formData.request_date,
        items: [],
        total_amount: 0,
        status: 'pending',
        note: formData.note,
        budget_warning: false,
      } as any)

      // Add all items sequentially
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        await addPaymentItem(request.id, {
          category: item.category,
          supplier_id: item.supplier_id,
          supplier_name: item.supplierName,
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          note: '',
          sort_order: i + 1,
        })
      }

      return request
    },
    [createPaymentRequest, addPaymentItem]
  )

  // Create batch requests
  const createBatchRequests = useCallback(
    async (
      formData: BatchRequestFormData,
      items: RequestItem[],
      tourIds: string[],
      tours: Array<{ id: string; code: string; name: string }>,
      tourAllocations?: Record<string, number>
    ) => {
      if (tourIds.length === 0 || items.length === 0) return []

      const createdRequests = []

      // Calculate total amount from items
      const totalItemsAmount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

      for (const tourId of tourIds) {
        const selectedTour = tours.find(t => t.id === tourId)
        if (!selectedTour) continue

        // Determine this tour's allocation amount
        // If allocation is specified, use it; otherwise distribute evenly
        const tourAmount = tourAllocations?.[tourId] || totalItemsAmount / tourIds.length

        // Calculate adjustment ratio
        const adjustmentRatio = tourAmount / totalItemsAmount

        // Create payment request
        const request = await createPaymentRequest({
          tour_id: tourId,
          code: selectedTour.code,
          tour_name: selectedTour.name,
          request_date: formData.request_date,
          items: [],
          total_amount: 0,
          status: 'pending',
          note: formData.note,
          budget_warning: false,
        } as any)

        // Add all items with adjusted amounts
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const adjustedUnitPrice = Math.round(item.unit_price * adjustmentRatio)

          await addPaymentItem(request.id, {
            category: item.category,
            supplier_id: item.supplier_id,
            supplier_name: item.supplierName,
            description: item.description,
            unit_price: adjustedUnitPrice,
            quantity: item.quantity,
            note: '',
            sort_order: i + 1,
          })
        }

        createdRequests.push(request)
      }

      return createdRequests
    },
    [createPaymentRequest, addPaymentItem]
  )

  return {
    generateRequestNumber,
    createRequest,
    createBatchRequests,
  }
}
