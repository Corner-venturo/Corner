import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quote } from './types';
import { createPersistentCrudMethods, generateId } from '@/lib/persistent-store';

interface QuoteState {
  quotes: Quote[];

  // CRUD 方法
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'versions'>) => Promise<Quote>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<Quote | undefined>;
  deleteQuote: (id: string) => Promise<boolean>;
  loadQuotes: () => Promise<Quote[] | null>;

  // 自定義方法
  duplicateQuote: (id: string) => Quote | undefined;
  createNewVersion: (id: string, updates: Partial<Quote>) => Quote | undefined;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      quotes: [],

      // 使用統一的 CRUD 方法
      ...createPersistentCrudMethods<Quote>('quotes', 'quotes', set, get),

      // 複製報價單
      duplicateQuote: (id) => {
        try {
          const original = get().quotes.find(q => q.id === id);
          if (!original) return undefined;

          const duplicated = get().addQuote({
            ...original,
            title: `${original.title} (副本)`,
            status: '草稿',
            version: 1,
            versions: []
          });

          return duplicated;
        } catch (error) {
          console.error('❌ 複製報價單失敗:', error);
          return undefined;
        }
      },

      // 建立新版本
      createNewVersion: (id, updates) => {
        try {
          const current = get().quotes.find(q => q.id === id);
          if (!current) return undefined;

          const newVersion = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            data: { ...current, ...updates }
          };

          return get().updateQuote(id, {
            version: (current.version || 1) + 1,
            versions: [...(current.versions || []), newVersion],
            ...updates
          });
        } catch (error) {
          console.error('❌ 建立新版本失敗:', error);
          return undefined;
        }
      }
    }),
    {
      name: 'venturo-quote-store',
      version: 1,
    }
  )
);
