import type { FastMoveProduct, FastMoveOrderRequest, FastMoveOrderDetail } from '@/types/esim.types'

const FASTMOVE_API_BASE = process.env.NEXT_PUBLIC_FASTMOVE_API_URL || 'https://api.fastmove.com'
const FASTMOVE_API_KEY = process.env.NEXT_PUBLIC_FASTMOVE_API_KEY || ''

/**
 * FastMove API Service
 * 用於網卡產品查詢和訂單管理
 */
class FastMoveService {
  /**
   * 獲取產品列表
   */
  async getProducts(): Promise<FastMoveProduct[]> {
    try {
      const response = await fetch(`${FASTMOVE_API_BASE}/products`, {
        headers: {
          Authorization: `Bearer ${FASTMOVE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`FastMove API Error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error('Failed to fetch FastMove products:', error)
      throw error
    }
  }

  /**
   * 創建訂單
   */
  async createOrder(orderData: FastMoveOrderRequest): Promise<FastMoveOrderDetail> {
    try {
      const response = await fetch(`${FASTMOVE_API_BASE}/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FASTMOVE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error(`FastMove API Error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to create FastMove order:', error)
      throw error
    }
  }

  /**
   * 查詢訂單狀態
   */
  async getOrderStatus(orderId: string): Promise<FastMoveOrderDetail> {
    try {
      const response = await fetch(`${FASTMOVE_API_BASE}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${FASTMOVE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`FastMove API Error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch FastMove order status:', error)
      throw error
    }
  }
}

export const fastMoveService = new FastMoveService()
