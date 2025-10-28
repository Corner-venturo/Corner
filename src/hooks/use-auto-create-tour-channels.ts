/**
 * 自動為旅遊團建立工作空間頻道
 * 當新旅遊團建立時，自動建立對應的頻道，並自動加入創建者
 */

import { useEffect, useRef } from 'react';
import { useTourStore } from '@/stores';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { addChannelMembers } from '@/services/workspace-members';

export function useAutoCreateTourChannels() {
  const { items: tours } = useTourStore();
  const { channels, createChannel, currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // 防止並發執行
    if (isProcessingRef.current) {
      return;
    }

    // 資料未就緒時靜默返回
    if (!currentWorkspace || tours.length === 0) {
      return;
    }

    // 檢查每個旅遊團是否有對應的頻道
    const createMissingChannels = async () => {
      isProcessingRef.current = true;

      try {
        for (const tour of tours) {
          // 跳過資料不完整的旅遊團
          if (!tour.code || !tour.name || !tour.id) {
            continue;
          }

          // 跳過已封存的旅遊團
          if (tour.archived) {
            continue;
          }

          // ✅ 關鍵改進：直接檢查 channels 陣列，不使用 ref
          const existingChannel = channels.find(ch => ch.tour_id === tour.id);

          // 如果已經有頻道，跳過
          if (existingChannel) {
            continue;
          }

          // 自動建立頻道
          try {
            const newChannel = await createChannel({
              workspace_id: currentWorkspace.id,
              name: `${tour.code} ${tour.name}`,
              description: `${tour.name} 的工作頻道`,
              type: 'public',
              tour_id: tour.id,
            });

            // 如果有旅遊團的創建者資訊，將創建者加入頻道
            if (newChannel && tour.created_by && user?.id) {
              try {
                // 🔥 修正：User 類型只有 id，沒有 employee_id
                const creatorEmployeeId = tour.created_by === user.id ? user.id : tour.created_by;
                if (creatorEmployeeId) {
                  await addChannelMembers(
                    currentWorkspace.id,
                    newChannel.id,
                    [creatorEmployeeId],
                    'owner'
                  );
                  console.log(`✅ 已將創建者加入頻道: ${tour.code}`);
                }
              } catch (error) {
                console.error(`加入創建者失敗 (${tour.code}):`, error);
              }
            }
          } catch (error) {
            console.error(`建立頻道失敗 (${tour.code}):`, error);
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    createMissingChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours.length, currentWorkspace?.id]);
}
