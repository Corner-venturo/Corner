import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Quote } from '@/stores/types';
import { useQuoteStore } from '@/stores/quote-store';
import { ValidationError } from '@/core/errors/app-errors';
import { generateId } from '@/lib/persistent-store';

class QuoteService extends BaseService<Quote> {
  protected resourceName = 'quotes';

  protected getStore(): StoreOperations<Quote> {
    const store = useQuoteStore.getState();
    return {
      getAll: () => store.quotes,
      getById: (id: string) => store.quotes.find(q => q.id === id),
      add: async (quote: Quote) => {
        await store.addQuote(quote as any);
        return quote;
      },
      update: async (id: string, data: Partial<Quote>) => {
        await store.updateQuote(id, data);
      },
      delete: async (id: string) => {
        await store.deleteQuote(id);
      }
    };
  }

  protected validate(data: Partial<Quote>): void {
    if (data.title && data.title.trim().length < 2) {
      throw new ValidationError('title', '報價單標題至少需要 2 個字符');
    }

    if (data.categories) {
      const totalCost = data.categories.reduce((sum, cat) => sum + cat.total, 0);
      if (totalCost < 0) {
        throw new ValidationError('categories', '總金額不能為負數');
      }
    }
  }

  // ========== 業務邏輯方法 ==========

  async duplicateQuote(id: string): Promise<Quote | undefined> {
    const store = useQuoteStore.getState();
    const original = store.quotes.find(q => q.id === id);
    if (!original) return undefined;

    const duplicated = await store.addQuote({
      ...original,
      title: `${original.title} (副本)`,
      status: '草稿',
      version: 1,
      versions: []
    } as any);

    return duplicated;
  }

  async createNewVersion(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const store = useQuoteStore.getState();
    const current = store.quotes.find(q => q.id === id);
    if (!current) return undefined;

    const newVersion = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      data: { ...current, ...updates }
    };

    return await store.updateQuote(id, {
      version: (current.version || 1) + 1,
      versions: [...(current.versions || []), newVersion],
      ...updates
    });
  }

  getQuotesByTour(tour_id: string): Quote[] {
    const store = useQuoteStore.getState();
    return store.quotes.filter(q => q.tour_id === tourId);
  }

  getQuotesByStatus(status: Quote['status']): Quote[] {
    const store = useQuoteStore.getState();
    return store.quotes.filter(q => q.status === status);
  }

  calculateTotalCost(quote: Quote): number {
    return quote.categories.reduce((sum, cat) => sum + cat.total, 0);
  }
}

export const quoteService = new QuoteService();
