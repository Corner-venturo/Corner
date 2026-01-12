import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError } from '@/core/errors/app-errors'

// Create mock chain factory for Supabase
// The chain needs to be "thenable" so await works without .single()
function createMockChain(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    eq: vi.fn().mockReturnThis(),
    // Make the chain thenable - so await works without .single()
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
  invalidatePaymentRequests: vi.fn(),
  invalidatePaymentRequestItems: vi.fn(),
}))

vi.mock('@/lib/workspace-context', () => ({
  getRequiredWorkspaceId: vi.fn(() => 'workspace-1'),
}))

vi.mock('@/services/voucher-auto-generator', () => ({
  generateVoucherFromPaymentRequest: vi.fn(),
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
import { paymentRequestService } from '@/features/payments/services/payment-request.service'
import { PaymentRequest } from '@/stores/types'

describe('PaymentRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromImplementation = vi.fn()
  })

  const createMockRequest = (overrides: Partial<PaymentRequest> = {}): PaymentRequest => ({
    id: 'request-1',
    code: 'TYO241218A-R01',
    request_number: 'TYO241218A-R01',
    tour_id: 'tour-1',
    request_date: '2024-12-19',
    request_type: '代收代付',
    amount: 50000,
    status: 'pending',
    workspace_id: 'workspace-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  describe('validate', () => {
    it('should throw error when tour_id is whitespace only', () => {
      const validateFn = (paymentRequestService as any).validate.bind(paymentRequestService)

      // Validation checks: tour_id && !tour_id.trim()
      // This means whitespace-only strings throw, but empty strings don't
      expect(() => validateFn({ tour_id: '  ' })).toThrow(ValidationError)
      expect(() => validateFn({ tour_id: '   ' })).toThrow('必須關聯旅遊團')
    })

    it('should throw error when amount is negative', () => {
      const validateFn = (paymentRequestService as any).validate.bind(paymentRequestService)

      expect(() => validateFn({ amount: -100 })).toThrow(ValidationError)
      expect(() => validateFn({ amount: -1 })).toThrow('總金額不能為負數')
    })

    it('should throw error when request date is not Thursday', () => {
      const validateFn = (paymentRequestService as any).validate.bind(paymentRequestService)

      // 2024-12-18 is Wednesday
      expect(() => validateFn({ created_at: '2024-12-18' })).toThrow(ValidationError)
      expect(() => validateFn({ created_at: '2024-12-18' })).toThrow('請款日期必須為週四')
    })

    it('should pass validation for Thursday date', () => {
      const validateFn = (paymentRequestService as any).validate.bind(paymentRequestService)

      // 2024-12-19 is Thursday
      expect(() => validateFn({ created_at: '2024-12-19' })).not.toThrow()
    })

    it('should pass validation for valid data', () => {
      const validateFn = (paymentRequestService as any).validate.bind(paymentRequestService)

      expect(() => validateFn({ tour_id: 'tour-1', amount: 1000 })).not.toThrow()
      expect(() => validateFn({ amount: 0 })).not.toThrow()
    })
  })

  describe('getItemsByRequestIdAsync', () => {
    it('should return items for a request', async () => {
      const mockItems = [
        { id: 'item-1', request_id: 'request-1', description: '機票' },
        { id: 'item-2', request_id: 'request-1', description: '住宿' },
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockItems, error: null })
      )

      const result = await paymentRequestService.getItemsByRequestIdAsync('request-1')

      expect(result).toEqual(mockItems)
      expect(mockFromImplementation).toHaveBeenCalledWith('payment_request_items')
    })

    it('should throw error on database failure', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: null, error: { message: '資料庫錯誤' } })
      )

      await expect(paymentRequestService.getItemsByRequestIdAsync('request-1'))
        .rejects.toThrow()
    })
  })

  describe('getPendingRequests', () => {
    it('should return pending requests', async () => {
      const mockRequests = [
        createMockRequest({ id: 'request-1', status: 'pending' }),
        createMockRequest({ id: 'request-2', status: 'pending' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockRequests, error: null })
      )

      const result = await paymentRequestService.getPendingRequests()

      expect(result).toEqual(mockRequests)
      expect(mockFromImplementation).toHaveBeenCalledWith('payment_requests')
    })
  })

  describe('getProcessingRequests', () => {
    it('should return processing requests', async () => {
      const mockRequests = [
        createMockRequest({ id: 'request-1', status: 'processing' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockRequests, error: null })
      )

      const result = await paymentRequestService.getProcessingRequests()

      expect(result).toEqual(mockRequests)
    })
  })

  describe('getRequestsByTour', () => {
    it('should return requests for a specific tour', async () => {
      const mockRequests = [
        createMockRequest({ id: 'request-1', tour_id: 'tour-1' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockRequests, error: null })
      )

      const result = await paymentRequestService.getRequestsByTour('tour-1')

      expect(result).toEqual(mockRequests)
      expect(result[0].tour_id).toBe('tour-1')
    })

    it('should return empty array when no requests found', async () => {
      mockFromImplementation.mockReturnValue(
        createMockChain({ data: [], error: null })
      )

      const result = await paymentRequestService.getRequestsByTour('non-existent')

      expect(result).toEqual([])
    })
  })

  describe('getRequestsByOrder', () => {
    it('should return requests for a specific order', async () => {
      const mockRequests = [
        createMockRequest({ id: 'request-1', order_id: 'order-1' }),
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockRequests, error: null })
      )

      const result = await paymentRequestService.getRequestsByOrder('order-1')

      expect(result).toEqual(mockRequests)
    })
  })

  describe('getItemsByCategory', () => {
    it('should return items filtered by category', async () => {
      const mockItems = [
        { id: 'item-1', request_id: 'request-1', category: 'transportation' },
      ]

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockItems, error: null })
      )

      const result = await paymentRequestService.getItemsByCategory('request-1', 'transportation')

      expect(result).toEqual(mockItems)
    })
  })

  describe('createFromQuote', () => {
    it('should create a payment request from quote data', async () => {
      const mockCreatedRequest = createMockRequest({
        tour_id: 'tour-1',
        code: 'TYO241219A-R01',
        request_type: '從報價單自動生成',
      })

      mockFromImplementation.mockReturnValue(
        createMockChain({ data: mockCreatedRequest, error: null })
      )

      const result = await paymentRequestService.createFromQuote(
        'tour-1',
        'quote-1',
        '2024-12-19',
        'Tokyo Tour',
        'TYO241219A-R01'
      )

      expect(result).toBeDefined()
      expect(mockFromImplementation).toHaveBeenCalledWith('payment_requests')
    })
  })
})
