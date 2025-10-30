// Chat and messaging store
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { localDB } from '@/lib/db';
import type { Message, RawMessage } from './types';
import { ensureMessageAttachments, normalizeMessage } from './utils';

interface ChatState {
  messages: Message[];
  channelMessages: Record<string, Message[]>;
  messagesLoading: Record<string, boolean>;

  // Message operations
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'created_at' | 'reactions'>) => Promise<void>;
  updateMessage: (messageId: string, updates: Partial<Message>) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  softDeleteMessage: (messageId: string) => Promise<void>;

  // Message interactions
  togglePinMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  updateMessageReactions: (messageId: string, reactions: Record<string, string[]>) => Promise<void>;

  // Internal state management
  setCurrentChannelMessages: (channelId: string, messages: Message[]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  channelMessages: {},
  messagesLoading: {},

  loadMessages: async (channelId) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    set((state) => ({
      messagesLoading: { ...state.messagesLoading, [channelId]: true }
    }));

    try {
      const cachedMessages = (await localDB.getAll('messages') as RawMessage[])
        .filter(m => m.channel_id === channelId)
        .map(normalizeMessage);

      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [channelId]: cachedMessages
        },
        messagesLoading: {
          ...state.messagesLoading,
          [channelId]: false
        }
      }));

      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        setTimeout(async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
              .from('messages')
              .select(`
                *,
                author:employees!author_id(id, display_name, avatar)
              `)
              .eq('channel_id', channelId)
              .order('created_at', { ascending: true });

            if (error) {
                            return;
            }

            const freshMessages = (data || []).map(normalizeMessage);

            for (const message of freshMessages) {
              await localDB.put('messages', message);
            }

            set((state) => ({
              channelMessages: {
                ...state.channelMessages,
                [channelId]: freshMessages
              }
            }));
          } catch (syncError) {
                      }
        }, 0);
      }
    } catch (error) {
      set((state) => ({
        messagesLoading: { ...state.messagesLoading, [channelId]: false }
      }));
    }
  },

  sendMessage: async (message) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from('messages')
          .insert({
            id: newMessage.id,
            channel_id: newMessage.channel_id,
            author_id: newMessage.author_id,
            content: newMessage.content,
            reactions: newMessage.reactions,
            attachments: (newMessage.attachments || []) as unknown,
            created_at: newMessage.created_at
          });

        if (error) throw error;
      } else {
      }
    } catch (error) {
    }

    await localDB.put('messages', newMessage);
    set(state => {
      const existingMessages = state.channelMessages[newMessage.channel_id] || [];
      return {
        channelMessages: {
          ...state.channelMessages,
          [newMessage.channel_id]: [...existingMessages, newMessage]
        }
      };
    });
  },

  addMessage: async (message) => {
    return get().sendMessage(message);
  },

  updateMessage: async (messageId, updates) => {
    set(state => {
      const nextChannelMessages = { ...state.channelMessages };

      for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
        const index = channelMessages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          const updatedMessages = [...channelMessages];
          updatedMessages[index] = { ...channelMessages[index], ...updates };
          nextChannelMessages[channelId] = updatedMessages;
          break;
        }
      }

      return { channelMessages: nextChannelMessages };
    });
  },

  togglePinMessage: (messageId) => {
    set(state => {
      const nextChannelMessages = { ...state.channelMessages };

      for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
        const index = channelMessages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          const updatedMessages = [...channelMessages];
          const currentMessage = channelMessages[index];
          updatedMessages[index] = { ...currentMessage, is_pinned: !currentMessage.is_pinned };
          nextChannelMessages[channelId] = updatedMessages;
          break;
        }
      }

      return { channelMessages: nextChannelMessages };
    });
  },

  addReaction: (messageId, emoji, userId) => {
    set(state => {
      const nextChannelMessages = { ...state.channelMessages };

      for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
        const index = channelMessages.findIndex(m => m.id === messageId);
        if (index !== -1) {
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

      return { channelMessages: nextChannelMessages };
    });
  },

  updateMessageReactions: async (messageId, reactions) => {
    set(state => {
      const nextChannelMessages = { ...state.channelMessages };

      for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
        const index = channelMessages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          const updatedMessages = [...channelMessages];
          updatedMessages[index] = { ...channelMessages[index], reactions };
          nextChannelMessages[channelId] = updatedMessages;
          break;
        }
      }

      return { channelMessages: nextChannelMessages };
    });
  },

  deleteMessage: async (messageId) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    try {
      // 🔥 從 Supabase 刪除
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);

        if (error) throw error;
      } else {
      }
    } catch (error) {
    }

    // 🔥 從 IndexedDB 刪除
    try {
      await localDB.delete('messages', messageId);
    } catch (error) {
          }

    // 🔥 從 Zustand 狀態刪除
    set((state) => {
      const nextChannelMessages = { ...state.channelMessages };

      for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
        if (channelMessages.some(m => m.id === messageId)) {
          nextChannelMessages[channelId] = channelMessages.filter(m => m.id !== messageId);
          break;
        }
      }

      return { channelMessages: nextChannelMessages };
    });
  },

  softDeleteMessage: async (messageId) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from('messages')
          .update({ content: '此訊息已被刪除' })
          .eq('id', messageId);

        if (error) throw error;
      }
    } catch (error) {
    }

    set((state) => {
      const nextChannelMessages = { ...state.channelMessages };

      for (const [channelId, channelMessages] of Object.entries(state.channelMessages)) {
        const index = channelMessages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          const updatedMessages = [...channelMessages];
          updatedMessages[index] = {
            ...channelMessages[index],
            content: '此訊息已被刪除'
          };
          nextChannelMessages[channelId] = updatedMessages;
          break;
        }
      }

      return { channelMessages: nextChannelMessages };
    });
  },

  setCurrentChannelMessages: (channelId, messages) => {
    set((state) => ({
      messages,
      channelMessages: {
        ...state.channelMessages,
        [channelId]: messages
      }
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
