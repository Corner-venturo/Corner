import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Import after mocking
import { fastMoveService } from '@/services/fastmove.service'
import type { FastMoveProduct, FastMoveOrderRequest, FastMoveOrderDetail } from '@/types/esim.types'

describe('FastMoveService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockProduct: FastMoveProduct = {
    id: 'product-1',
    name: 'Japan eSIM 7 Days',
    description: '日本7天無限流量',
    price: 299,
    currency: 'TWD',
    country: 'Japan',
    data_allowance: 'unlimited',
    validity_days: 7,
  }

  const mockOrderDetail: FastMoveOrderDetail = {
    id: 'order-1',
    status: 'pending',
    product_id: 'product-1',
    quantity: 2,
    total_amount: 598,
    created_at: new Date().toISOString(),
  }

  describe('getProducts', () => {
    it('should return products on success', async () => {
      const mockProducts = [mockProduct]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts }),
      })

      const result = await fastMoveService.getProducts()

      expect(result).toEqual(mockProducts)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should return empty array when products is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const result = await fastMoveService.getProducts()

      expect(result).toEqual([])
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      await expect(fastMoveService.getProducts())
        .rejects.toThrow('FastMove API Error: Internal Server Error')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))

      await expect(fastMoveService.getProducts())
        .rejects.toThrow('Network Error')
    })
  })

  describe('createOrder', () => {
    it('should create order on success', async () => {
      const orderRequest: FastMoveOrderRequest = {
        product_id: 'product-1',
        quantity: 2,
        customer_email: 'test@example.com',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderDetail,
      })

      const result = await fastMoveService.createOrder(orderRequest)

      expect(result).toEqual(mockOrderDetail)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(orderRequest),
        })
      )
    })

    it('should throw error on API failure', async () => {
      const orderRequest: FastMoveOrderRequest = {
        product_id: 'product-1',
        quantity: 2,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      })

      await expect(fastMoveService.createOrder(orderRequest))
        .rejects.toThrow('FastMove API Error: Bad Request')
    })
  })

  describe('getOrderStatus', () => {
    it('should return order status on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderDetail,
      })

      const result = await fastMoveService.getOrderStatus('order-1')

      expect(result).toEqual(mockOrderDetail)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/order-1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(fastMoveService.getOrderStatus('invalid-id'))
        .rejects.toThrow('FastMove API Error: Not Found')
    })

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection Timeout'))

      await expect(fastMoveService.getOrderStatus('order-1'))
        .rejects.toThrow('Connection Timeout')
    })
  })
})
