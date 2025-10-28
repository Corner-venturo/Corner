// Channels and workspace management store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { localDB } from '@/lib/db';
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

  // Error handling
  clearError: () => void;
}

export const useChannelsStore = create<ChannelsState>()(
  persist(
    (set, get) => ({
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

            console.log('✅ 從 Supabase 載入工作空間:', data);

            set({
              workspaces: data || [],
              currentWorkspace: data?.[0] || null,
              loading: false
            });
          } else {
            console.log('📴 離線模式：使用本地工作空間');
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
          console.log('⚠️ 載入工作空間失敗，使用本地預設值:', error);
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

      loadChannels: async (workspaceId) => {
        const currentWorkspaceId = workspaceId || get().currentWorkspace?.id;
        if (!currentWorkspaceId) {
          set({ loading: false });
          return;
        }

        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          console.log('💾 [loadChannels] 從 IndexedDB 快速載入...');
          const cachedChannels = (await localDB.getAll('channels') as Channel[])
            .filter(ch => ch.workspace_id === currentWorkspaceId);

          console.log('💾 [loadChannels] IndexedDB 頻道資料:', cachedChannels.map(ch => ({
            id: ch.id,
            name: ch.name,
            order: ch.order,
            is_favorite: ch.is_favorite
          })));

          set({ channels: cachedChannels, loading: false });
          console.log(`✅ [loadChannels] IndexedDB 快速載入完成: ${cachedChannels.length} 筆`);

          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            setTimeout(async () => {
              try {
                console.log('☁️ [loadChannels] 背景同步 Supabase...');
                const { data, error } = await supabase
                  .from('channels')
                  .select('*')
                  .eq('workspace_id', currentWorkspaceId)
                  .order('created_at', { ascending: true });

                if (error) {
                  console.warn('⚠️ [loadChannels] Supabase 同步失敗:', error);
                  return;
                }

                const freshChannels = data || [];
                console.log('☁️ [loadChannels] Supabase 頻道資料:', freshChannels.map(ch => ({
                  id: ch.id,
                  name: ch.name,
                  order: ch.order,
                  is_favorite: ch.is_favorite
                })));
                console.log(`✅ [loadChannels] Supabase 同步成功: ${freshChannels.length} 筆`);

                // 🔥 修正：清理舊資料，只保留 Supabase 的真實資料
                // 1. 取得 IndexedDB 中所有該 workspace 的頻道
                const allCachedChannels = await localDB.getAll('channels') as Channel[];
                const workspaceChannelIds = new Set(
                  allCachedChannels
                    .filter(ch => ch.workspace_id === currentWorkspaceId)
                    .map(ch => ch.id)
                );

                // 2. 刪除不在 Supabase 中的頻道（已被刪除的頻道）
                const freshChannelIds = new Set(freshChannels.map(ch => ch.id));
                for (const cachedId of workspaceChannelIds) {
                  if (!freshChannelIds.has(cachedId)) {
                    console.log(`🗑️ [loadChannels] 清理已刪除的頻道: ${cachedId}`);
                    await localDB.delete('channels', cachedId);
                  }
                }

                // 3. 更新/新增 Supabase 中的頻道
                for (const channel of freshChannels) {
                  await localDB.put('channels', channel);
                }

                set({ channels: freshChannels });
                console.log('✅ [loadChannels] IndexedDB 已與 Supabase 同步完成');
              } catch (syncError) {
                console.warn('⚠️ [loadChannels] 背景同步失敗:', syncError);
              }
            }, 0);
          }
        } catch (error) {
          console.error('❌ [loadChannels] 載入頻道失敗:', error);
          set({ loading: false });
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
            console.log('✅ 頻道已同步到 Supabase');

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
                  console.warn('⚠️ 自動加入創建者失敗:', memberError);
                } else {
                  console.log('✅ 創建者已自動加入頻道為擁有者');
                }
              } catch (memberError) {
                console.warn('⚠️ 加入創建者時發生錯誤:', memberError);
              }
            }
          } else {
            console.log('📴 離線模式：頻道僅儲存到本地');
          }
        } catch (error) {
          console.log('⚠️ 頻道同步失敗，僅儲存到本地:', error);
        }

        await localDB.put('channels', newChannel);
        set(state => ({
          channels: [...state.channels, newChannel]
        }));

        return newChannel;
      },

      updateChannel: async (id, updates) => {
        console.log('🔄 [updateChannel] 開始更新頻道:', { id, updates });
        console.log('🔍 [updateChannel] updates 詳細內容:', JSON.stringify(updates, null, 2));
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        console.log('🌐 [updateChannel] 網路狀態:', isOnline ? '線上' : '離線');

        // 先獲取當前頻道資料
        const currentChannel = get().channels.find(ch => ch.id === id);
        if (!currentChannel) {
          console.error('❌ [updateChannel] 找不到頻道:', id);
          return;
        }

        console.log('📝 [updateChannel] 當前頻道:', currentChannel.name, 'group_id:', currentChannel.group_id);

        // 建立更新後的頻道物件
        const updatedChannel = { ...currentChannel, ...updates };

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            console.log('☁️ [updateChannel] 準備更新到 Supabase...');
            const { error, data } = await supabase
              .from('channels')
              .update(updates)
              .eq('id', id)
              .select();

            if (error) {
              console.error('❌ [updateChannel] Supabase 更新失敗:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
              throw error;
            }
            console.log('✅ [updateChannel] Supabase 更新成功:', data);
          } else {
            console.log('📴 [updateChannel] 離線模式：頻道僅更新到本地');
          }
        } catch (error) {
          console.error('⚠️ [updateChannel] Supabase 更新失敗:', error instanceof Error ? error.message : String(error));
        }

        // 更新本地狀態
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === id ? updatedChannel : ch
          )
        }));
        console.log('✅ [updateChannel] 本地狀態已更新');

        // 更新到 IndexedDB
        try {
          await localDB.put('channels', updatedChannel);
          console.log('✅ [updateChannel] IndexedDB 已更新');
        } catch (error) {
          console.error('❌ [updateChannel] IndexedDB 更新失敗:', error);
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
            console.log('✅ 頻道已從 Supabase 刪除');
          } else {
            console.log('📴 離線模式：頻道僅從本地刪除');
          }
        } catch (error) {
          console.log('⚠️ 頻道刪除失敗，僅從本地刪除:', error);
        }

        set(state => ({
          channels: state.channels.filter(ch => ch.id !== id)
        }));
      },

      toggleChannelFavorite: async (id) => {
        console.log('⭐ [toggleChannelFavorite] 開始切換星號:', id);

        const channel = get().channels.find(ch => ch.id === id);
        if (!channel) {
          console.error('❌ [toggleChannelFavorite] 找不到頻道:', id);
          return;
        }

        const newFavoriteStatus = !channel.is_favorite;
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        console.log('⭐ [toggleChannelFavorite] 新狀態:', newFavoriteStatus, '網路:', isOnline ? '線上' : '離線');

        const updatedChannel = { ...channel, is_favorite: newFavoriteStatus };

        // 先立即更新本地狀態
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === id ? updatedChannel : ch
          )
        }));
        console.log('✅ [toggleChannelFavorite] 本地狀態已更新');

        // 更新到 IndexedDB
        try {
          await localDB.put('channels', updatedChannel);
          console.log('✅ [toggleChannelFavorite] IndexedDB 已更新');
        } catch (error) {
          console.error('❌ [toggleChannelFavorite] IndexedDB 更新失敗:', error);
        }

        // 更新到 Supabase
        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            console.log('☁️ [toggleChannelFavorite] 準備更新到 Supabase...');
            const { error, data } = await supabase
              .from('channels')
              .update({ is_favorite: newFavoriteStatus })
              .eq('id', id)
              .select();

            if (error) {
              console.error('❌ [toggleChannelFavorite] Supabase 更新失敗:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
              throw error;
            }
            console.log('✅ [toggleChannelFavorite] Supabase 已更新:', data);
          } else {
            console.log('📴 [toggleChannelFavorite] 離線模式：僅更新本地');
          }
        } catch (error) {
          console.error('⚠️ [toggleChannelFavorite] Supabase 更新失敗:', error instanceof Error ? error.message : String(error));
        }
      },

      selectChannel: async (channel) => {
        console.log('📢 切換頻道:', channel?.name || 'null');

        set({
          selectedChannel: channel,
          currentChannel: channel
        });
      },

      updateChannelOrder: async (channelId, newOrder) => {
        console.log('🔢 [updateChannelOrder] 開始更新順序:', { channelId, newOrder });

        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        console.log('🌐 [updateChannelOrder] 網路狀態:', isOnline ? '線上' : '離線');

        // 先獲取當前頻道
        const currentChannel = get().channels.find(ch => ch.id === channelId);
        if (!currentChannel) {
          console.error('❌ [updateChannelOrder] 找不到頻道:', channelId);
          return;
        }

        const updatedChannel = { ...currentChannel, order: newOrder };

        try {
          // 更新 Supabase
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            console.log('☁️ [updateChannelOrder] 準備更新到 Supabase...');
            const { error, data } = await supabase
              .from('channels')
              .update({ order: newOrder })
              .eq('id', channelId)
              .select();

            if (error) {
              console.error('❌ [updateChannelOrder] Supabase 更新失敗:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
              throw error;
            }
            console.log('✅ [updateChannelOrder] Supabase 更新成功:', data);
          } else {
            console.log('📴 [updateChannelOrder] 離線模式：僅更新本地');
          }

          // 更新本地狀態
          set(state => ({
            channels: state.channels.map(ch =>
              ch.id === channelId ? updatedChannel : ch
            )
          }));
          console.log('✅ [updateChannelOrder] 本地狀態已更新');

          // 更新 IndexedDB
          await localDB.put('channels', updatedChannel);
          console.log('✅ [updateChannelOrder] IndexedDB 已更新');
        } catch (error) {
          console.error('❌ [updateChannelOrder] 更新失敗:', error);
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
          // 1. 快速載入 IndexedDB 快取
          console.log('💾 [loadChannelGroups] 從 IndexedDB 快速載入...');
          const cachedGroups = (await localDB.getAll('channel_groups') as ChannelGroup[])
            .filter(g => g.workspace_id === currentWorkspaceId);

          set({ channelGroups: cachedGroups });
          console.log(`✅ [loadChannelGroups] IndexedDB 快速載入完成: ${cachedGroups.length} 筆`);

          // 2. 背景同步 Supabase
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            setTimeout(async () => {
              try {
                console.log('☁️ [loadChannelGroups] 背景同步 Supabase...');
                const { data, error } = await supabase
                  .from('channel_groups')
                  .select('*')
                  .eq('workspace_id', currentWorkspaceId)
                  .order('order', { ascending: true });

                if (error) {
                  console.warn('⚠️ [loadChannelGroups] Supabase 同步失敗:', error);
                  return;
                }

                const freshGroups = data || [];
                console.log(`✅ [loadChannelGroups] Supabase 同步成功: ${freshGroups.length} 筆`);

                // 清理舊資料
                const allCachedGroups = await localDB.getAll('channel_groups') as ChannelGroup[];
                const workspaceGroupIds = new Set(
                  allCachedGroups
                    .filter(g => g.workspace_id === currentWorkspaceId)
                    .map(g => g.id)
                );

                const freshGroupIds = new Set(freshGroups.map(g => g.id));
                for (const cachedId of workspaceGroupIds) {
                  if (!freshGroupIds.has(cachedId)) {
                    console.log(`🗑️ [loadChannelGroups] 清理已刪除的群組: ${cachedId}`);
                    await localDB.delete('channel_groups', cachedId);
                  }
                }

                // 更新/新增 Supabase 中的群組
                for (const group of freshGroups) {
                  await localDB.put('channel_groups', group);
                }

                set({ channelGroups: freshGroups });
                console.log('✅ [loadChannelGroups] IndexedDB 已與 Supabase 同步完成');
              } catch (syncError) {
                console.warn('⚠️ [loadChannelGroups] 背景同步失敗:', syncError);
              }
            }, 0);
          }
        } catch (error) {
          console.error('❌ [loadChannelGroups] 載入群組失敗:', error);
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
    }),
    {
      name: 'channels-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspace: state.currentWorkspace,
        bulletins: state.bulletins,
        channels: state.channels,
        channelGroups: state.channelGroups,
        selectedChannel: state.selectedChannel
      })
    }
  )
);
