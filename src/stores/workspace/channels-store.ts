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

  // Channel group operations
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
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
          console.log('💾 [channels] 從 IndexedDB 快速載入...');
          const cachedChannels = (await localDB.getAll('channels') as Channel[])
            .filter(ch => ch.workspace_id === currentWorkspaceId);

          set({ channels: cachedChannels, loading: false });
          console.log(`✅ [channels] IndexedDB 快速載入完成: ${cachedChannels.length} 筆`);

          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            setTimeout(async () => {
              try {
                console.log('☁️ [channels] 背景同步 Supabase...');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error } = await (supabase as any)
                  .from('channels')
                  .select('*')
                  .eq('workspace_id', currentWorkspaceId)
                  .order('created_at', { ascending: true });

                if (error) {
                  console.warn('⚠️ [channels] Supabase 同步失敗，繼續使用快取資料');
                  return;
                }

                const freshChannels = data || [];
                console.log(`✅ [channels] Supabase 同步成功: ${freshChannels.length} 筆`);

                for (const channel of freshChannels) {
                  await localDB.put('channels', channel);
                }

                set({ channels: freshChannels });
              } catch (syncError) {
                console.warn('⚠️ [channels] 背景同步失敗:', syncError);
              }
            }, 0);
          }
        } catch (error) {
          console.log('⚠️ 載入頻道失敗:', error);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
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
      },

      updateChannel: async (id, updates) => {
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from('channels')
              .update(updates)
              .eq('id', id);

            if (error) throw error;
            console.log('✅ 頻道已更新到 Supabase');
          } else {
            console.log('📴 離線模式：頻道僅更新到本地');
          }
        } catch (error) {
          console.log('⚠️ 頻道更新失敗，僅更新到本地:', error);
        }

        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === id ? { ...ch, ...updates } : ch
          )
        }));
      },

      deleteChannel: async (id) => {
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
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

      toggleChannelFavorite: (id) => {
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === id ? { ...ch, is_favorite: !ch.is_favorite } : ch
          )
        }));
      },

      selectChannel: async (channel) => {
        console.log('📢 切換頻道:', channel?.name || 'null');

        set({
          selectedChannel: channel,
          currentChannel: channel
        });
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
