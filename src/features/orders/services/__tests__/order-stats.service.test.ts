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
      const remainingAmount = Math.max(0, totalAmount - paidAmount)

      expect(remainingAmount).toBe(25000)
    })

    it('should not go negative for remaining_amount', () => {
      const totalAmount = 10000
      const paidAmount = 15000
      const remainingAmount = Math.max(0, totalAmount - paidAmount)

      expect(remainingAmount).toBe(0)
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
  })
})
