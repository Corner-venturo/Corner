/**
 * 自動將訂單的業務和助理加入旅遊團頻道
 * 當訂單建立或更新時，自動將 sales_person 和 assistant 加入對應的旅遊團頻道
 */

import { useEffect, useRef } from 'react'
import { useOrderStore } from '@/stores'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { addChannelMembers } from '@/services/workspace-members'

export function useAutoAddOrderMembers() {
  const { items: orders } = useOrderStore()
  const { channels, currentWorkspace } = useWorkspaceStore()
  const processedOrdersRef = useRef(new Set<string>())

  useEffect(() => {
    if (!currentWorkspace || orders.length === 0 || channels.length === 0) {
      return
    }

    const addOrderMembersToChannels = async () => {
      for (const order of orders) {
        // 跳過已處理的訂單
        if (processedOrdersRef.current.has(order.id)) {
          continue
        }

        // 跳過沒有 tour_id 的訂單
        if (!order.tour_id) {
          continue
        }

        // 找到對應的旅遊團頻道
        const tourChannel = channels.find(ch => ch.tour_id === order.tour_id)
        if (!tourChannel) {
          continue
        }

        // 收集需要加入的成員（sales_person 和 assistant）
        const membersToAdd: string[] = []
        if (order.sales_person) {
          membersToAdd.push(order.sales_person)
        }
        if (order.assistant) {
          membersToAdd.push(order.assistant)
        }

        // 如果沒有成員需要加入，跳過
        if (membersToAdd.length === 0) {
          processedOrdersRef.current.add(order.id)
          continue
        }

        // 加入頻道成員（使用 upsert 防止重複）
        try {
          await addChannelMembers(currentWorkspace.id, tourChannel.id, membersToAdd, 'member')

          // 標記為已處理
          processedOrdersRef.current.add(order.id)
        } catch (error) {
          // 靜默失敗 - 成員可能已存在或權限問題
          console.warn(`Failed to add order members to channel ${tourChannel.id}:`, error)
          // 即使失敗也標記為已處理，避免無限重試
          processedOrdersRef.current.add(order.id)
        }
      }
    }

    void addOrderMembersToChannels()
  }, [orders.length, channels.length, currentWorkspace?.id])
}
