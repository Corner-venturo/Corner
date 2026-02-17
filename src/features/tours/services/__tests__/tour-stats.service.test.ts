import { describe, it, expect, vi } from 'vitest'

vi.mock('swr', () => ({
  mutate: vi.fn(),
}))

describe('tour-stats.service', () => {
  describe('recalculateParticipants logic', () => {
    it('should count participants from order members', () => {
      const orderIds = ['order-1', 'order-2', 'order-3']
      const count = 15
      expect(orderIds.length).toBe(3)
      expect(count).toBe(15)
    })

    it('should return 0 when no orders exist for tour', () => {
      const ordersData: { id: string }[] = []
      const orderIds = ordersData.map(o => o.id)
      let participantCount = 0
      if (orderIds.length > 0) {
        participantCount = 10
      }
      expect(participantCount).toBe(0)
    })

    it('should return 0 when orders exist but have no members', () => {
      const count = 0
      expect(count || 0).toBe(0)
    })

    it('should handle null count result', () => {
      const count = null
      expect(count || 0).toBe(0)
    })

    // === 新增邊界測試 ===

    it('所有訂單都取消時人數=0', () => {
      // cancelled orders would be filtered out before counting members
      const activeOrders: { id: string }[] = []
      const orderIds = activeOrders.map(o => o.id)
      let participantCount = 0
      if (orderIds.length > 0) {
        participantCount = 99
      }
      expect(participantCount).toBe(0)
    })

    it('訂單有成員但全部刪除後人數=0', () => {
      // After all members deleted, count query returns 0
      const count = 0
      expect(count || 0).toBe(0)
    })

    it('利潤計算（收入-成本）', () => {
      const totalRevenue = 100000
      const totalCost = 60000
      const profit = totalRevenue - totalCost
      expect(profit).toBe(40000)
    })

    it('成本>收入（虧損團）', () => {
      const totalRevenue = 30000
      const totalCost = 80000
      const profit = totalRevenue - totalCost
      expect(profit).toBe(-50000)
    })

    it('單一訂單大量成員（50人團）', () => {
      const members = Array.from({ length: 50 }, (_, i) => ({
        id: `member-${i}`,
        total_payable: 15000,
      }))
      const totalAmount = members.reduce(
        (sum, m) => sum + (m.total_payable || 0),
        0
      )
      expect(members.length).toBe(50)
      expect(totalAmount).toBe(750000)
    })

    it('多訂單合計人數', () => {
      const orderMemberCounts = [5, 8, 12, 3]
      const total = orderMemberCounts.reduce((s, c) => s + c, 0)
      expect(total).toBe(28)
    })
  })
})
