/**
 * 自動將所有員工加入簽證頻道
 * 簽證頻道是特殊頻道，所有員工都應該能看到
 */

import { useEffect, useRef } from 'react';
import { useEmployeeStore } from '@/stores';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { addChannelMembers, fetchChannelMembers } from '@/services/workspace-members';

// UUID 驗證正則
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function useAutoAddVisaMembers() {
  const { items: employees } = useEmployeeStore();
  const { channels, currentWorkspace } = useWorkspaceStore();
  const processedRef = useRef(false);

  useEffect(() => {
    if (!currentWorkspace || employees.length === 0 || channels.length === 0) {
      return;
    }

    if (processedRef.current) {
      return;
    }

    // 跳過假資料（不是有效的 UUID）
    if (!isValidUUID(currentWorkspace.id)) {
      console.log('⚠️ [簽證頻道] 跳過自動加入成員（使用假資料）');
      return;
    }

    const addVisaMembers = async () => {
      // 找到簽證頻道（名稱包含「簽證」）
      const visaChannels = channels.filter(ch =>
        ch.name.includes('簽證') || ch.name.toLowerCase().includes('visa')
      );

      if (visaChannels.length === 0) {
        console.log('📋 未找到簽證頻道');
        return;
      }

      for (const channel of visaChannels) {
        try {
          // 取得現有成員
          const existingMembers = await fetchChannelMembers(currentWorkspace.id, channel.id);
          const existingMemberIds = new Set(existingMembers.map(m => m.employeeId));

          // 找出尚未加入的員工
          const activeEmployees = employees.filter(e => e.is_active);
          const newMemberIds = activeEmployees
            .filter(e => !existingMemberIds.has(e.id))
            .map(e => e.id);

          if (newMemberIds.length > 0) {
            await addChannelMembers(
              currentWorkspace.id,
              channel.id,
              newMemberIds,
              'member'
            );
            console.log(`✅ 已將 ${newMemberIds.length} 位員工加入簽證頻道: ${channel.name}`);
          } else {
            console.log(`✓ 簽證頻道 ${channel.name} 所有員工已加入`);
          }
        } catch (error) {
          console.error(`❌ 加入簽證頻道成員失敗 (${channel.name}):`, error);
        }
      }

      processedRef.current = true;
    };

    addVisaMembers();
  }, [channels, employees, currentWorkspace]);
}
