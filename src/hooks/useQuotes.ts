/**
 * useQuotes - 報價單業務邏輯 Hook
 */

import { useMemo } from 'react';

import { useQuoteStore, useQuoteItemStore } from '@/stores';
import { Quote, QuoteItem, CreateQuoteData, QuoteStatus } from '@/types';

export function useQuotes() {
  const quoteStore = useQuoteStore();
  const itemStore = useQuoteItemStore();

  const canEditQuote = (quote: Quote): boolean => {
    return quote.status === 'draft';
  };

  const canConvertToTour = (quote: Quote): boolean => {
    return quote.status === 'accepted' && !quote.convertedToTour;
  };

  const isExpired = (quote: Quote): boolean => {
    if (!quote.valid_until) return false;
    return new Date(quote.valid_until) < new Date();
  };

  const createQuote = async (data: Omit<CreateQuoteData, 'id' | 'code'>): Promise<Quote> => {
    return await quoteStore.create(data as Quote);
  };

  const updateQuote = async (id: string, data: Partial<Quote>): Promise<Quote> => {
    const existing = await quoteStore.fetchById(id);
    if (!existing) throw new Error('報價單不存在');
    if (!canEditQuote(existing)) throw new Error('此報價單無法編輯');
    return await quoteStore.update(id, data);
  };

  const getQuoteItems = async (quote_id: string): Promise<QuoteItem[]> => {
    await itemStore.fetchAll();
    return itemStore.findByField('quoteId', quoteId);
  };

  const calculateTotalAmount = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const activeQuotes = useMemo(() => {
    return quoteStore.items.filter(q => q.status === 'sent' && q.is_active && !isExpired(q));
  }, [quoteStore.items]);

  return {
    quotes: quoteStore.items,
    loading: quoteStore.loading,
    error: quoteStore.error,
    fetchAll: quoteStore.fetchAll,
    createQuote,
    updateQuote,
    deleteQuote: quoteStore.delete,
    canEditQuote,
    canConvertToTour,
    isExpired,
    getQuoteItems,
    calculateTotalAmount,
    activeQuotes,
  };
}
