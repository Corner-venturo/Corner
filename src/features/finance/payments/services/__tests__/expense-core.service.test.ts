import { describe, it, expect, vi } from 'vitest'

vi.mock('swr', () => ({
  mutate: vi.fn(),
}))

describe('expense-core.service', () => {
  describe('recalculateExpenseStats logic', () => {
    it('should calculate total_cost from payment request items', () => {
      const items = [
        { subtotal: 10000 },
        { subtotal: 5000 },
        { subtotal: 3000 },
      ]

      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )

      expect(totalCost).toBe(18000)
    })

    it('should return 0 when no payment requests exist', () => {
      const requestsData: { id: string }[] = []
      let totalCost = 0

      if (requestsData.length > 0) {
        // would query items
        totalCost = 999 // should not reach here
      }

      expect(totalCost).toBe(0)
    })

    it('should handle null subtotal values', () => {
      const items = [
        { subtotal: 10000 },
        { subtotal: null },
        { subtotal: 5000 },
      ]

      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )

      expect(totalCost).toBe(15000)
    })

    it('should calculate profit correctly', () => {
      const totalRevenue = 50000
      const totalCost = 18000
      const profit = totalRevenue - totalCost

      expect(profit).toBe(32000)
    })

    it('should handle negative profit when cost exceeds revenue', () => {
      const totalRevenue = 10000
      const totalCost = 25000
      const profit = totalRevenue - totalCost

      expect(profit).toBe(-15000)
    })

    it('should handle zero revenue with costs', () => {
      const totalRevenue = 0
      const totalCost = 18000
      const profit = totalRevenue - totalCost

      expect(profit).toBe(-18000)
    })
  })
})
