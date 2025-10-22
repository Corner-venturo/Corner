/**
 * 自動為旅遊團建立工作空間頻道
 * 當新旅遊團建立時，自動建立對應的頻道
 */

import { useEffect, useRef } from 'react';
import { useTourStore } from '@/stores';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function useAutoCreateTourChannels() {
  const { items: tours } = useTourStore();
  const { channels, createChannel, currentWorkspace } = useWorkspaceStore();
  const processedTourIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 🐛 Debug: 顯示所有狀態
    console.log('🔍 Hook狀態:', {
      currentWorkspace: currentWorkspace?.name,
      toursCount: tours.length,
      channelsCount: channels.length,
      tours: tours.map(t => ({ id: t.id, name: t.name, code: t.code, archived: t.archived })),
      channels: channels.map(c => ({ id: c.id, name: c.name, tour_id: c.tour_id })),
      processedTourIds: Array.from(processedTourIdsRef.current)
    });

    // 資料未就緒時靜默返回
    if (!currentWorkspace || tours.length === 0) {
      console.log('⚠️ 資料未就緒，跳過頻道建立');
      return;
    }

    // 🔧 修正：檢查是否有旅遊團被標記為已處理，但實際上沒有對應的頻道
    // 這種情況可能發生在 Hot Reload 或頻道被手動刪除時
    for (const tourId of processedTourIdsRef.current) {
      const hasChannel = channels.some(ch => ch.tour_id === tourId);
      if (!hasChannel) {
        console.log(`🔄 發現孤立的已處理標記 (tour_id=${tourId})，清除標記`);
        processedTourIdsRef.current.delete(tourId);
      }
    }

    console.log(`📊 檢查 ${tours.length} 個旅遊團的頻道...`);

    // 檢查每個旅遊團是否有對應的頻道
    const createMissingChannels = async () => {
      let createdCount = 0;
      let skippedCount = 0;

      for (const tour of tours) {
        console.log(`🔍 檢查旅遊團: ${tour.code} (ID: ${tour.id})`);

        // 跳過資料不完整的旅遊團
        if (!tour.code || !tour.name || !tour.id) {
          console.log(`  ⏭️ 跳過：資料不完整 (code=${tour.code}, name=${tour.name})`);
          skippedCount++;
          continue;
        }

        // 跳過已封存的旅遊團
        if (tour.archived) {
          console.log(`  ⏭️ 跳過：已封存`);
          skippedCount++;
          continue;
        }

        // 如果這個旅遊團已經處理過，跳過
        if (processedTourIdsRef.current.has(tour.id)) {
          console.log(`  ⏭️ 跳過：已處理過 (processedTourIds包含此ID)`);
          skippedCount++;
          continue;
        }

        // 檢查是否已經有這個旅遊團的頻道
        const existingChannel = channels.find(ch => ch.tour_id === tour.id);
        console.log(`  🔎 尋找現有頻道 (tour_id=${tour.id}):`, existingChannel ? `找到 ${existingChannel.name}` : '未找到');

        if (existingChannel) {
          // 標記為已處理（已有頻道）
          processedTourIdsRef.current.add(tour.id);
          console.log(`  ✓ 已有頻道，標記為已處理`);
          skippedCount++;
        } else {
          // 自動建立頻道
          console.log(`  🔨 準備建立新頻道...`);
          try {
            await createChannel({
              workspace_id: currentWorkspace.id,
              name: `${tour.code} ${tour.name}`,
              description: `${tour.name} 的工作頻道`,
              type: 'public',
              tour_id: tour.id,
            });
            // 標記為已處理（已建立頻道）
            processedTourIdsRef.current.add(tour.id);
            createdCount++;
            console.log(`  ✅ 建立頻道成功: ${tour.code} - ${tour.name}`);
          } catch (error) {
            console.error(`  ❌ 建立頻道失敗 (${tour.code}):`, error);
          }
        }
      }

      if (createdCount > 0) {
        console.log(`🎉 建立 ${createdCount} 個新頻道 (跳過 ${skippedCount} 個)`);
      } else if (skippedCount > 0) {
        console.log(`✓ 所有旅遊團都已處理 (共 ${skippedCount} 個)`);
      }
    };

    createMissingChannels();
  }, [tours, channels, createChannel, currentWorkspace]);
}
