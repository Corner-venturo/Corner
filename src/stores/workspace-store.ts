import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ⚠️ 純本地模式 - Workspace Store
// 所有資料存在 localStorage，不使用 Supabase

interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface Bulletin {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  type: 'announcement' | 'notice' | 'event';
  priority: number;
  is_pinned: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    chinese_name: string;
    english_name: string;
  };
}

interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by?: string;
  created_at: string;
}

interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  reactions: Record<string, string[]>;
  attachments?: any[];
  created_at: string;
  edited_at?: string;
  author?: {
    id: string;
    chinese_name: string;
    avatar?: string;
  };
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  bulletins: Bulletin[];
  channels: Channel[];
  messages: Message[];
  loading: boolean;
  error: string | null;

  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;

  loadBulletins: (workspaceId?: string) => Promise<void>;
  createBulletin: (bulletin: Omit<Bulletin, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBulletin: (id: string, updates: Partial<Bulletin>) => Promise<void>;
  deleteBulletin: (id: string) => Promise<void>;

  loadChannels: (workspaceId?: string) => Promise<void>;
  createChannel: (channel: Omit<Channel, 'id' | 'created_at'>) => Promise<void>;

  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => Promise<void>;
  updateMessageReactions: (messageId: string, reactions: Record<string, string[]>) => Promise<void>;

  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      bulletins: [],
      channels: [],
      messages: [],
      loading: false,
      error: null,

      loadWorkspaces: async () => {
        set({ loading: true });

        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 100));

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
      },

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

      loadBulletins: async (workspaceId) => {
        const currentWorkspaceId = workspaceId || get().currentWorkspace?.id;
        if (!currentWorkspaceId) {
          set({ loading: false });
          return;
        }

        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        // 使用本地資料
        const allBulletins = get().bulletins;
        const filtered = allBulletins.filter(b => b.workspace_id === currentWorkspaceId);

        set({ bulletins: filtered, loading: false });
      },

      createBulletin: async (bulletin) => {
        const newBulletin: Bulletin = {
          ...bulletin,
          id: `bulletin-${Date.now()}`,
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

        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        // 預設頻道
        const defaultChannels: Channel[] = [
          {
            id: 'channel-001',
            workspace_id: currentWorkspaceId,
            name: '一般討論',
            description: '一般事務討論',
            type: 'public',
            created_at: new Date().toISOString()
          }
        ];

        set({ channels: defaultChannels, loading: false });
      },

      createChannel: async (channel) => {
        const newChannel: Channel = {
          ...channel,
          id: `channel-${Date.now()}`,
          created_at: new Date().toISOString()
        };

        set(state => ({
          channels: [...state.channels, newChannel]
        }));
      },

      loadMessages: async (channelId) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        const allMessages = get().messages;
        const filtered = allMessages.filter(m => m.channel_id === channelId);

        set({ messages: filtered, loading: false });
      },

      sendMessage: async (message) => {
        const newMessage: Message = {
          ...message,
          id: `message-${Date.now()}`,
          reactions: {},
          created_at: new Date().toISOString()
        };

        set(state => ({
          messages: [...state.messages, newMessage]
        }));
      },

      updateMessageReactions: async (messageId, reactions) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === messageId ? { ...m, reactions } : m
          )
        }));
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspace: state.currentWorkspace,
        bulletins: state.bulletins,
        channels: state.channels,
        messages: state.messages
      })
    }
  )
);
