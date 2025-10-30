/**
 * 自動創建公司公告群組和總部辦公室頻道
 * 在 workspace 頁面載入時執行一次
 */

import { useEffect, useRef } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useUserStore } from '@/stores/user-store'
import { supabase } from '@/lib/supabase/client'

export function useAutoCreateCompanyChannel() {
  const { currentWorkspace, channelGroups, channels, loadChannelGroups, loadChannels } =
    useWorkspaceStore()
  const { items: users } = useUserStore()
  const isProcessingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // 防止並發執行和重複初始化
    if (isProcessingRef.current || !currentWorkspace || hasInitializedRef.current) {
      return
    }

    const createCompanyChannel = async () => {
      isProcessingRef.current = true

      try {
        // 1. 檢查是否已存在「公司公告」群組
        const companyGroup = channelGroups.find(g => g.name === '📢 公司公告')

        let groupId: string

        if (!companyGroup) {
          // 創建群組
          const { data: newGroup, error: groupError } = await supabase
            .from('channel_groups')
            .insert({
              workspace_id: currentWorkspace.id,
              name: '📢 公司公告',
              order: -999, // 使用負數確保永遠在最上面
              is_collapsed: false,
            })
            .select()
            .single()

          if (groupError) throw groupError
          groupId = newGroup.id

          // 重新載入群組
          await loadChannelGroups(currentWorkspace.id)
        } else {
          groupId = companyGroup.id
        }

        // 2. 檢查是否已存在「總部辦公室」頻道
        const headquartersChannel = channels.find(c => c.name === '🏢 總部辦公室')

        let channelId: string

        if (!headquartersChannel) {
          // 創建頻道
          const { data: newChannel, error: channelError } = await supabase
            .from('channels')
            .insert({
              workspace_id: currentWorkspace.id,
              name: '🏢 總部辦公室',
              description: '公司重要公告與全體通知',
              type: 'public',
              group_id: groupId,
              is_favorite: true,
              order: 0,
            })
            .select()
            .single()

          if (channelError) throw channelError
          channelId = newChannel.id

          // 重新載入頻道
          await loadChannels(currentWorkspace.id)
        } else {
          channelId = headquartersChannel.id
        }

        // 3. 確保所有員工都在頻道中
        if (users.length > 0) {
          // 批次新增所有員工（ON CONFLICT DO NOTHING 防止重複）
          const membersToAdd = users.map(user => ({
            workspace_id: currentWorkspace.id,
            channel_id: channelId,
            employee_id: user.id,
            role: 'member' as const,
            status: 'active' as const,
          }))

          const { error: membersError } = await supabase
            .from('channel_members')
            .upsert(membersToAdd, {
              onConflict: 'workspace_id,channel_id,employee_id',
              ignoreDuplicates: true,
            })

          if (membersError) {
            // 靜默失敗，可能是權限問題
            console.warn('Failed to add all members to headquarters channel:', membersError)
          }
        }

        // 標記已初始化
        hasInitializedRef.current = true
      } catch (error) {
        // 靜默失敗
        console.error('Failed to create company channel:', error)
      } finally {
        isProcessingRef.current = false
      }
    }

    void createCompanyChannel()
  }, [currentWorkspace?.id])
}
