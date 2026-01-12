import { describe, it, expect, vi, beforeEach } from 'vitest'
import { orderService } from '@/features/orders/services/order.service'
import { ValidationError } from '@/core/errors/app-errors'
import { Order } from '@/types/order.types'

// Mock the order store
const mockItems: Order[] = []
vi.mock('@/stores', () => ({
  useOrderStore: {
    getState: () => ({
      items: mockItems,
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }),
  },
}))

vi.mock('@/data', () => ({
  invalidateOrders: vi.fn(),
}))

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockItems.length = 0
  })

  const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
    id: 'order-1',
    code: 'ORD001',
    tour_id: 'tour-1',
    customer_id: 'customer-1',
    customer_name: '張三',
    total_amount: 50000,
    paid_amount: 0,
    payment_status: 'unpaid',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  describe('validate', () => {
    it('should throw error when tour_id is whitespace only', () => {
      // Access protected method via prototype
      // Note: validation only checks for whitespace-only strings, not empty strings
      const validateFn = (orderService as any).validate.bind(orderService)

      expect(() => validateFn({ tour_id: '  ' })).toThrow(ValidationError)
      expect(() => validateFn({ tour_id: '   ' })).toThrow('必須關聯旅遊團')
    })

    it('should throw error when total_amount is negative', () => {
      const validateFn = (orderService as any).validate.bind(orderService)

      expect(() => validateFn({ total_amount: -100 })).toThrow(ValidationError)
      expect(() => validateFn({ total_amount: -1 })).toThrow('訂單金額不能為負數')
    })

    it('should pass validation for valid data', () => {
      const validateFn = (orderService as any).validate.bind(orderService)

      expect(() => validateFn({ tour_id: 'tour-1', total_amount: 1000 })).not.toThrow()
      expect(() => validateFn({ total_amount: 0 })).not.toThrow()
    })
  })

  describe('getOrdersByTour', () => {
    it('should return orders for a specific tour', () => {
      mockItems.push(
        createMockOrder({ id: 'order-1', tour_id: 'tour-1' }),
        createMockOrder({ id: 'order-2', tour_id: 'tour-1' }),
        createMockOrder({ id: 'order-3', tour_id: 'tour-2' })
      )

      const result = orderService.getOrdersByTour('tour-1')

      expect(result).toHaveLength(2)
      expect(result.every(o => o.tour_id === 'tour-1')).toBe(true)
    })

    it('should return empty array when no orders found', () => {
      const result = orderService.getOrdersByTour('non-existent')

      expect(result).toHaveLength(0)
    })
  })

  describe('getOrdersByStatus', () => {
    it('should return orders with specific payment status', () => {
      mockItems.push(
        createMockOrder({ id: 'order-1', payment_status: 'paid' }),
        createMockOrder({ id: 'order-2', payment_status: 'unpaid' }),
        createMockOrder({ id: 'order-3', payment_status: 'paid' })
      )

      const paidOrders = orderService.getOrdersByStatus('paid')

      expect(paidOrders).toHaveLength(2)
      expect(paidOrders.every(o => o.payment_status === 'paid')).toBe(true)
    })
  })

  describe('getOrdersByCustomer', () => {
    it('should return orders for a specific customer', () => {
      mockItems.push(
        createMockOrder({ id: 'order-1', customer_id: 'customer-1' }),
        createMockOrder({ id: 'order-2', customer_id: 'customer-2' }),
        createMockOrder({ id: 'order-3', customer_id: 'customer-1' })
      )

      const result = orderService.getOrdersByCustomer('customer-1')

      expect(result).toHaveLength(2)
      expect(result.every(o => o.customer_id === 'customer-1')).toBe(true)
    })
  })

  describe('calculateTotalRevenue', () => {
    it('should calculate total revenue from paid orders only', () => {
      mockItems.push(
        createMockOrder({ payment_status: 'paid', total_amount: 10000 }),
        createMockOrder({ payment_status: 'unpaid', total_amount: 20000 }),
        createMockOrder({ payment_status: 'paid', total_amount: 15000 })
      )

      const revenue = orderService.calculateTotalRevenue()

      expect(revenue).toBe(25000) // Only paid orders: 10000 + 15000
    })

    it('should return 0 when no paid orders', () => {
      mockItems.push(
        createMockOrder({ payment_status: 'unpaid', total_amount: 10000 })
      )

      const revenue = orderService.calculateTotalRevenue()

      expect(revenue).toBe(0)
    })
  })

  describe('getPendingOrders', () => {
    it('should return unpaid orders', () => {
      mockItems.push(
        createMockOrder({ id: 'order-1', payment_status: 'unpaid' }),
        createMockOrder({ id: 'order-2', payment_status: 'paid' })
      )

      const pending = orderService.getPendingOrders()

      expect(pending).toHaveLength(1)
      expect(pending[0].id).toBe('order-1')
    })
  })

  describe('getConfirmedOrders', () => {
    it('should return paid orders', () => {
      mockItems.push(
        createMockOrder({ id: 'order-1', payment_status: 'unpaid' }),
        createMockOrder({ id: 'order-2', payment_status: 'paid' })
      )

      const confirmed = orderService.getConfirmedOrders()

      expect(confirmed).toHaveLength(1)
      expect(confirmed[0].id).toBe('order-2')
    })
  })
})
