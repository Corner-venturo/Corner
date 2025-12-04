import { useCallback } from 'react'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { RequestFormData, BatchRequestFormData, RequestItem } from '../types'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function useRequestOperations() {
  const { payment_requests, createPaymentRequest, addPaymentItem } = usePayments()
  const { user } = useAuthStore()

  // Generate request number: PR + YMMDD + 序號（從資料庫查詢）
  // 例：PR51203-001（2025年12月3日第1單）
  const generateRequestNumber = useCallback(async () => {
    const now = new Date()
    const year = String(now.getFullYear()).slice(-1) // 只取最後一位：2025 -> 5
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const todayPrefix = `PR${dateStr}`

    // 從資料庫查詢今天的最大序號
    const { data, error } = await supabase
      .from('payment_requests')
      .select('code')
      .like('code', `${todayPrefix}-%`)
      .order('code', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (!error && data && data.length > 0) {
      const lastCode = data[0].code
      const match = lastCode.match(/-(\d+)$/)
      if (match) {
        nextNum = parseInt(match[1], 10) + 1
      }
    }

    return `${todayPrefix}-${String(nextNum).padStart(3, '0')}`
  }, [])

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

      // 生成請款單號（用 code 欄位）
      const requestCode = await generateRequestNumber()

      const request = await createPaymentRequest({
        tour_id: formData.tour_id,
        code: requestCode,
        tour_code: tourCode,
        tour_name: tourName,
        order_id: formData.order_id || undefined,
        order_number: orderNumber,
        request_date: formData.request_date,
        items: [],
        total_amount: 0,
        status: 'pending',
        note: formData.note,
        budget_warning: false,
        request_type: 'standard',
        amount: 0,
        created_by: user?.id,
        created_by_name: user?.display_name || user?.chinese_name || user?.english_name || '未知',
      } as Parameters<typeof createPaymentRequest>[0])

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
          request_type: 'standard',
          amount: 0,
          created_by: user?.id,
          created_by_name: user?.display_name || user?.chinese_name || user?.english_name || '未知',
        } as Parameters<typeof createPaymentRequest>[0])

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
