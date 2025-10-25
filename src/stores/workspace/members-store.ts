// Channel members management store
import { create } from 'zustand';
import {
  fetchChannelMembers,
  removeChannelMember as removeChannelMemberService,
  type ChannelMember,
} from '@/services/workspace-members';

interface MembersState {
  channelMembers: Record<string, ChannelMember[]>;
  error: string | null;

  // Member operations
  loadChannelMembers: (workspaceId: string, channelId: string) => Promise<void>;
  removeChannelMember: (workspaceId: string, channelId: string, memberId: string) => Promise<void>;
  clearError: () => void;
}

export const useMembersStore = create<MembersState>((set) => ({
  channelMembers: {},
  error: null,

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

  clearError: () => set({ error: null }),
}));
