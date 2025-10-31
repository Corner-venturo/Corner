/**
 * Channels Store Facade
 * 整合多個 createStore，提供統一接口
 * 保持與舊版 channels-store 相同的 API
 */

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase/client'
import { useChannelStore } from './channel-store-new'
import { useChannelGroupStore } from './channel-group-store-new'
import { useWorkspaceStoreData } from './workspace-store-new'
import type { Workspace, Bulletin, Channel, ChannelGroup } from './types'

/**
 * 額外狀態 (不需要同步到 Supabase 的 UI 狀態)
 */
interface ChannelsUIState {
  // Bulletins (簡單的前端狀態，不需要createStore)
  bulletins: Bulletin[]

  // UI 選擇狀態
  selectedChannel: Channel | null
  currentChannel: Channel | null
  currentWorkspace: Workspace | null

  // 搜尋與過濾
  searchQuery: string
  channelFilter: 'all' | 'starred' | 'unread' | 'muted'

  // 錯誤狀態
  error: string | null
}

/**
 * UI 狀態 Store (純前端狀態)
 */
const useChannelsUIStore = create<ChannelsUIState & {
  // Bulletin 操作
  createBulletin: (bulletin: Omit<Bulletin, 'id' | 'created_at' | 'updated_at'>) => void
  updateBulletin: (id: string, updates: Partial<Bulletin>) => void
  deleteBulletin: (id: string) => void

  // UI 狀態操作
  setSelectedChannel: (channel: Channel | null) => void
  setCurrentChannel: (channel: Channel | null) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setSearchQuery: (query: string) => void
  setChannelFilter: (filter: 'all' | 'starred' | 'unread' | 'muted') => void
  setError: (error: string | null) => void
  clearError: () => void
}>(set => ({
  bulletins: [],
  selectedChannel: null,
  currentChannel: null,
  currentWorkspace: null,
  searchQuery: '',
  channelFilter: 'all',
  error: null,

  createBulletin: bulletin => {
    const newBulletin: Bulletin = {
      ...bulletin,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set(state => ({ bulletins: [...state.bulletins, newBulletin] }))
  },

  updateBulletin: (id, updates) => {
    set(state => ({
      bulletins: state.bulletins.map(b =>
        b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
      ),
    }))
  },

  deleteBulletin: id => {
    set(state => ({ bulletins: state.bulletins.filter(b => b.id !== id) }))
  },

  setSelectedChannel: channel => set({ selectedChannel: channel }),
  setCurrentChannel: channel => set({ currentChannel: channel }),
  setCurrentWorkspace: workspace => set({ currentWorkspace: workspace }),
  setSearchQuery: query => set({ searchQuery: query }),
  setChannelFilter: filter => set({ channelFilter: filter }),
  setError: error => set({ error }),
  clearError: () => set({ error: null }),
}))

/**
 * Channels Store Facade
 * 整合 Channel, ChannelGroup, Workspace 三個 createStore
 * 保持與舊版相同的 API
 */
export const useChannelsStore = () => {
  // 使用 createStore 的 stores
  const channelStore = useChannelStore()
  const channelGroupStore = useChannelGroupStore()
  const workspaceStore = useWorkspaceStoreData()

  // UI 狀態
  const uiStore = useChannelsUIStore()

  return {
    // ============================================
    // 資料 (來自 createStore)
    // ============================================
    workspaces: workspaceStore.items,
    channels: channelStore.items,
    channelGroups: channelGroupStore.items,

    // ============================================
    // UI 狀態
    // ============================================
    bulletins: uiStore.bulletins,
    selectedChannel: uiStore.selectedChannel,
    currentChannel: uiStore.currentChannel,
    currentWorkspace: uiStore.currentWorkspace,
    searchQuery: uiStore.searchQuery,
    channelFilter: uiStore.channelFilter,

    // ============================================
    // Loading 和 Error
    // ============================================
    loading: channelStore.loading || channelGroupStore.loading || workspaceStore.loading,
    error: uiStore.error || channelStore.error || channelGroupStore.error || workspaceStore.error,

    // ============================================
    // Workspace 操作
    // ============================================
    loadWorkspaces: async () => {
      await workspaceStore.fetchAll()
      // 自動選擇第一個 workspace
      if (workspaceStore.items.length > 0 && !uiStore.currentWorkspace) {
        uiStore.setCurrentWorkspace(workspaceStore.items[0])
      }
    },

    setCurrentWorkspace: uiStore.setCurrentWorkspace,

    // ============================================
    // Bulletin 操作
    // ============================================
    loadBulletins: async (workspaceId?: string) => {
      const currentWorkspaceId = workspaceId || uiStore.currentWorkspace?.id
      if (!currentWorkspaceId) return

      const filtered = uiStore.bulletins.filter(b => b.workspace_id === currentWorkspaceId)
      // Bulletins 已經在 uiStore 中，這裡只是過濾
    },

    createBulletin: uiStore.createBulletin,
    updateBulletin: uiStore.updateBulletin,
    deleteBulletin: uiStore.deleteBulletin,

    // ============================================
    // Channel 操作 (使用 createStore 的方法)
    // ============================================
    loadChannels: async (workspaceId?: string) => {
      await channelStore.fetchAll()
    },

    createChannel: async (channel: Omit<Channel, 'id' | 'created_at'>) => {
      const newChannel: Channel = {
        ...channel,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      }
      await channelStore.create(newChannel)

      // 🔥 自動將創建者加入為頻道擁有者
      if (newChannel.created_by) {
        try {
          await supabase.from('channel_members').insert({
            workspace_id: newChannel.workspace_id,
            channel_id: newChannel.id,
            employee_id: newChannel.created_by,
            role: 'owner',
            status: 'active',
          })
        } catch (error) {
          // 靜默失敗
          console.warn('[Channels] Failed to add channel member:', error)
        }
      }
    },

    updateChannel: async (id: string, updates: Partial<Channel>) => {
      await channelStore.update(id, updates)
    },

    deleteChannel: async (id: string) => {
      await channelStore.delete(id)
      // 如果刪除的是當前選中的頻道，清除選擇
      if (uiStore.selectedChannel?.id === id) {
        uiStore.setSelectedChannel(null)
      }
      if (uiStore.currentChannel?.id === id) {
        uiStore.setCurrentChannel(null)
      }
    },

    toggleChannelFavorite: async (id: string) => {
      const channel = channelStore.items.find(ch => ch.id === id)
      if (!channel) return

      await channelStore.update(id, { is_favorite: !channel.is_favorite })
    },

    selectChannel: async (channel: Channel | null) => {
      uiStore.setSelectedChannel(channel)
      uiStore.setCurrentChannel(channel)
    },

    updateChannelOrder: async (channelId: string, newOrder: number) => {
      await channelStore.update(channelId, { order: newOrder })
    },

    reorderChannels: (channels: Channel[]) => {
      // 批量更新順序 (createStore 會自動處理)
      channels.forEach((channel, index) => {
        channelStore.update(channel.id, { order: index }).catch(() => {
          // 靜默失敗
        })
      })
    },

    // ============================================
    // Channel Group 操作 (使用 createStore 的方法)
    // ============================================
    loadChannelGroups: async (workspaceId?: string) => {
      await channelGroupStore.fetchAll()
    },

    createChannelGroup: async (group: Omit<ChannelGroup, 'id' | 'created_at'>) => {
      const newGroup: ChannelGroup = {
        ...group,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      }
      await channelGroupStore.create(newGroup)
    },

    deleteChannelGroup: async (id: string) => {
      // 先更新該群組下的頻道，將 group_id 設為 null
      const channelsInGroup = channelStore.items.filter(ch => ch.group_id === id)

      // 批量更新頻道
      await Promise.all(
        channelsInGroup.map(channel =>
          channelStore.update(channel.id, { group_id: null })
        )
      )

      // 刪除群組
      await channelGroupStore.delete(id)
    },

    toggleGroupCollapse: async (id: string) => {
      const group = channelGroupStore.items.find(g => g.id === id)
      if (!group) return

      await channelGroupStore.update(id, { is_collapsed: !group.is_collapsed })
    },

    // ============================================
    // 搜尋與過濾
    // ============================================
    setSearchQuery: uiStore.setSearchQuery,
    setChannelFilter: uiStore.setChannelFilter,

    // ============================================
    // Realtime 訂閱 (createStore 自動處理，但保留接口以防舊代碼呼叫)
    // ============================================
    subscribeToChannels: (workspaceId: string) => {
      // createStore 已經自動訂閱，這裡不需要做任何事
      console.log('[Channels Facade] subscribeToChannels called, but createStore handles it automatically')
    },

    unsubscribeFromChannels: () => {
      // createStore 已經自動處理，這裡不需要做任何事
      console.log('[Channels Facade] unsubscribeFromChannels called, but createStore handles it automatically')
    },

    // ============================================
    // 錯誤處理
    // ============================================
    clearError: uiStore.clearError,
  }
}

/**
 * Hook 型別（方便使用）
 */
export type ChannelsStoreType = ReturnType<typeof useChannelsStore>
