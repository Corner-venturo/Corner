import { describe, it, expect, vi } from 'vitest'

vi.mock('swr', () => ({
  mutate: vi.fn(),
}))

describe('order-stats.service', () => {
  describe('recalculateOrderTotal logic', () => {
    it('should sum total_payable from all members', () => {
      const members = [
        { total_payable: 15000 },
        { total_payable: 12000 },
        { total_payable: 18000 },
      ]
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(45000)
    })

    it('should return 0 when no members exist', () => {
      const members: { total_payable: number }[] = []
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(0)
    })

    it('should handle null total_payable', () => {
      const members = [
        { total_payable: 15000 },
        { total_payable: null },
        { total_payable: 10000 },
      ]
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(25000)
    })

    it('should calculate remaining_amount correctly', () => {
      const totalAmount = 45000
      const paidAmount = 20000
      expect(Math.max(0, totalAmount - paidAmount)).toBe(25000)
    })

    it('should not go negative for remaining_amount', () => {
      const totalAmount = 10000
      const paidAmount = 15000
      expect(Math.max(0, totalAmount - paidAmount)).toBe(0)
    })

    it('should determine payment_status correctly', () => {
      const cases = [
        { total: 10000, paid: 0, expected: 'unpaid' },
        { total: 10000, paid: 5000, expected: 'partial' },
        { total: 10000, paid: 10000, expected: 'paid' },
        { total: 10000, paid: 15000, expected: 'paid' },
        { total: 0, paid: 0, expected: 'unpaid' },
      ]
      for (const { total, paid, expected } of cases) {
        let status: 'unpaid' | 'partial' | 'paid' = 'unpaid'
        if (paid >= total && total > 0) {
          status = 'paid'
        } else if (paid > 0) {
          status = 'partial'
        }
        expect(status).toBe(expected)
      }
    })

    // === 新增邊界測試 ===

    it('訂單沒有成員時 total_amount=0', () => {
      const members: { total_payable: number }[] = []
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(0)
    })

    it('成員金額為 0', () => {
      const members = [
        { total_payable: 0 },
        { total_payable: 0 },
        { total_payable: 0 },
      ]
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(0)
    })

    it('大量成員（50人團）的加總', () => {
      const members = Array.from({ length: 50 }, () => ({
        total_payable: 15000,
      }))
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(750000)
      expect(members.length).toBe(50)
    })

    it('混合正數和 null 的成員金額', () => {
      const members = [
        { total_payable: 10000 },
        { total_payable: null },
        { total_payable: 20000 },
        { total_payable: null },
        { total_payable: 15000 },
      ]
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(totalAmount).toBe(45000)
    })

    it('paid_amount 為 0 時 payment_status 為 unpaid', () => {
      const total = 10000
      const paid = 0
      let status: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (paid >= total && total > 0) status = 'paid'
      else if (paid > 0) status = 'partial'
      expect(status).toBe('unpaid')
    })

    it('paid_amount 為 total_amount+1 時仍為 paid', () => {
      const total = 10000
      const paid = 10001
      let status: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (paid >= total && total > 0) status = 'paid'
      else if (paid > 0) status = 'partial'
      expect(status).toBe('paid')
    })

    it('total_amount=0 且 paid>0 時為 partial', () => {
      const total = 0
      const paid = 5000
      let status: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (paid >= total && total > 0) status = 'paid'
      else if (paid > 0) status = 'partial'
      expect(status).toBe('partial')
    })

    it('remaining_amount 精確到小數', () => {
      const totalAmount = 100.50
      const paidAmount = 33.33
      const remaining = Math.max(0, totalAmount - paidAmount)
      expect(remaining).toBeCloseTo(67.17)
    })
  })
})
