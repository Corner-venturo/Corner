import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError } from '@/core/errors/app-errors'

// Create mock chain factory for Supabase (thenable)
function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => {
      resolve(resolveValue)
    },
  }
  return chain
}

let mockFromImplementation: ReturnType<typeof vi.fn>

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFromImplementation(table),
  },
}))

vi.mock('@/data', () => ({
  invalidateDisbursementOrders: vi.fn(),
  invalidatePaymentRequests: vi.fn(),
}))

vi.mock('@/lib/workspace-context', () => ({
  getRequiredWorkspaceId: vi.fn(() => 'workspace-1'),
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
import { disbursementOrderService } from '@/features/payments/services/disbursement-order.service'
import { DisbursementOrder } from '@/stores/types'

describe('DisbursementOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromImplementation = vi.fn()
  })

  const createMockOrder = (overrides: Partial<DisbursementOrder> = {}): DisbursementOrder => ({
    id: 'order-1',
    order_number: 'P250116A',
    disbursement_date: '2025-01-16',
    payment_request_ids: ['request-1', 'request-2'],
    amount: 100000,
    status: 'pending',
    workspace_id: 'workspace-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  describe('validate', () => {
    it('should throw error when payment_request_ids is empty', () => {
      const validateFn = (disbursementOrderService as any).validate.bind(disbursementOrderService)

      expect(() => validateFn({ payment_request_ids: [] })).toThrow(ValidationError)
      expect(() => validateFn({ payment_request_ids: [] })).toThrow('出納單必須包含至少一個請款單')
    })

    it('should throw error when amount is negative', () => {
      const validateFn = (disbursementOrderService as any).validate.bind(disbursementOrderService)

      expect(() => validateFn({ amount: -100 })).toThrow(ValidationError)
      expect(() => validateFn({ amount: -1 })).toThrow('總金額不能為負數')
    })

    it('should throw error when disbursement date is not Thursday', () => {
      const validateFn = (disbursementOrderService as any).validate.bind(disbursementOrderService)

      // 2025-01-15 is Wednesday
      expect(() => validateFn({ disbursement_date: '2025-01-15' })).toThrow(ValidationError)
      expect(() => validateFn({ disbursement_date: '2025-01-15' })).toThrow('出納日期必須為週四')
    })

    it('should pass validation for Thursday date', () => {
      const validateFn = (disbursementOrderService as any).validate.bind(disbursementOrderService)

      // 2025-01-16 is Thursday
      expect(() => validateFn({ disbursement_date: '2025-01-16' })).not.toThrow()
    })

    it('should pass validation for valid data', () => {
      const validateFn = (disbursementOrderService as any).validate.bind(disbursementOrderService)

      expect(() => validateFn({ payment_request_ids: ['req-1'], amount: 1000 })).not.toThrow()
      expect(() => validateFn({ amount: 0 })).not.toThrow()
    })
  })

  describe('getNextThursday', () => {
    it('should return a Thursday date', () => {
      const result = disbursementOrderService.getNextThursday()

      // Parse the result and check if it's a Thursday
      const date = new Date(result)
      expect(date.getDay()).toBe(4) // Thursday
    })

    it('should return date in YYYY-MM-DD format', () => {
      const result = disbursementOrderService.getNextThursday()

      // Should match YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getPendingOrdersAsync', () => {
    it('should return pending orders', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1', status: 'pending' }),
        createMockOrder({ id: 'order-2', status: 'pending' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockOrders, error: null })
      )

      const result = await disbursementOrderService.getPendingOrdersAsync()

      expect(result).toEqual(mockOrders)
      expect(mockFromImplementation).toHaveBeenCalledWith('disbursement_orders')
    })

    it('should throw error on database failure', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { message: '資料庫錯誤' } })
      )

      await expect(disbursementOrderService.getPendingOrdersAsync())
        .rejects.toThrow('資料庫錯誤')
    })
  })

  describe('getConfirmedOrdersAsync', () => {
    it('should return confirmed orders', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1', status: 'confirmed' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockOrders, error: null })
      )

      const result = await disbursementOrderService.getConfirmedOrdersAsync()

      expect(result).toEqual(mockOrders)
    })
  })

  describe('getOrdersByDateAsync', () => {
    it('should return orders for a specific date', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1', disbursement_date: '2025-01-16' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockOrders, error: null })
      )

      const result = await disbursementOrderService.getOrdersByDateAsync('2025-01-16')

      expect(result).toEqual(mockOrders)
      expect(result[0].disbursement_date).toBe('2025-01-16')
    })

    it('should return empty array when no orders found', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: [], error: null })
      )

      const result = await disbursementOrderService.getOrdersByDateAsync('2025-12-25')

      expect(result).toEqual([])
    })
  })

  describe('getCurrentWeekOrderAsync', () => {
    it('should return current week pending order', async () => {
      const nextThursday = disbursementOrderService.getNextThursday()
      const mockOrder = createMockOrder({
        id: 'order-1',
        disbursement_date: nextThursday,
        status: 'pending',
      })

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockOrder, error: null })
      )

      const result = await disbursementOrderService.getCurrentWeekOrderAsync()

      expect(result).toEqual(mockOrder)
    })

    it('should return null when no current week order', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { code: 'PGRST116', message: 'not found' } })
      )

      const result = await disbursementOrderService.getCurrentWeekOrderAsync()

      expect(result).toBeNull()
    })
  })
})
