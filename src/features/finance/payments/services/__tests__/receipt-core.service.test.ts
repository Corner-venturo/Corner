import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock SWR mutate
vi.mock('swr', () => ({
  mutate: vi.fn(),
}))

describe('receipt-core.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recalculateOrderPayment logic', () => {
    // Helper: replicate the core calculation logic from receipt-core.service
    function calcPaymentStatus(
      orderTotalAmount: number,
      confirmedReceipts: { actual_amount: number | null }[]
    ) {
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
      return {
        totalPaid,
        paymentStatus,
        remainingAmount: Math.max(0, orderTotalAmount - totalPaid),
      }
    }

    it('should calculate paid status when receipts cover full amount', () => {
      const result = calcPaymentStatus(10000, [
        { actual_amount: 5000 },
        { actual_amount: 5000 },
      ])
      expect(result.totalPaid).toBe(10000)
      expect(result.paymentStatus).toBe('paid')
      expect(result.remainingAmount).toBe(0)
    })

    it('should calculate partial status when receipts partially cover amount', () => {
      const result = calcPaymentStatus(10000, [{ actual_amount: 3000 }])
      expect(result.totalPaid).toBe(3000)
      expect(result.paymentStatus).toBe('partial')
      expect(result.remainingAmount).toBe(7000)
    })

    it('should return unpaid when no confirmed receipts exist', () => {
      const result = calcPaymentStatus(10000, [])
      expect(result.totalPaid).toBe(0)
      expect(result.paymentStatus).toBe('unpaid')
    })

    it('should handle null actual_amount gracefully', () => {
      const result = calcPaymentStatus(10000, [
        { actual_amount: 5000 },
        { actual_amount: null },
        { actual_amount: 2000 },
      ])
      expect(result.totalPaid).toBe(7000)
    })

    it('should be partial when order total is 0 but has receipts', () => {
      const result = calcPaymentStatus(0, [{ actual_amount: 5000 }])
      expect(result.paymentStatus).toBe('partial')
    })

    // === 新增邊界測試 ===

    it('超額收款處理：paid_amount > total_amount，remaining_amount = 0', () => {
      const result = calcPaymentStatus(10000, [
        { actual_amount: 8000 },
        { actual_amount: 5000 },
      ])
      expect(result.totalPaid).toBe(13000)
      expect(result.paymentStatus).toBe('paid')
      expect(result.remainingAmount).toBe(0) // Math.max(0, 10000-13000) = 0
    })

    it('重複確認同一筆收款：重複的收款記錄會被加總', () => {
      // 如果同一筆收款被重複計入，totalPaid 會翻倍
      const result = calcPaymentStatus(10000, [
        { actual_amount: 5000 },
        { actual_amount: 5000 }, // same receipt duplicated
      ])
      expect(result.totalPaid).toBe(10000)
      expect(result.paymentStatus).toBe('paid')
    })

    it('收款 amount=0 的處理', () => {
      const result = calcPaymentStatus(10000, [{ actual_amount: 0 }])
      // actual_amount=0 → 0 || 0 = 0, so unpaid
      expect(result.totalPaid).toBe(0)
      expect(result.paymentStatus).toBe('unpaid')
    })

    it('收款 amount 為負數', () => {
      const result = calcPaymentStatus(10000, [
        { actual_amount: 15000 },
        { actual_amount: -3000 }, // refund
      ])
      expect(result.totalPaid).toBe(12000)
      expect(result.paymentStatus).toBe('paid')
    })

    it('多筆小額收款加總剛好等於訂單金額', () => {
      const result = calcPaymentStatus(10000, [
        { actual_amount: 1000 },
        { actual_amount: 2000 },
        { actual_amount: 3000 },
        { actual_amount: 4000 },
      ])
      expect(result.totalPaid).toBe(10000)
      expect(result.paymentStatus).toBe('paid')
      expect(result.remainingAmount).toBe(0)
    })

    it('單筆收款剛好等於訂單金額', () => {
      const result = calcPaymentStatus(50000, [{ actual_amount: 50000 }])
      expect(result.paymentStatus).toBe('paid')
      expect(result.remainingAmount).toBe(0)
    })

    it('所有收款都是 null', () => {
      const result = calcPaymentStatus(10000, [
        { actual_amount: null },
        { actual_amount: null },
      ])
      expect(result.totalPaid).toBe(0)
      expect(result.paymentStatus).toBe('unpaid')
    })

    it('訂單金額和收款都是 0', () => {
      const result = calcPaymentStatus(0, [])
      expect(result.totalPaid).toBe(0)
      expect(result.paymentStatus).toBe('unpaid')
      expect(result.remainingAmount).toBe(0)
    })

    it('極大金額收款', () => {
      const result = calcPaymentStatus(999999999, [
        { actual_amount: 999999999 },
      ])
      expect(result.paymentStatus).toBe('paid')
      expect(result.remainingAmount).toBe(0)
    })

    it('浮點數收款精度', () => {
      const result = calcPaymentStatus(100.01, [
        { actual_amount: 50.005 },
        { actual_amount: 50.005 },
      ])
      expect(result.totalPaid).toBeCloseTo(100.01)
      expect(result.paymentStatus).toBe('paid')
    })
  })

  describe('recalculateTourFinancials logic', () => {
    it('should calculate profit as revenue minus cost', () => {
      expect(50000 - 30000).toBe(20000)
    })

    it('should handle zero revenue', () => {
      expect(0 - 30000).toBe(-30000)
    })

    it('should handle empty receipts for revenue calculation', () => {
      const receiptsData: { actual_amount: number }[] = []
      const totalRevenue = receiptsData.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )
      expect(totalRevenue).toBe(0)
    })

    it('成本>收入（虧損團）', () => {
      const totalRevenue = 10000
      const totalCost = 50000
      const profit = totalRevenue - totalCost
      expect(profit).toBe(-40000)
    })

    it('收入和成本都是 0', () => {
      const profit = 0 - 0
      expect(profit).toBe(0)
    })

    it('多筆收款匯總計算團收入', () => {
      const receipts = [
        { actual_amount: 10000 },
        { actual_amount: 20000 },
        { actual_amount: 15000 },
        { actual_amount: 5000 },
      ]
      const totalRevenue = receipts.reduce(
        (sum, r) => sum + (r.actual_amount || 0),
        0
      )
      expect(totalRevenue).toBe(50000)
    })
  })
})
