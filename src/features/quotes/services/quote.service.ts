import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Quote } from '@/stores/types';
import { useQuoteStore } from '@/stores';
import { ValidationError } from '@/core/errors/app-errors';
import { generateId } from '@/lib/data/create-data-store';

class QuoteService extends BaseService<Quote> {
  protected resourceName = 'quotes';

  protected getStore = (): StoreOperations<Quote> => {
    const store = useQuoteStore.getState();
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find(q => q.id === id),
      add: async (quote: Quote) => {
        const result = await store.create(quote as any);
        return result || quote;
      },
      update: async (id: string, data: Partial<Quote>) => {
        await store.update(id, data);
      },
      delete: async (id: string) => {
        await store.delete(id);
      }
    };
  }

  protected validate(data: Partial<Quote>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '報價單標題至少需要 2 個字符');
    }

    if (data.categories) {
      const total_cost = data.categories.reduce((sum, cat) => sum + cat.total, 0);
      if (total_cost < 0) {
        throw new ValidationError('categories', '總金額不能為負數');
      }
    }
  }

  // ========== 業務邏輯方法 ==========

  async duplicateQuote(id: string): Promise<Quote | undefined> {
    const store = useQuoteStore.getState();
    const original = store.items.find(q => q.id === id);
    if (!original) return undefined;

    // 排除不應該傳入的欄位
    const { id: _, created_at, updated_at, version, versions, ...rest } = original;

    const duplicated = await store.create({
      ...rest,
      name: `${original.name} (副本)`,
      status: 'proposed'
    } as any);

    return duplicated;
  }

  async createNewVersion(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const store = useQuoteStore.getState();
    const current = store.items.find(q => q.id === id);
    if (!current) return undefined;

    const newVersion = {
      id: generateId(),
      version: (current.version || 1) + 1,
      categories: current.categories,
      total_cost: current.total_cost,
      created_at: new Date().toISOString()
    };

    return await store.update(id, {
      version: (current.version || 1) + 1,
      versions: [...(current.versions || []), newVersion],
      ...updates
    });
  }

  getQuotesByTour(tour_id: string): Quote[] {
    const store = useQuoteStore.getState();
    return store.items.filter(q => q.tour_id === tour_id);
  }

  getQuotesByStatus(status: Quote['status']): Quote[] {
    const store = useQuoteStore.getState();
    return store.items.filter(q => q.status === status);
  }

  calculateTotalCost(quote: Quote): number {
    return quote.categories.reduce((sum, cat) => sum + cat.total, 0);
  }
}

export const quoteService = new QuoteService();
