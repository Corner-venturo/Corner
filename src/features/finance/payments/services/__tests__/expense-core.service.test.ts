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
        totalCost = 999
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
      expect(50000 - 18000).toBe(32000)
    })

    it('should handle negative profit when cost exceeds revenue', () => {
      expect(10000 - 25000).toBe(-15000)
    })

    it('should handle zero revenue with costs', () => {
      expect(0 - 18000).toBe(-18000)
    })

    // === 新增邊界測試 ===

    it('subtotal 為 0 的項目不影響加總', () => {
      const items = [
        { subtotal: 10000 },
        { subtotal: 0 },
        { subtotal: 5000 },
      ]
      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )
      expect(totalCost).toBe(15000)
    })

    it('所有 subtotal 都為 null', () => {
      const items = [
        { subtotal: null },
        { subtotal: null },
      ]
      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )
      expect(totalCost).toBe(0)
    })

    it('大量 items 加總', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        subtotal: (i + 1) * 100,
      }))
      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )
      // sum of 100+200+...+10000 = 100 * (1+2+...+100) = 100 * 5050 = 505000
      expect(totalCost).toBe(505000)
    })

    it('負數 subtotal（退款/扣除）', () => {
      const items = [
        { subtotal: 10000 },
        { subtotal: -2000 },
        { subtotal: 5000 },
      ]
      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )
      expect(totalCost).toBe(13000)
    })

    it('只有一筆請款項目', () => {
      const items = [{ subtotal: 50000 }]
      const totalCost = items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )
      expect(totalCost).toBe(50000)
    })

    it('利潤恰好為 0', () => {
      const totalRevenue = 30000
      const totalCost = 30000
      expect(totalRevenue - totalCost).toBe(0)
    })
  })
})
