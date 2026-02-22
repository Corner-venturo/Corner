import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quoteService } from '@/features/quotes/services/quote.service'
import { ValidationError } from '@/core/errors/app-errors'
import { Quote } from '@/stores/types/quote.types'

// Mock items storage
const mockItems: Quote[] = []
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/stores', () => ({
  useQuoteStore: {
    getState: () => ({
      items: mockItems,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    }),
  },
}))

describe('QuoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockItems.length = 0
  })

  const createMockQuote = (overrides: Partial<Quote> = {}): Quote => ({
    id: 'quote-1',
    code: 'Q000001',
    name: '日本東京5日遊報價',
    customer_name: '張三旅遊',
    quote_type: 'standard',
    status: 'proposed',
    destination: '東京',
    group_size: 20,
    version: 1,
    categories: [
      { id: 'cat-1', name: '機票', items: [], total: 50000 },
      { id: 'cat-2', name: '住宿', items: [], total: 30000 },
    ],
    total_cost: 80000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  describe('validate', () => {
    it('should throw error when name is too short', () => {
      const validateFn = (quoteService as any).validate.bind(quoteService)

      expect(() => validateFn({ name: 'A' })).toThrow(ValidationError)
      expect(() => validateFn({ name: ' ' })).toThrow('報價單標題至少需要 2 個字符')
    })

    it('should throw error when total cost is negative', () => {
      const validateFn = (quoteService as any).validate.bind(quoteService)

      const negativeCategories = [
        { id: 'cat-1', name: '費用', items: [], total: -100 },
      ]

      expect(() => validateFn({ categories: negativeCategories })).toThrow(ValidationError)
      expect(() => validateFn({ categories: negativeCategories })).toThrow('總金額不能為負數')
    })

    it('should pass validation for valid data', () => {
      const validateFn = (quoteService as any).validate.bind(quoteService)

      expect(() => validateFn({ name: '有效報價單' })).not.toThrow()
      expect(() => validateFn({
        categories: [{ id: '1', name: 'test', items: [], total: 1000 }]
      })).not.toThrow()
    })
  })

  describe('duplicateQuote', () => {
    it('should duplicate a quote with new name', async () => {
      const originalQuote = createMockQuote({ id: 'quote-1', name: '原始報價' })
      mockItems.push(originalQuote)

      const duplicatedQuote = { ...originalQuote, id: 'quote-2', name: '原始報價 (副本)' }
      mockCreate.mockResolvedValue(duplicatedQuote)
      mockItems.push(duplicatedQuote)

      const result = await quoteService.duplicateQuote('quote-1')

      expect(mockCreate).toHaveBeenCalled()
      expect(result?.name).toBe('原始報價 (副本)')
      expect(result?.status).toBe('proposed')
    })

    it('should return undefined when quote not found', async () => {
      const result = await quoteService.duplicateQuote('non-existent')

      expect(result).toBeUndefined()
      expect(mockCreate).not.toHaveBeenCalled()
    })
  })

  describe('getQuotesByTour', () => {
    it('should return quotes for a specific tour', () => {
      mockItems.push(
        createMockQuote({ id: 'quote-1', tour_id: 'tour-1' }),
        createMockQuote({ id: 'quote-2', tour_id: 'tour-1' }),
        createMockQuote({ id: 'quote-3', tour_id: 'tour-2' })
      )

      const result = quoteService.getQuotesByTour('tour-1')

      expect(result).toHaveLength(2)
      expect(result.every(q => q.tour_id === 'tour-1')).toBe(true)
    })

    it('should return empty array when no quotes found', () => {
      const result = quoteService.getQuotesByTour('non-existent')

      expect(result).toHaveLength(0)
    })
  })

  describe('getQuotesByStatus', () => {
    it('should return quotes with specific status', () => {
      mockItems.push(
        createMockQuote({ id: 'quote-1', status: 'proposed' }),
        createMockQuote({ id: 'quote-2', status: 'confirmed' }),
        createMockQuote({ id: 'quote-3', status: 'proposed' })
      )

      const proposedQuotes = quoteService.getQuotesByStatus('proposed')

      expect(proposedQuotes).toHaveLength(2)
      expect(proposedQuotes.every(q => q.status === 'proposed')).toBe(true)
    })
  })

  describe('calculateTotalCost', () => {
    it('should calculate total cost from categories', () => {
      const quote = createMockQuote({
        categories: [
          { id: 'cat-1', name: '機票', items: [], total: 30000 },
          { id: 'cat-2', name: '住宿', items: [], total: 25000 },
          { id: 'cat-3', name: '餐費', items: [], total: 15000 },
        ],
      })

      const total = quoteService.calculateTotalCost(quote)

      expect(total).toBe(70000)
    })

    it('should return 0 for empty categories', () => {
      const quote = createMockQuote({ categories: [] })

      const total = quoteService.calculateTotalCost(quote)

      expect(total).toBe(0)
    })

    it('should return 0 for undefined categories', () => {
      const quote = createMockQuote({ categories: undefined })

      const total = quoteService.calculateTotalCost(quote)

      expect(total).toBe(0)
    })
  })
})
