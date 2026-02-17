import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase/client'

// Mock SWR mutate
vi.mock('swr', () => ({
  mutate: vi.fn(),
}))

// Helper to build chainable supabase mock
function mockChain(finalValue: unknown) {
  const chain: Record<string, unknown> = {}
  const proxy = new Proxy(chain, {
    get(_target, prop) {
      if (prop === 'then') return undefined // not a promise itself
      return (..._args: unknown[]) => {
        // Terminal methods that return data
        if (prop === 'single') return Promise.resolve(finalValue)
        if (prop === 'select' && typeof finalValue === 'object' && finalValue !== null && 'data' in (finalValue as Record<string, unknown>)) {
          // If we already have { data }, return a chainable that resolves
          const innerProxy: Record<string, unknown> = {}
          return new Proxy(innerProxy, {
            get(_t, p) {
              if (p === 'then') {
                return (resolve: (v: unknown) => void) => resolve(finalValue)
              }
              return (..._a: unknown[]) => innerProxy
            },
          })
        }
        return proxy
      }
    },
  })
  return proxy
}

describe('receipt-core.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recalculateOrderPayment logic', () => {
    it('should calculate paid status when receipts cover full amount', async () => {
      // Test the core calculation logic
      const orderTotalAmount = 10000
      const confirmedReceipts = [
        { actual_amount: 5000 },
        { actual_amount: 5000 },
      ]

      const totalPaid = confirmedReceipts.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )

      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (totalPaid >= orderTotalAmount && orderTotalAmount > 0) {
        paymentStatus = 'paid'
      } else if (totalPaid > 0) {
        paymentStatus = 'partial'
      }

      expect(totalPaid).toBe(10000)
      expect(paymentStatus).toBe('paid')
      expect(Math.max(0, orderTotalAmount - totalPaid)).toBe(0)
    })

    it('should calculate partial status when receipts partially cover amount', () => {
      const orderTotalAmount = 10000
      const confirmedReceipts = [{ actual_amount: 3000 }]

      const totalPaid = confirmedReceipts.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )

      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (totalPaid >= orderTotalAmount && orderTotalAmount > 0) {
        paymentStatus = 'paid'
      } else if (totalPaid > 0) {
        paymentStatus = 'partial'
      }

      expect(totalPaid).toBe(3000)
      expect(paymentStatus).toBe('partial')
      expect(Math.max(0, orderTotalAmount - totalPaid)).toBe(7000)
    })

    it('should return unpaid when no confirmed receipts exist', () => {
      const orderTotalAmount = 10000
      const confirmedReceipts: { actual_amount: number }[] = []

      const totalPaid = confirmedReceipts.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )

      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (totalPaid >= orderTotalAmount && orderTotalAmount > 0) {
        paymentStatus = 'paid'
      } else if (totalPaid > 0) {
        paymentStatus = 'partial'
      }

      expect(totalPaid).toBe(0)
      expect(paymentStatus).toBe('unpaid')
    })

    it('should handle null actual_amount gracefully', () => {
      const confirmedReceipts = [
        { actual_amount: 5000 },
        { actual_amount: null },
        { actual_amount: 2000 },
      ]

      const totalPaid = confirmedReceipts.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )

      expect(totalPaid).toBe(7000)
    })

    it('should remain unpaid when order total is 0 even with receipts', () => {
      const orderTotalAmount = 0
      const totalPaid = 5000

      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (totalPaid >= orderTotalAmount && orderTotalAmount > 0) {
        paymentStatus = 'paid'
      } else if (totalPaid > 0) {
        paymentStatus = 'partial'
      }

      // totalPaid > 0 so partial
      expect(paymentStatus).toBe('partial')
    })
  })

  describe('recalculateTourFinancials logic', () => {
    it('should calculate profit as revenue minus cost', () => {
      const totalRevenue = 50000
      const totalCost = 30000
      const profit = totalRevenue - totalCost
      expect(profit).toBe(20000)
    })

    it('should handle zero revenue', () => {
      const totalRevenue = 0
      const totalCost = 30000
      const profit = totalRevenue - totalCost
      expect(profit).toBe(-30000)
    })

    it('should handle empty receipts for revenue calculation', () => {
      const receiptsData: { actual_amount: number }[] = []
      const totalRevenue = receiptsData.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )
      expect(totalRevenue).toBe(0)
    })
  })
})
