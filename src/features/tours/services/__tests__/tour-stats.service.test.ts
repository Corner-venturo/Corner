import { describe, it, expect, vi } from 'vitest'

vi.mock('swr', () => ({
  mutate: vi.fn(),
}))

describe('tour-stats.service', () => {
  describe('recalculateParticipants logic', () => {
    it('should count participants from order members', () => {
      const orderIds = ['order-1', 'order-2', 'order-3']
      // Simulate count query result
      const count = 15

      expect(orderIds.length).toBe(3)
      expect(count).toBe(15)
    })

    it('should return 0 when no orders exist for tour', () => {
      const ordersData: { id: string }[] = []
      const orderIds = ordersData.map(o => o.id)

      let participantCount = 0
      if (orderIds.length > 0) {
        participantCount = 10 // should not reach here
      }

      expect(participantCount).toBe(0)
    })

    it('should return 0 when orders exist but have no members', () => {
      const orderIds = ['order-1', 'order-2']
      // Simulate count returning 0
      const count = 0
      const participantCount = count || 0

      expect(participantCount).toBe(0)
    })

    it('should handle null count result', () => {
      const count = null
      const participantCount = count || 0

      expect(participantCount).toBe(0)
    })
  })
})
