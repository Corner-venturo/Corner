/**
 * 自動將所有員工加入簽證頻道
 * 簽證頻道是特殊頻道，所有員工都應該能看到
 */

import { useEffect, useRef } from 'react'
import { useEmployeeStore } from '@/stores'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { addChannelMembers, fetchChannelMembers } from '@/services/workspace-members'

// UUID 驗證正則
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

export function useAutoAddVisaMembers() {
  const { items: employees } = useEmployeeStore()
  const { channels, currentWorkspace } = useWorkspaceStore()
  const processedChannelsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!currentWorkspace || employees.length === 0 || channels.length === 0) {
      return
    }

    // 跳過假資料（不是有效的 UUID）
    if (!isValidUUID(currentWorkspace.id)) {
      return
    }

    const addVisaMembers = async () => {
      // 🔥 確保 processedChannelsRef.current 是 Set（防止序列化問題）
      if (!(processedChannelsRef.current instanceof Set)) {
        processedChannelsRef.current = new Set()
      }

      // 找到簽證頻道（名稱包含「簽證」）
      const visaChannels = channels.filter(
        ch => ch.name.includes('簽證') || ch.name.toLowerCase().includes('visa')
      )

      if (visaChannels.length === 0) {
        return
      }

      for (const channel of visaChannels) {
        // 跳過已處理過的頻道
        if (processedChannelsRef.current.has(channel.id)) {
          continue
        }

        // 驗證頻道 ID 是否為有效的 UUID
        if (!isValidUUID(channel.id)) {
          processedChannelsRef.current.add(channel.id)
          continue
        }

        try {
          // 取得現有成員（這會驗證頻道是否存在於資料庫）
          const existingMembers = await fetchChannelMembers(currentWorkspace.id, channel.id)
          const existingMemberIds = new Set(existingMembers.map(m => m.employeeId))

          // 找出尚未加入的員工
          const activeEmployees = employees.filter(e => e.is_active)
          const newMemberIds = activeEmployees
            .filter(e => !existingMemberIds.has(e.id))
            .map(e => e.id)

          if (newMemberIds.length > 0) {
            await addChannelMembers(currentWorkspace.id, channel.id, newMemberIds, 'member')
          } else {
          }

          // 標記該頻道已處理
          processedChannelsRef.current.add(channel.id)
        } catch (error) {
          // Silently fail - visa members may already be added
          processedChannelsRef.current.add(channel.id)
        }
      }
    }

    addVisaMembers()
  }, [channels.length, employees.length, currentWorkspace?.id])
}
