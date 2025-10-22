/**
 * 清理孤立頻道（沒有對應旅遊團的頻道）
 */

import { useEffect } from 'react';
import { useTourStore } from '@/stores';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function useCleanupOrphanChannels() {
  const { items: tours } = useTourStore();
  const { channels, deleteChannel } = useWorkspaceStore();

  useEffect(() => {
    // 資料未就緒時靜默返回
    if (tours.length === 0 || channels.length === 0) {
      return;
    }

    const cleanupChannels = async () => {
      let deletedCount = 0;

      // 建立旅遊團 ID -> 頻道的對應關係
      const tourChannelMap = new Map<string, string[]>();

      for (const channel of channels) {
        if (channel.tour_id) {
          const existing = tourChannelMap.get(channel.tour_id) || [];
          existing.push(channel.id);
          tourChannelMap.set(channel.tour_id, existing);
        }
      }

      console.log(`📊 頻道檢查：${channels.length} 個頻道，${tourChannelMap.size} 個旅遊團有頻道`);

      for (const channel of channels) {
        // 檢查是否為旅遊團頻道
        if (channel.tour_id) {
          const tour = tours.find(t => t.id === channel.tour_id);
          const channelsForTour = tourChannelMap.get(channel.tour_id) || [];

          // 刪除頻道的條件：
          // 1. 旅遊團不存在（已刪除）
          // 2. 旅遊團已封存
          // 3. 同一個旅遊團有多個頻道（保留第一個，刪除其他）
          if (!tour || tour.archived) {
            try {
              const reason = !tour ? '旅遊團已刪除' : '旅遊團已封存';
              console.log(`🗑️ 刪除頻道: ${channel.name} (${reason})`);
              await deleteChannel(channel.id);
              deletedCount++;
            } catch (error) {
              console.error(`❌ 刪除頻道失敗 (${channel.name}):`, error);
            }
          } else if (channelsForTour.length > 1 && channelsForTour[0] !== channel.id) {
            // 重複頻道，只保留第一個
            try {
              console.log(`🗑️ 刪除重複頻道: ${channel.name} (重複)`);
              await deleteChannel(channel.id);
              deletedCount++;
            } catch (error) {
              console.error(`❌ 刪除頻道失敗 (${channel.name}):`, error);
            }
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ 清理完成：刪除 ${deletedCount} 個頻道`);
      } else {
        console.log(`✓ 頻道狀態正常`);
      }
    };

    cleanupChannels();
  }, [tours, channels, deleteChannel]);
}
