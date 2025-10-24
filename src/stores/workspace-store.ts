import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { localDB } from '@/lib/db';
import {
  fetchChannelMembers,
  removeChannelMember as removeChannelMemberService,
  type ChannelMember,
} from '@/services/workspace-members';



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
    display_name: string;
    english_name: string;
  };
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by?: string;
  created_at: string;
  is_favorite?: boolean;
  group_id?: string;
  tour_id?: string;
}

export interface ChannelGroup {
  id: string;
  workspace_id: string;
  name: string;
  is_collapsed: boolean;
  order: number;
  created_at?: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  path: string;
  publicUrl: string;
  /** 以下欄位保留給舊版資料使用 */
  name?: string;
  url?: string;
  size?: number;
  type?: string;
  fileType?: string;
}

export interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  reactions: Record<string, string[]>;
  attachments?: MessageAttachment[];
  created_at: string;
  edited_at?: string;
  is_pinned?: boolean;  // ✨ 新增：是否置頂
  author?: {
    id: string;
    display_name: string;
    avatar?: string;
  };
}

type RawMessage = Omit<Message, 'attachments'> & { attachments?: unknown };

const ensureMessageAttachments = (attachments: unknown): MessageAttachment[] => {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.map((item) => {
    const attachment = item as Partial<MessageAttachment> & Record<string, unknown>;

    const path = typeof attachment.path === 'string'
      ? attachment.path
      : typeof attachment.url === 'string'
        ? String(attachment.url)
        : '';

    const fileName = typeof attachment.fileName === 'string'
      ? attachment.fileName
      : typeof attachment.name === 'string'
        ? attachment.name
        : '未命名檔案';

    const mimeType = typeof attachment.mimeType === 'string'
      ? attachment.mimeType
      : typeof attachment.fileType === 'string'
        ? attachment.fileType
        : typeof attachment.type === 'string'
          ? attachment.type
          : 'application/octet-stream';

    const fileSize = typeof attachment.fileSize === 'number'
      ? attachment.fileSize
      : typeof attachment.size === 'number'
        ? attachment.size
        : 0;

    const publicUrl = typeof attachment.publicUrl === 'string'
      ? attachment.publicUrl
      : typeof attachment.url === 'string'
        ? String(attachment.url)
        : '';

    const id = typeof attachment.id === 'string' && attachment.id.length > 0
      ? attachment.id
      : path || `${fileName}-${fileSize}-${mimeType}` || uuidv4();

    return {
      id,
      fileName,
      fileSize,
      mimeType,
      path,
      publicUrl,
      name: attachment.name,
      url: attachment.url,
      size: attachment.size,
      type: attachment.type,
      fileType: attachment.fileType,
    };
  });
};

const normalizeMessage = (message: RawMessage): Message => ({
  ...message,
  attachments: ensureMessageAttachments(message.attachments),
});

export interface PersonalCanvas {
  id: string;
  channelId: string;
  name: string;
  title?: string;  // ✨ 新增：文件標題
  type: string;
  order: number;
  canvas_number?: number;  // ✨ 新增：工作區編號
  created_at?: string;
  updated_at?: string;  // ✨ 新增：更新時間
}

export interface DocumentFormatData {
  version: string;
  blocks?: unknown[];
  styles?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RichDocument {
  id: string;
  canvas_id: string;
  title: string;
  content: string;
  format_data?: DocumentFormatData;  // ✨ 新增：格式資料
  tags?: string[];
  is_favorite?: boolean;  // ✨ 新增：是否收藏
  created_at?: string;
  updated_at?: string;
}

export interface AdvanceItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  advance_person: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_request_id?: string;
  processed_by?: string;
  processed_at?: string;
}

export interface AdvanceList {
  id: string;
  channel_id: string;
  items: AdvanceItem[];
  created_by: string;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    avatar?: string;
  };
}

export interface SharedOrderList {
  id: string;
  channel_id: string;
  orders: Array<{
    id: string;
    order_number: string;
    contact_person: string;
    total_amount: number;
    paid_amount: number;
    gap: number;
    collection_rate: number;
    invoice_status?: 'not_invoiced' | 'invoiced';
    receipt_status?: 'not_received' | 'received';
  }>;
  created_by: string;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    avatar?: string;
  };
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  bulletins: Bulletin[];
  channels: Channel[];
  channelGroups: ChannelGroup[];
  selectedChannel: Channel | null;  // ✨ 新增：當前選擇的頻道
  currentChannel: Channel | null;   // ✨ 新增：當前頻道（與 selectedChannel 同步）
  messages: Message[];
  channelMessages: Record<string, Message[]>;  // ✨ 按頻道分組儲存訊息（快取）
  messagesLoading: Record<string, boolean>;    // ✨ 追蹤各頻道載入狀態
  channelMembers: Record<string, ChannelMember[]>;
  advanceLists: AdvanceList[];
  sharedOrderLists: SharedOrderList[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  channelFilter: 'all' | 'starred' | 'unread' | 'muted';
  personalCanvases: PersonalCanvas[];  // ✨ 新增：個人 Canvas 文件
  richDocuments: RichDocument[];  // ✨ 新增：富文本文件
  createPersonalCanvas: (canvas: Omit<PersonalCanvas, 'id' | 'created_at' | 'updated_at'>) => Promise<PersonalCanvas>;  // ✨ 新增：建立個人 Canvas
  loadRichDocuments: (canvasId?: string) => Promise<void>;  // ✨ 新增
  createRichDocument: (document: Partial<RichDocument>) => Promise<void>;  // ✨ 新增
  updateRichDocument: (id: string, updates: Partial<RichDocument>) => Promise<void>;  // ✨ 新增
  deleteRichDocument: (id: string) => Promise<void>;  // ✨ 新增
  loadPersonalCanvases: (userId?: string, workspaceId?: string) => Promise<void>;  // ✨ 新增

  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;

  loadBulletins: (workspaceId?: string) => Promise<void>;
  createBulletin: (bulletin: Omit<Bulletin, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBulletin: (id: string, updates: Partial<Bulletin>) => Promise<void>;
  deleteBulletin: (id: string) => Promise<void>;

  loadChannels: (workspaceId?: string) => Promise<void>;
  createChannel: (channel: Omit<Channel, 'id' | 'created_at'>) => Promise<void>;
  updateChannel: (id: string, updates: Partial<Channel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  toggleChannelFavorite: (id: string) => void;

  createChannelGroup: (group: Omit<ChannelGroup, 'id' | 'created_at'>) => void;
  toggleGroupCollapse: (id: string) => void;

  setSearchQuery: (query: string) => void;
  setChannelFilter: (filter: 'all' | 'starred' | 'unread' | 'muted') => void;

  selectChannel: (channel: Channel | null) => Promise<void>;  // ✨ 新增：切換頻道
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => Promise<void>;  // ✨ 新增
  updateMessage: (messageId: string, updates: Partial<Message>) => Promise<void>;  // ✨ 新增
  togglePinMessage: (messageId: string) => void;  // ✨ 新增
  addReaction: (messageId: string, emoji: string, userId: string) => void;  // ✨ 新增
  updateMessageReactions: (messageId: string, reactions: Record<string, string[]>) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  softDeleteMessage: (messageId: string) => Promise<void>;
  loadChannelMembers: (workspaceId: string, channelId: string) => Promise<void>;
  removeChannelMember: (workspaceId: string, channelId: string, memberId: string) => Promise<void>;
  activeCanvasTab: string;  // ✨ 新增
  setActiveCanvasTab: (tab: string) => void;  // ✨ 新增

  shareAdvanceList: (channelId: string, items: Omit<AdvanceItem, 'id' | 'status'>[], currentUserId: string) => Promise<void>;
  processAdvanceItem: (listId: string, itemId: string, paymentRequestId: string, processedBy: string) => Promise<void>;
  updateAdvanceStatus: (listId: string, itemId: string, status: AdvanceItem['status']) => Promise<void>;
  loadAdvanceLists: (channelId: string) => Promise<void>;
  deleteAdvanceList: (listId: string) => Promise<void>;

  shareOrderList: (channelId: string, orderIds: string[], currentUserId: string) => Promise<void>;
  updateOrderReceiptStatus: (listId: string, orderId: string, receiptId: string) => Promise<void>;
  loadSharedOrderLists: (channelId: string) => Promise<void>;

  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      bulletins: [],
      channels: [],
      channelGroups: [],
      selectedChannel: null,  // ✨ 新增
      currentChannel: null,   // ✨ 新增
      messages: [],
      channelMessages: {},  // ✨ 初始化頻道訊息快取
      messagesLoading: {},  // ✨ 初始化載入狀態
      channelMembers: {},
      advanceLists: [],
      sharedOrderLists: [],
      loading: false,
      error: null,
      searchQuery: '',
      channelFilter: 'all',
      personalCanvases: [],  // ✨ 新增初始值
      richDocuments: [],  // ✨ 新增初始值
      activeCanvasTab: 'canvas',  // ✨ 新增初始值
      createPersonalCanvas: async (canvas: Omit<PersonalCanvas, 'id' | 'created_at' | 'updated_at'>) => {
        // ✨ 新增：暫時實作（待完整實作）
        const newCanvas: PersonalCanvas = {
          ...canvas,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        set((state) => ({
          personalCanvases: [...state.personalCanvases, newCanvas]
        }));
        return newCanvas;
      },
      loadRichDocuments: async (canvasId?: string) => {
        // ✨ 新增：暫時實作（待完整實作）
        console.log('loadRichDocuments stub', canvasId);
      },
      createRichDocument: async (document: Partial<RichDocument>) => {
        // ✨ 新增：暫時實作（待完整實作）
        const newDoc: RichDocument = {
          id: Date.now().toString(),
          canvas_id: document.canvas_id || '',
          title: document.title || 'Untitled',
          content: document.content || '',
          tags: document.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          richDocuments: [...state.richDocuments, newDoc]
        }));
      },
      updateRichDocument: async (id: string, updates: Partial<RichDocument>) => {
        // ✨ 新增：暫時實作（待完整實作）
        set((state) => ({
          richDocuments: state.richDocuments.map(doc =>
            doc.id === id ? { ...doc, ...updates, updated_at: new Date().toISOString() } : doc
          )
        }));
      },
      deleteRichDocument: async (id: string) => {
        // ✨ 新增：暫時實作（待完整實作）
        set((state) => ({
          richDocuments: state.richDocuments.filter(doc => doc.id !== id)
        }));
      },
      loadPersonalCanvases: async (userId?: string, workspaceId?: string) => {
        // ✨ 新增：暫時實作（待完整實作）
        console.log('loadPersonalCanvases stub', userId, workspaceId);
      },
      setActiveCanvasTab: (tab: string) => {
        // ✨ 新增：設定活動 Canvas 標籤
        set({ activeCanvasTab: tab });
      },

      loadWorkspaces: async () => {
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        set({ loading: true });

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：從 Supabase 載入
            const { data, error } = await (supabase as unknown)
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
            // 📴 離線：使用本地預設值
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
          // 降級到本地預設值
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
        await new Promise(resolve => setTimeout(resolve, 100));


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
          // ✨ 1. 立即從 IndexedDB 快取讀取（快！）
          console.log('💾 [channels] 從 IndexedDB 快速載入...');
          const cachedChannels = (await localDB.getAll('channels') as Channel[])
            .filter(ch => ch.workspace_id === currentWorkspaceId);

          // 立即更新 UI（不等 Supabase）
          set({ channels: cachedChannels, loading: false });
          console.log(`✅ [channels] IndexedDB 快速載入完成: ${cachedChannels.length} 筆`);

          // ✨ 2. 背景從 Supabase 同步（不阻塞 UI）
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            setTimeout(async () => {
              try {
                console.log('☁️ [channels] 背景同步 Supabase...');
                const { data, error } = await (supabase as unknown)
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

                // 批次存入 IndexedDB
                for (const channel of freshChannels) {
                  await localDB.put('channels', channel);
                }

                // 靜默更新 UI
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
            // 🌐 有網路：寫入 Supabase
            const { error } = await (supabase as unknown)
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

        // ✨ 同時寫入 IndexedDB 和 state
        await localDB.put('channels', newChannel);
        set(state => ({
          channels: [...state.channels, newChannel]
        }));
      },

      loadMessages: async (channelId) => {
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        // ✨ 設定載入狀態
        set((state) => ({
          messagesLoading: { ...state.messagesLoading, [channelId]: true }
        }));

        try {
          // ✨ 1. 立即從 IndexedDB 快取讀取（快！）
          console.log('💾 [messages] 從 IndexedDB 快速載入...');
          const cachedMessages = (await localDB.getAll('messages') as RawMessage[])
            .filter(m => m.channel_id === channelId)
            .map(normalizeMessage);

          // 立即更新 UI（不等 Supabase）
          set((state) => {
            const nextChannelMessages = {
              ...state.channelMessages,
              [channelId]: cachedMessages
            };
            const shouldUpdateCurrent = state.selectedChannel?.id === channelId;
            return {
              channelMessages: nextChannelMessages,
              messages: shouldUpdateCurrent ? cachedMessages : state.messages,
              messagesLoading: {
                ...state.messagesLoading,
                [channelId]: false
              }
            };
          });
          console.log(`✅ [messages] IndexedDB 快速載入完成: ${cachedMessages.length} 筆`);

          // ✨ 2. 背景從 Supabase 同步（不阻塞 UI）
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            setTimeout(async () => {
              try {
                console.log('☁️ [messages] 背景同步 Supabase...');
                const { data, error } = await (supabase as unknown)
                  .from('messages')
                  .select(`
                    *,
                    author:employees!author_id(id, display_name, avatar)
                  `)
                  .eq('channel_id', channelId)
                  .order('created_at', { ascending: true });

                if (error) {
                  console.warn('⚠️ [messages] Supabase 同步失敗，繼續使用快取資料');
                  return;
                }

                const freshMessages = (data || []).map(normalizeMessage);
                console.log(`✅ [messages] Supabase 同步成功: ${freshMessages.length} 筆`);

                // 批次存入 IndexedDB
                for (const message of freshMessages) {
                  await localDB.put('messages', message);
                }

                // 靜默更新 UI
                set((state) => {
                  const nextChannelMessages = {
                    ...state.channelMessages,
                    [channelId]: freshMessages
                  };
                  const shouldUpdateCurrent = state.selectedChannel?.id === channelId;
                  return {
                    channelMessages: nextChannelMessages,
                    messages: shouldUpdateCurrent ? freshMessages : state.messages,
                    messagesLoading: {
                      ...state.messagesLoading,
                      [channelId]: false
                    }
                  };
                });
              } catch (syncError) {
                console.warn('⚠️ [messages] 背景同步失敗:', syncError);
              }
            }, 0);
          }
        } catch (error) {
          console.log('⚠️ 載入訊息失敗:', error);
          set((state) => ({
            messagesLoading: { ...state.messagesLoading, [channelId]: false }
          }));
        }
      },

      sendMessage: async (message) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        const attachments = ensureMessageAttachments(message.attachments);

        const newMessage: Message = {
          ...message,
          id: uuidv4(),
          reactions: {},
          created_at: new Date().toISOString(),
          author: message.author,
          attachments: attachments.length > 0 ? attachments : [],
        };

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：寫入 Supabase
            const { error } = await (supabase as unknown)
              .from('messages')
              .insert({
                id: newMessage.id,
                channel_id: newMessage.channel_id,
                author_id: newMessage.author_id,
                content: newMessage.content,
                reactions: newMessage.reactions,
                attachments: newMessage.attachments || [],
                created_at: newMessage.created_at
              });

            if (error) throw error;

            console.log('✅ 訊息已同步到 Supabase');
          } else {
            console.log('📴 離線模式：訊息僅儲存到本地');
          }
        } catch (error) {
          console.log('⚠️ 訊息同步失敗，僅儲存到本地:', error);
        }

        // ✨ 同時寫入 IndexedDB 和 state
        await localDB.put('messages', newMessage);
        set(state => {
          const existingMessages = state.channelMessages[newMessage.channel_id] || [];
          const updatedChannelMessages = [...existingMessages, newMessage];
          const shouldUpdateCurrent = state.selectedChannel?.id === newMessage.channel_id;

          return {
            messages: shouldUpdateCurrent ? updatedChannelMessages : state.messages,
            channelMessages: {
              ...state.channelMessages,
              [newMessage.channel_id]: updatedChannelMessages
            }
          };
        });
      },

      addMessage: async (message) => {
        // ✨ 新增：別名方法，指向 sendMessage
        return get().sendMessage(message);
      },

      updateMessage: async (messageId, updates) => {
        // ✨ 新增：更新訊息
        set(state => {
          let targetChannelId: string | null = null;
          const nextChannelMessages = { ...state.channelMessages };

          for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
            const index = channelMessages.findIndex(m => m.id === messageId);
            if (index !== -1) {
              targetChannelId = channelId;
              const updatedMessages = [...channelMessages];
              updatedMessages[index] = { ...channelMessages[index], ...updates };
              nextChannelMessages[channelId] = updatedMessages;
              break;
            }
          }

          if (!targetChannelId) {
            return {};
          }

          const shouldUpdateCurrent = state.selectedChannel?.id === targetChannelId;
          return {
            channelMessages: nextChannelMessages,
            messages: shouldUpdateCurrent ? nextChannelMessages[targetChannelId] : state.messages
          };
        });
      },

      togglePinMessage: (messageId) => {
        // ✨ 新增：切換訊息置頂
        set(state => {
          let targetChannelId: string | null = null;
          const nextChannelMessages = { ...state.channelMessages };

          for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
            const index = channelMessages.findIndex(m => m.id === messageId);
            if (index !== -1) {
              targetChannelId = channelId;
              const updatedMessages = [...channelMessages];
              const currentMessage = channelMessages[index];
              updatedMessages[index] = { ...currentMessage, is_pinned: !currentMessage.is_pinned };
              nextChannelMessages[channelId] = updatedMessages;
              break;
            }
          }

          if (!targetChannelId) {
            return {};
          }

          const shouldUpdateCurrent = state.selectedChannel?.id === targetChannelId;
          return {
            channelMessages: nextChannelMessages,
            messages: shouldUpdateCurrent ? nextChannelMessages[targetChannelId] : state.messages
          };
        });
      },

      addReaction: (messageId, emoji, userId) => {
        // ✨ 新增：新增反應
        set(state => {
          let targetChannelId: string | null = null;
          const nextChannelMessages = { ...state.channelMessages };

          for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
            const index = channelMessages.findIndex(m => m.id === messageId);
            if (index !== -1) {
              targetChannelId = channelId;
              const updatedMessages = [...channelMessages];
              const currentMessage = channelMessages[index];
              const reactions = { ...currentMessage.reactions };
              if (!reactions[emoji]) {
                reactions[emoji] = [];
              }
              if (!reactions[emoji].includes(userId)) {
                reactions[emoji] = [...reactions[emoji], userId];
              }
              updatedMessages[index] = { ...currentMessage, reactions };
              nextChannelMessages[channelId] = updatedMessages;
              break;
            }
          }

          if (!targetChannelId) {
            return {};
          }

          const shouldUpdateCurrent = state.selectedChannel?.id === targetChannelId;
          return {
            channelMessages: nextChannelMessages,
            messages: shouldUpdateCurrent ? nextChannelMessages[targetChannelId] : state.messages
          };
        });
      },

      updateMessageReactions: async (messageId, reactions) => {
        set(state => {
          let targetChannelId: string | null = null;
          const nextChannelMessages = { ...state.channelMessages };

          for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
            const index = channelMessages.findIndex(m => m.id === messageId);
            if (index !== -1) {
              targetChannelId = channelId;
              const updatedMessages = [...channelMessages];
              updatedMessages[index] = { ...channelMessages[index], reactions };
              nextChannelMessages[channelId] = updatedMessages;
              break;
            }
          }

          if (!targetChannelId) {
            return {};
          }

          const shouldUpdateCurrent = state.selectedChannel?.id === targetChannelId;
          return {
            channelMessages: nextChannelMessages,
            messages: shouldUpdateCurrent ? nextChannelMessages[targetChannelId] : state.messages
          };
        });
      },

      deleteMessage: async (messageId) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：從 Supabase 刪除
            const { error } = await (supabase as unknown)
              .from('messages')
              .delete()
              .eq('id', messageId);

            if (error) throw error;
            console.log('✅ 訊息已從 Supabase 刪除');
          } else {
            console.log('📴 離線模式：訊息僅從本地刪除');
          }
        } catch (error) {
          console.log('⚠️ 訊息刪除失敗，僅從本地刪除:', error);
        }

        // 從本地 state 移除
        set((state) => {
          let targetChannelId: string | null = null;
          const nextChannelMessages = { ...state.channelMessages };

          for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
            if (channelMessages.some(m => m.id === messageId)) {
              targetChannelId = channelId;
              nextChannelMessages[channelId] = channelMessages.filter(m => m.id !== messageId);
              break;
            }
          }

          if (!targetChannelId) {
            return {
              messages: state.messages.filter(m => m.id !== messageId)
            };
          }

          const shouldUpdateCurrent = state.selectedChannel?.id === targetChannelId;
          return {
            channelMessages: nextChannelMessages,
            messages: shouldUpdateCurrent
              ? nextChannelMessages[targetChannelId]
              : state.messages.filter(m => m.id !== messageId)
          };
        });
      },

      softDeleteMessage: async (messageId) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：更新 Supabase
            const { error } = await (supabase as unknown)
              .from('messages')
              .update({ content: '此訊息已被刪除' })
              .eq('id', messageId);

            if (error) throw error;
          }
        } catch (error) {
          console.log('⚠️ 訊息更新失敗:', error);
        }

        // 更新本地 state
        set((state) => {
          let targetChannelId: string | null = null;
          const nextChannelMessages = { ...state.channelMessages };

          for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
            const index = channelMessages.findIndex(m => m.id === messageId);
            if (index !== -1) {
              targetChannelId = channelId;
              const updatedMessages = [...channelMessages];
              updatedMessages[index] = {
                ...channelMessages[index],
                content: '此訊息已被刪除'
              };
              nextChannelMessages[channelId] = updatedMessages;
              break;
            }
          }

          if (!targetChannelId) {
            return {
              messages: state.messages.map(m =>
                m.id === messageId ? { ...m, content: '此訊息已被刪除' } : m
              )
            };
          }

          const shouldUpdateCurrent = state.selectedChannel?.id === targetChannelId;
          return {
            channelMessages: nextChannelMessages,
            messages: shouldUpdateCurrent
              ? nextChannelMessages[targetChannelId]
              : state.messages.map(m =>
                  m.id === messageId ? { ...m, content: '此訊息已被刪除' } : m
                )
          };
        });
      },

      loadChannelMembers: async (workspaceId, channelId) => {
        try {
          const members = await fetchChannelMembers(workspaceId, channelId);
          set((state) => ({
            channelMembers: {
              ...state.channelMembers,
              [channelId]: members,
            },
          }));
        } catch (error) {
          console.error('⚠️ 無法載入頻道成員:', error);
          set({ error: error instanceof Error ? error.message : '無法載入頻道成員' });
        }
      },

      removeChannelMember: async (workspaceId, channelId, memberId) => {
        try {
          await removeChannelMemberService(workspaceId, channelId, memberId);
          set((state) => ({
            channelMembers: {
              ...state.channelMembers,
              [channelId]: (state.channelMembers[channelId] || []).filter(
                (member) => member.id !== memberId
              ),
            },
          }));
        } catch (error) {
          console.error('⚠️ 無法移除頻道成員:', error);
          set({ error: error instanceof Error ? error.message : '移除頻道成員失敗' });
        }
      },

      updateChannel: async (id, updates) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：更新 Supabase
            const { error } = await (supabase as unknown)
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

        // 更新本地 state
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === id ? { ...ch, ...updates } : ch
          )
        }));
      },

      deleteChannel: async (id) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：從 Supabase 刪除
            const { error } = await (supabase as unknown)
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

        // 從本地 state 刪除
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

      // ✨ 切換頻道
      selectChannel: async (channel) => {
        console.log('📢 切換頻道:', channel?.name || 'null');

        // 1. 清空當前訊息和相關資料
        set({
          selectedChannel: channel,
          currentChannel: channel,
          messages: [],
          advanceLists: [],
          sharedOrderLists: []
        });

        // 2. 載入新頻道的資料
        if (channel) {
          await get().loadMessages(channel.id);
          await get().loadAdvanceLists(channel.id);
          await get().loadSharedOrderLists(channel.id);
        }
      },

      shareAdvanceList: async (channelId, items, currentUserId) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        const listId = uuidv4();
        const advanceItems = items.map(item => ({
          ...item,
          id: uuidv4(),
          status: 'pending' as const
        }));

        const newList: AdvanceList = {
          id: listId,
          channel_id: channelId,
          items: advanceItems,
          created_by: currentUserId,
          created_at: new Date().toISOString()
        };

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：寫入 Supabase
            // 1. 建立代墊清單
            const { error: listError } = await (supabase as unknown)
              .from('advance_lists')
              .insert({
                id: listId,
                channel_id: channelId,
                created_by: currentUserId,
                created_at: newList.created_at
              });

            if (listError) throw listError;

            // 2. 建立代墊項目
            const { error: itemsError } = await (supabase as unknown)
              .from('advance_items')
              .insert(
                advanceItems.map(item => ({
                  id: item.id,
                  advance_list_id: listId,
                  name: item.name,
                  description: item.description,
                  amount: item.amount,
                  advance_person: item.advance_person,
                  status: item.status,
                  created_at: newList.created_at
                }))
              );

            if (itemsError) throw itemsError;
            console.log('✅ 代墊清單已同步到 Supabase');
          } else {
            console.log('📴 離線模式：代墊清單僅儲存到本地');
          }
        } catch (error) {
          console.log('⚠️ 代墊清單同步失敗，僅儲存到本地:', error);
        }

        // 更新本地 state
        set(state => ({
          advanceLists: [...state.advanceLists, newList]
        }));
      },

      processAdvanceItem: async (listId, itemId, paymentRequestId, processedBy) => {
        set(state => ({
          advanceLists: state.advanceLists.map(list =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map(item =>
                    item.id === itemId
                      ? {
                          ...item,
                          status: 'completed' as const,
                          payment_request_id: paymentRequestId,
                          processed_by: processedBy,
                          processed_at: new Date().toISOString()
                        }
                      : item
                  )
                }
              : list
          )
        }));
      },

      updateAdvanceStatus: async (listId, itemId, status) => {
        set(state => ({
          advanceLists: state.advanceLists.map(list =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map(item =>
                    item.id === itemId ? { ...item, status } : item
                  )
                }
              : list
          )
        }));
      },

      loadAdvanceLists: async (channelId) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        set({ loading: true });

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：從 Supabase 載入
            // 1. 載入代墊清單
            const { data: lists, error: listsError } = await (supabase as unknown)
              .from('advance_lists')
              .select('*')
              .eq('channel_id', channelId)
              .order('created_at', { ascending: true });

            if (listsError) throw listsError;

            // 2. 載入每個清單的項目
            const advanceLists: AdvanceList[] = [];
            for (const list of lists || []) {
              const { data: items, error: itemsError } = await (supabase as unknown)
                .from('advance_items')
                .select('*')
                .eq('advance_list_id', list.id)
                .order('created_at', { ascending: true });

              if (itemsError) throw itemsError;

              advanceLists.push({
                ...list,
                items: items || []
              });
            }

            set({ advanceLists, loading: false });
          } else {
            // 📴 離線：從本地 state 載入
            const allLists = get().advanceLists;
            const filtered = allLists.filter(list => list.channel_id === channelId);
            set({ advanceLists: filtered, loading: false });
          }
        } catch (error) {
          console.log('⚠️ 載入代墊清單失敗，使用本地資料:', error);
          // 降級到本地資料
          const allLists = get().advanceLists;
          const filtered = allLists.filter(list => list.channel_id === channelId);
          set({ advanceLists: filtered, loading: false });
        }
      },

      deleteAdvanceList: async (listId) => {
        // supabase client already imported at top
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        try {
          if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
            // 🌐 有網路：從 Supabase 刪除（會自動刪除關聯的 items，因為有 ON DELETE CASCADE）
            const { error } = await (supabase as unknown)
              .from('advance_lists')
              .delete()
              .eq('id', listId);

            if (error) throw error;
            console.log('✅ 代墊清單已從 Supabase 刪除');
          } else {
            console.log('📴 離線模式：代墊清單僅從本地刪除');
          }
        } catch (error) {
          console.log('⚠️ 代墊清單刪除失敗，僅從本地刪除:', error);
        }

        // 從本地 state 刪除
        set(state => ({
          advanceLists: state.advanceLists.filter(list => list.id !== listId)
        }));
      },

      shareOrderList: async (channelId, orderIds, currentUserId) => {

        const { useOrderStore } = await import('./index');
        const allOrders = useOrderStore.getState().items;

        const orders = orderIds
          .map(orderId => {
            const order = allOrders.find(o => o.id === orderId);
            if (!order) return null;

            const totalCost = order.total_amount || 0;
            const collected = order.paid_amount || 0;
            const gap = totalCost - collected;
            const collectionRate = totalCost > 0 ? (collected / totalCost) * 100 : 0;

            return {
              id: order.id,
              order_number: order.order_number,
              contact_person: order.contact_person || '',
              total_amount: totalCost,
              paid_amount: collected,
              gap,
              collection_rate: collectionRate,
              invoice_status: 'not_invoiced' as const,
              receipt_status: 'not_received' as const
            };
          })
          .filter(Boolean) as unknown[];

        const newList: SharedOrderList = {
          id: uuidv4(),
          channel_id: channelId,
          orders,
          created_by: currentUserId,
          created_at: new Date().toISOString()
        };

        set(state => ({
          sharedOrderLists: [...state.sharedOrderLists, newList]
        }));
      },

      updateOrderReceiptStatus: async (listId, orderId, _receiptId) => {
        set(state => ({
          sharedOrderLists: state.sharedOrderLists.map(list =>
            list.id === listId
              ? {
                  ...list,
                  orders: list.orders.map(order =>
                    order.id === orderId
                      ? { ...order, receipt_status: 'received' as const }
                      : order
                  )
                }
              : list
          )
        }));
      },

      loadSharedOrderLists: async (channelId) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        const allLists = get().sharedOrderLists;
        const filtered = allLists.filter(list => list.channel_id === channelId);

        set({ sharedOrderLists: filtered, loading: false });
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
        channelGroups: state.channelGroups,
        selectedChannel: state.selectedChannel,  // ✨ 記住最後選擇的頻道
        messages: state.messages,
        advanceLists: state.advanceLists,
        sharedOrderLists: state.sharedOrderLists
      })
    }
  )
);
