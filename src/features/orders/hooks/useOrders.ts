'use client'

import { useOrderStore } from '@/stores'
import { orderService } from '../services/order.service'
import { addMembersToTourChannel } from '@/features/tours/services/tour-channel.service'
import { Order } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

export const useOrders = () => {
  const store = useOrderStore()

  return {
    // ========== 資料 ==========
    orders: store.items,

    // ========== CRUD 操作 ==========
    /**
     * 建立訂單並自動將業務和助理加入旅遊團頻道
     */
    createOrder: async (data: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
      const newOrder = await store.create(data as Parameters<typeof store.create>[0])

      // 自動將業務和助理加入旅遊團頻道（背景執行）
      if (newOrder && newOrder.tour_id) {
        const membersToAdd: string[] = []

        // 加入業務
        if (newOrder.sales_person) {
          membersToAdd.push(newOrder.sales_person)
        }

        // 加入助理
        if (newOrder.assistant) {
          membersToAdd.push(newOrder.assistant)
        }

        if (membersToAdd.length > 0) {
          // 背景執行，不阻塞
          addMembersToTourChannel(newOrder.tour_id, membersToAdd, 'member')
            .then(result => {
              if (result.success) {
                logger.log(`[useOrders] 已將業務/助理加入頻道: ${membersToAdd.join(', ')}`)
              } else {
                logger.warn(`[useOrders] 加入頻道失敗: ${result.error}`)
              }
            })
            .catch(error => {
              logger.error('[useOrders] 加入頻道時發生錯誤:', error)
            })
        }
      }

      return newOrder
    },

    updateOrder: async (id: string, data: Partial<Order>) => {
      return await store.update(id, data)
    },

    deleteOrder: async (id: string) => {
      return await store.delete(id)
    },

    loadOrders: async () => {
      return await store.fetchAll()
    },

    // ========== 業務方法 ==========
    getOrdersByTour: (tour_id: string) => {
      return orderService.getOrdersByTour(tour_id)
    },

    getOrdersByStatus: (status: 'unpaid' | 'partial' | 'paid') => {
      return orderService.getOrdersByStatus(status)
    },

    getOrdersByCustomer: (customer_id: string) => {
      return orderService.getOrdersByCustomer(customer_id)
    },

    calculateTotalRevenue: () => {
      return orderService.calculateTotalRevenue()
    },

    getPendingOrders: () => {
      return orderService.getPendingOrders()
    },

    getConfirmedOrders: () => {
      return orderService.getConfirmedOrders()
    },
  }
}
