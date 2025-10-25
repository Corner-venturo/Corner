// Widgets (advance lists, shared orders) management store
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import type { AdvanceItem, AdvanceList, SharedOrderList } from './types';

interface WidgetsState {
  advanceLists: AdvanceList[];
  sharedOrderLists: SharedOrderList[];
  loading: boolean;

  // Advance list operations
  shareAdvanceList: (channelId: string, items: Omit<AdvanceItem, 'id' | 'status'>[], currentUserId: string) => Promise<void>;
  processAdvanceItem: (listId: string, itemId: string, paymentRequestId: string, processedBy: string) => Promise<void>;
  updateAdvanceStatus: (listId: string, itemId: string, status: AdvanceItem['status']) => Promise<void>;
  loadAdvanceLists: (channelId: string) => Promise<void>;
  deleteAdvanceList: (listId: string) => Promise<void>;

  // Shared order list operations
  shareOrderList: (channelId: string, orderIds: string[], currentUserId: string) => Promise<void>;
  updateOrderReceiptStatus: (listId: string, orderId: string, receiptId: string) => Promise<void>;
  loadSharedOrderLists: (channelId: string) => Promise<void>;

  // Internal state
  clearWidgets: () => void;
}

export const useWidgetsStore = create<WidgetsState>((set, get) => ({
  advanceLists: [],
  sharedOrderLists: [],
  loading: false,

  shareAdvanceList: async (channelId, items, currentUserId) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: listError } = await (supabase as any)
          .from('advance_lists')
          .insert({
            id: listId,
            channel_id: channelId,
            created_by: currentUserId,
            created_at: newList.created_at
          });

        if (listError) throw listError;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: itemsError } = await (supabase as any)
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
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    set({ loading: true });

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: lists, error: listsError } = await (supabase as any)
          .from('advance_lists')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true });

        if (listsError) throw listsError;

        const advanceLists: AdvanceList[] = [];
        for (const list of lists || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: items, error: itemsError } = await (supabase as any)
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
        const allLists = get().advanceLists;
        const filtered = allLists.filter(list => list.channel_id === channelId);
        set({ advanceLists: filtered, loading: false });
      }
    } catch (error) {
      console.log('⚠️ 載入代墊清單失敗，使用本地資料:', error);
      const allLists = get().advanceLists;
      const filtered = allLists.filter(list => list.channel_id === channelId);
      set({ advanceLists: filtered, loading: false });
    }
  },

  deleteAdvanceList: async (listId) => {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    try {
      if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
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

    set(state => ({
      advanceLists: state.advanceLists.filter(list => list.id !== listId)
    }));
  },

  shareOrderList: async (channelId, orderIds, currentUserId) => {
    const { useOrderStore } = await import('../index');
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
      .filter((order): order is NonNullable<typeof order> => order !== null);

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

    const allLists = get().sharedOrderLists;
    const filtered = allLists.filter(list => list.channel_id === channelId);

    set({ sharedOrderLists: filtered, loading: false });
  },

  clearWidgets: () => {
    set({
      advanceLists: [],
      sharedOrderLists: []
    });
  },
}));
