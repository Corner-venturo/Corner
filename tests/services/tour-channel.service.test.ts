import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock chain factory for Supabase (thenable, supports .in())
function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: unknown) => void) => resolve(resolveValue)
      }
      // All chainable methods return the proxy
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }
  return new Proxy(chain, handler)
}

let mockFromImplementation: ReturnType<typeof vi.fn>

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFromImplementation(table),
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Import after mocking
import { createTourChannel, addMembersToTourChannel } from '@/features/tours/services/tour-channel.service'
import type { Tour } from '@/types/tour.types'

describe('TourChannelService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromImplementation = vi.fn()
  })

  const createMockTour = (overrides: Partial<Tour> = {}): Tour => ({
    id: 'tour-1',
    code: 'TYO250116A',
    name: '東京5日遊',
    status: '待出發',
    departure_date: '2025-01-16',
    return_date: '2025-01-20',
    contract_status: 'pending',
    total_revenue: 0,
    total_cost: 0,
    profit: 0,
    workspace_id: 'workspace-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  describe('createTourChannel', () => {
    it('should return existing channel if already exists', async () => {
      const tour = createMockTour()
      const existingChannel = { id: 'channel-1' }

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: existingChannel, error: null })
      )

      const result = await createTourChannel(tour, 'creator-1')

      expect(result.success).toBe(true)
      expect(result.channelId).toBe('channel-1')
    })

    it('should create new channel when none exists', async () => {
      const tour = createMockTour()
      const newChannel = { id: 'new-channel-1' }

      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createMockChain({ data: null, error: null })
        }
        return createMockChain({ data: newChannel, error: null })
      })

      const result = await createTourChannel(tour, 'creator-1')

      expect(result.success).toBe(true)
      expect(result.channelId).toBe('new-channel-1')
    })

    it('should return error when channel creation fails', async () => {
      const tour = createMockTour()

      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createMockChain({ data: null, error: null })
        }
        return createMockChain({ data: null, error: { message: '建立失敗' } })
      })

      const result = await createTourChannel(tour, 'creator-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('建立失敗')
    })
  })

  describe('addMembersToTourChannel', () => {
    it('should return error when channel not found', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: null })
      )

      const result = await addMembersToTourChannel('tour-1', ['emp-1'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('找不到頻道')
    })

    it('should add new members to existing channel', async () => {
      const channel = { id: 'channel-1', workspace_id: 'workspace-1' }

      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Find channel
          return createMockChain({ data: channel, error: null })
        }
        if (callCount === 2) {
          // Check existing members - none exist
          return createMockChain({ data: [], error: null })
        }
        // Insert members
        return createMockChain({ data: {}, error: null })
      })

      const result = await addMembersToTourChannel('tour-1', ['emp-1', 'emp-2'])

      expect(result.success).toBe(true)
    })

    it('should skip already existing members', async () => {
      const channel = { id: 'channel-1', workspace_id: 'workspace-1' }

      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Find channel
          return createMockChain({ data: channel, error: null })
        }
        if (callCount === 2) {
          // All members already exist
          return createMockChain({ data: [{ employee_id: 'emp-1' }], error: null })
        }
        // Should not reach here - no insert needed
        return createMockChain({ data: {}, error: null })
      })

      const result = await addMembersToTourChannel('tour-1', ['emp-1'])

      expect(result.success).toBe(true)
      // Should only call from() twice: once for channel lookup, once for member check
      // No third call for insert since all members exist
      expect(mockFromImplementation).toHaveBeenCalledTimes(2)
    })
  })
})
