/**
 * 清理孤立頻道（沒有對應旅遊團的頻道）
 *
 * 新邏輯：
 * - 旅遊團被封存 → 頻道移至「封存」群組
 * - 旅遊團被刪除 → 刪除頻道
 * - 重複頻道 → 保留第一個，刪除其他
 */

import { useEffect } from 'react'
import { useTourStore } from '@/stores'
import { useWorkspaceChannels } from '@/stores/workspace-store'

export function useCleanupOrphanChannels() {
  const { items: tours } = useTourStore()
  const { channels, channelGroups, deleteChannel, updateChannel } = useWorkspaceChannels()

  useEffect(() => {
    // 資料未就緒時靜默返回
    if (!tours || tours.length === 0 || !channels || channels.length === 0 || !channelGroups || channelGroups.length === 0) {
      return
    }

    const cleanupChannels = async () => {
      let movedCount = 0
      let deletedCount = 0

      // 建立旅遊團 ID -> 頻道的對應關係
      const tourChannelMap = new Map<string, string[]>()

      for (const channel of channels) {
        if (channel.tour_id) {
          const existing = tourChannelMap.get(channel.tour_id) || []
          existing.push(channel.id)
          tourChannelMap.set(channel.tour_id, existing)
        }
      }

      // 找到「封存」群組（每個 workspace 應該都有）
      const archivedGroupsByWorkspace = new Map<string, string>()
      channelGroups
        .filter(g => g.system_type === 'archived')
        .forEach(g => archivedGroupsByWorkspace.set(g.workspace_id, g.id))

      for (const channel of channels) {
        // 檢查是否為旅遊團頻道
        if (channel.tour_id) {
          const tour = tours.find(t => t.id === channel.tour_id)
          const channelsForTour = tourChannelMap.get(channel.tour_id) || []

          // 🔥 情境 1：旅遊團不存在（已刪除）→ 刪除頻道
          if (!tour) {
            try {
              await deleteChannel(channel.id)
              deletedCount++
            } catch (error) {
              // Silently fail - channel may not exist
            }
          }
          // 🔥 情境 2：旅遊團已封存 → 移至「封存」群組並標記為已封存
          else if (tour.archived) {
            const archivedGroupId = archivedGroupsByWorkspace.get(channel.workspace_id)

            // 只有當頻道不在封存群組時或未標記為封存時才更新
            if (archivedGroupId && (channel.group_id !== archivedGroupId || !channel.is_archived)) {
              try {
                await updateChannel(channel.id, {
                  group_id: archivedGroupId,
                  is_archived: true,
                  archived_at: new Date().toISOString(),
                })
                movedCount++
              } catch (error) {
                // Silently fail
              }
            }
          }
          // 🔥 情境 3：同一個旅遊團有多個頻道 → 保留第一個，刪除其他
          else if (channelsForTour.length > 1 && channelsForTour[0] !== channel.id) {
            try {
              await deleteChannel(channel.id)
              deletedCount++
            } catch (error) {
              // Silently fail on duplicate channel deletion
            }
          }
        }
      }

      // 完成後的靜默記錄（不顯示給使用者）
      if (movedCount > 0 || deletedCount > 0) {
        // 已移動 ${movedCount} 個頻道至封存，刪除 ${deletedCount} 個頻道
      }
    }

    cleanupChannels()
  }, [tours, channels, channelGroups, deleteChannel, updateChannel])
}
