import { useQuoteStore } from '@/stores';
import { quoteService } from '../services/quote.service';
import { Quote } from '@/stores/types';

export const useQuotes = () => {
  const store = useQuoteStore();

  return {
    // ========== 資料 ==========
    quotes: store.items,

    // ========== CRUD 操作 ==========
    addQuote: async (data: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'version' | 'versions'>) => {
      return await store.create(data as unknown);
    },

    updateQuote: async (id: string, data: Partial<Quote>) => {
      return await store.update(id, data);
    },

    deleteQuote: async (id: string) => {
      return await store.delete(id);
    },

    loadQuotes: async () => {
      return await store.fetchAll();
    },

    // ========== 業務方法 ==========
    duplicateQuote: async (id: string) => {
      return await quoteService.duplicateQuote(id);
    },

    createNewVersion: async (id: string, updates: Partial<Quote>) => {
      return await quoteService.createNewVersion(id, updates);
    },

    getQuotesByTour: (tour_id: string) => {
      return quoteService.getQuotesByTour(tour_id);
    },

    getQuotesByStatus: (status: Quote['status']) => {
      return quoteService.getQuotesByStatus(status);
    },

    calculateTotalCost: (quote: Quote) => {
      return quoteService.calculateTotalCost(quote);
    },
  };
};
