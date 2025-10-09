import { useQuoteStore } from '@/stores/quote-store';
import { quoteService } from '../services/quote.service';
import { Quote } from '@/stores/types';

export const useQuotes = () => {
  const store = useQuoteStore();

  return {
    // ========== 資料 ==========
    quotes: store.quotes,

    // ========== CRUD 操作 ==========
    createQuote: async (data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'versions'>) => {
      return await store.addQuote(data);
    },

    updateQuote: async (id: string, data: Partial<Quote>) => {
      return await store.updateQuote(id, data);
    },

    deleteQuote: async (id: string) => {
      return await store.deleteQuote(id);
    },

    loadQuotes: async () => {
      return await store.loadQuotes();
    },

    // ========== 業務方法 ==========
    duplicateQuote: async (id: string) => {
      return await quoteService.duplicateQuote(id);
    },

    createNewVersion: async (id: string, updates: Partial<Quote>) => {
      return await quoteService.createNewVersion(id, updates);
    },

    getQuotesByTour: (tour_id: string) => {
      return quoteService.getQuotesByTour(tourId);
    },

    getQuotesByStatus: (status: Quote['status']) => {
      return quoteService.getQuotesByStatus(status);
    },

    calculateTotalCost: (quote: Quote) => {
      return quoteService.calculateTotalCost(quote);
    },
  };
};
