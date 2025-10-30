// Channels and workspace management store with Realtime support
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { localDB } from '@/lib/db';
import { realtimeManager } from '@/lib/realtime';
import type { Workspace, Bulletin, Channel, ChannelGroup } from './types';

interface ChannelsState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  bulletins: Bulletin[];
  channels: Channel[];
  channelGroups: ChannelGroup[];
  selectedChannel: Channel | null;
  currentChannel: Channel | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  channelFilter: 'all' | 'starred' | 'unread' | 'muted';

  // Workspace operations
  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;

  // Bulletin operations
  loadBulletins: (workspaceId?: string) => Promise<void>;
  createBulletin: (bulletin: Omit<Bulletin, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBulletin: (id: string, updates: Partial<Bulletin>) => Promise<void>;
  deleteBulletin: (id: string) => Promise<void>;

  // Channel operations
  loadChannels: (workspaceId?: string) => Promise<void>;
  createChannel: (channel: Omit<Channel, 'id' | 'created_at'>) => Promise<void>;
  updateChannel: (id: string, updates: Partial<Channel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  toggleChannelFavorite: (id: string) => void;
  selectChannel: (channel: Channel | null) => Promise<void>;
  updateChannelOrder: (channelId: string, newOrder: number) => Promise<void>;
  reorderChannels: (channels: Channel[]) => void;

  // Channel group operations
  loadChannelGroups: (workspaceId?: string) => Promise<void>;
  createChannelGroup: (group: Omit<ChannelGroup, 'id' | 'created_at'>) => void;
  toggleGroupCollapse: (id: string) => void;

  // Filter and search
  setSearchQuery: (query: string) => void;
  setChannelFilter: (filter: 'all' | 'starred' | 'unread' | 'muted') => void;

  // Realtime operations
  subscribeToChannels: (workspaceId: string) => void;
  unsubscribeFromChannels: () => void;

  // Error handling
  clearError: () => void;
}

// 🔥 移除 persist - 不再持久化 channels 資料
export const useChannelsStore = create<ChannelsState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  bulletins: [],
  channels: [],
  channelGroups: [],
  selectedChannel: null,
  currentChannel: null,
  loading: false,
  error: null,
  searchQuery: '',
  channelFilter: 'all',

  loadWorkspaces: async () => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    set({ loading: true });

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) throw error;

        set({
          workspaces: data || [],
          currentWorkspace: data?.[0] || null,
          loading: false
        });
      } else {
        const data: Workspace[] = [
          {
            id: 'workspace-001',
            name: '總部辦公室',
            description: 'Venturo 總部工作空間',
            icon: '🏢',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        set({
          workspaces: data,
          currentWorkspace: data[0] || null,
          loading: false
        });
      }
    } catch (error) {
      const data: Workspace[] = [
        {
          id: 'workspace-001',
          name: '總部辦公室',
          description: 'Venturo 總部工作空間',
          icon: '🏢',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      set({
        workspaces: data,
        currentWorkspace: data[0] || null,
        loading: false
      });
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  loadBulletins: async (workspaceId) => {
    const currentWorkspaceId = workspaceId || get().currentWorkspace?.id;
    if (!currentWorkspaceId) {
      set({ loading: false });
      return;
    }

    set({ loading: true });

    const allBulletins = get().bulletins;
    const filtered = allBulletins.filter(b => b.workspace_id === currentWorkspaceId);

    set({ bulletins: filtered, loading: false });
  },

  createBulletin: async (bulletin) => {
    const newBulletin: Bulletin = {
      ...bulletin,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set(state => ({
      bulletins: [...state.bulletins, newBulletin]
    }));
  },

  updateBulletin: async (id, updates) => {
    set(state => ({
      bulletins: state.bulletins.map(b =>
        b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
      )
    }));
  },

  deleteBulletin: async (id) => {
    set(state => ({
      bulletins: state.bulletins.filter(b => b.id !== id)
    }));
  },

  // 🔥 改造後的 loadChannels - 移除 setTimeout，即時同步
  loadChannels: async (workspaceId) => {
    const currentWorkspaceId = workspaceId || get().currentWorkspace?.id;
    if (!currentWorkspaceId) {
      set({ loading: false });
      return;
    }

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
    set({ loading: true });

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        // ✅ 直接從 Supabase 查詢（不延遲）
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('workspace_id', currentWorkspaceId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const freshChannels = data || [];

        // ✅ 同步到 IndexedDB（僅作為離線備份）
        for (const channel of freshChannels) {
          await localDB.put('channels', channel);
        }

        set({ channels: freshChannels, loading: false });
      } else {
        // 離線模式：從 IndexedDB 載入
        const cachedChannels = (await localDB.getAll('channels') as Channel[])
          .filter(ch => ch.workspace_id === currentWorkspaceId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        set({ channels: cachedChannels, loading: false });
      }
    } catch (error) {
      // 錯誤時從 IndexedDB 載入
      try {
        const cachedChannels = (await localDB.getAll('channels') as Channel[])
          .filter(ch => ch.workspace_id === currentWorkspaceId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        set({ channels: cachedChannels, loading: false });
      } catch (cacheError) {
        set({ loading: false, error: 'Failed to load channels' });
      }
    }
  },

  // ✅ 訂閱 Realtime 變更
  subscribeToChannels: (workspaceId) => {
    realtimeManager.subscribe<Channel>({
      table: 'channels',
      filter: `workspace_id=eq.${workspaceId}`,
      subscriptionId: `channels-${workspaceId}`,
      handlers: {
        onInsert: (channel) => {
          set(state => {
            // 防止重複
            const exists = state.channels.some(ch => ch.id === channel.id);
            if (exists) return state;

            return {
              channels: [...state.channels, channel]
            };
          });

          // 同步到 IndexedDB
          localDB.put('channels', channel).catch(() => {
            // 靜默失敗
          });
        },

        onUpdate: (channel) => {
          set(state => ({
            channels: state.channels.map(ch =>
              ch.id === channel.id ? channel : ch
            )
          }));

          // 同步到 IndexedDB
          localDB.put('channels', channel).catch(() => {
            // 靜默失敗
          });
        },

        onDelete: (oldChannel) => {
          set(state => ({
            channels: state.channels.filter(ch => ch.id !== oldChannel.id),
            // 如果刪除的是當前選中的頻道，清除選擇
            selectedChannel: state.selectedChannel?.id === oldChannel.id
              ? null
              : state.selectedChannel,
            currentChannel: state.currentChannel?.id === oldChannel.id
              ? null
              : state.currentChannel,
          }));

          // 從 IndexedDB 刪除
          localDB.delete('channels', oldChannel.id).catch(() => {
            // 靜默失敗
          });
        },
      },
    });
  },

  // ✅ 取消訂閱
  unsubscribeFromChannels: () => {
    const workspaceId = get().currentWorkspace?.id;
    if (workspaceId) {
      realtimeManager.unsubscribe(`channels-${workspaceId}`);
    }
  },

  createChannel: async (channel) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    const newChannel: Channel = {
      ...channel,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { error } = await supabase
          .from('channels')
          .insert({
            id: newChannel.id,
            workspace_id: newChannel.workspace_id,
            name: newChannel.name,
            description: newChannel.description,
            type: newChannel.type,
            group_id: newChannel.group_id,
            tour_id: newChannel.tour_id,
            is_favorite: newChannel.is_favorite || false,
            created_by: newChannel.created_by,
            created_at: newChannel.created_at
          });

        if (error) throw error;

        // 🔥 自動將創建者加入為頻道擁有者
        if (newChannel.created_by) {
          try {
            const { error: memberError } = await supabase
              .from('channel_members')
              .insert({
                workspace_id: newChannel.workspace_id,
                channel_id: newChannel.id,
                employee_id: newChannel.created_by,
                role: 'owner',
                status: 'active'
              });

            if (memberError) {
              // 靜默失敗
            }
          } catch (memberError) {
            // 靜默失敗
          }
        }
      }
    } catch (error) {
      // Supabase insert failed - add to local state only
    }

    // ✅ Realtime 會自動觸發 onInsert，不需要手動更新狀態
    // 但為了離線模式，還是要同步到 IndexedDB
    await localDB.put('channels', newChannel);
  },

  updateChannel: async (id, updates) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    const currentChannel = get().channels.find(ch => ch.id === id);
    if (!currentChannel) {
      return;
    }

    const updatedChannel = { ...currentChannel, ...updates };

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { error } = await supabase
          .from('channels')
          .update(updates)
          .eq('id', id)
          .select();

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      // Supabase update failed - local state will still be updated by Realtime
    }

    // ✅ Realtime 會自動觸發 onUpdate
    // 離線模式更新 IndexedDB
    try {
      await localDB.put('channels', updatedChannel);
    } catch (error) {
      // 靜默失敗
    }
  },

  deleteChannel: async (id) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { error } = await supabase
          .from('channels')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
    } catch (error) {
      // 靜默失敗
    }

    // ✅ Realtime 會自動觸發 onDelete，不需要手動更新狀態
  },

  toggleChannelFavorite: async (id) => {
    const channel = get().channels.find(ch => ch.id === id);
    if (!channel) {
      return;
    }

    const newFavoriteStatus = !channel.is_favorite;
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    const updatedChannel = { ...channel, is_favorite: newFavoriteStatus };

    // 先立即更新本地狀態
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id === id ? updatedChannel : ch
      )
    }));

    // 更新到 IndexedDB
    try {
      await localDB.put('channels', updatedChannel);
    } catch (error) {
      // 靜默失敗
    }

    // 更新到 Supabase
    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { error } = await supabase
          .from('channels')
          .update({ is_favorite: newFavoriteStatus })
          .eq('id', id)
          .select();

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      // Supabase update failed - local state already updated
    }
  },

  selectChannel: async (channel) => {
    set({
      selectedChannel: channel,
      currentChannel: channel
    });
  },

  updateChannelOrder: async (channelId, newOrder) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    const currentChannel = get().channels.find(ch => ch.id === channelId);
    if (!currentChannel) {
      return;
    }

    const updatedChannel = { ...currentChannel, order: newOrder };

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { error } = await supabase
          .from('channels')
          .update({ order: newOrder })
          .eq('id', channelId)
          .select();

        if (error) {
          throw error;
        }
      }

      // 更新本地狀態
      set(state => ({
        channels: state.channels.map(ch =>
          ch.id === channelId ? updatedChannel : ch
        )
      }));

      // 更新 IndexedDB
      await localDB.put('channels', updatedChannel);
    } catch (error) {
      // 靜默失敗
    }
  },

  reorderChannels: (channels) => {
    set({ channels });
  },

  loadChannelGroups: async (workspaceId) => {
    const currentWorkspaceId = workspaceId || get().currentWorkspace?.id;
    if (!currentWorkspaceId) {
      return;
    }

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        const { data, error } = await supabase
          .from('channel_groups')
          .select('*')
          .eq('workspace_id', currentWorkspaceId)
          .order('order', { ascending: true });

        if (error) {
          return;
        }

        const freshGroups = data || [];

        // 同步到 IndexedDB
        for (const group of freshGroups) {
          await localDB.put('channel_groups', group);
        }

        set({ channelGroups: freshGroups });
      } else {
        // 離線模式
        const cachedGroups = (await localDB.getAll('channel_groups') as ChannelGroup[])
          .filter(g => g.workspace_id === currentWorkspaceId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        set({ channelGroups: cachedGroups });
      }
    } catch (error) {
      // 錯誤時從快取載入
      try {
        const cachedGroups = (await localDB.getAll('channel_groups') as ChannelGroup[])
          .filter(g => g.workspace_id === currentWorkspaceId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        set({ channelGroups: cachedGroups });
      } catch (cacheError) {
        // 靜默失敗
      }
    }
  },

  createChannelGroup: (group) => {
    const newGroup: ChannelGroup = {
      ...group,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };

    set(state => ({
      channelGroups: [...state.channelGroups, newGroup]
    }));
  },

  toggleGroupCollapse: (id) => {
    set(state => ({
      channelGroups: state.channelGroups.map(g =>
        g.id === id ? { ...g, is_collapsed: !g.is_collapsed } : g
      )
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setChannelFilter: (filter) => set({ channelFilter: filter }),

  clearError: () => set({ error: null })
}));
