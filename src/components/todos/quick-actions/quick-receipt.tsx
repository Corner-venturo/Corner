'use client';

import React, { useState, useMemo } from 'react';

import { Receipt, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTourStore, useOrderStore } from '@/stores';
import type { Tour, Order } from '@/stores/types';

import { cn } from '@/lib/utils';

interface QuickReceiptProps {
  onSubmit?: (data: ReceiptData) => void;
}

interface ReceiptData {
  tour_id: string;
  order_id: string;
  amount: number;
  paymentMethod: string;
  payment_date: string;
  note?: string;
}

export function QuickReceipt({ onSubmit }: QuickReceiptProps) {
  const { items: tours } = useTourStore();
  const { items: orders } = useOrderStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('');
  const [formData, setFormData] = useState<Partial<ReceiptData>>({
    paymentMethod: 'transfer',
    payment_date: new Date().toISOString().split('T')[0]
  });

  // 模糊搜尋團體（團號/團名/代碼）
  const filteredTours = useMemo(() => {
    if (!searchTerm.trim()) return tours || [];

    const term = searchTerm.toLowerCase();
    return (tours || []).filter((tour: Tour) => {
      const code = tour.code?.toLowerCase() || '';
      const name = tour.name?.toLowerCase() || '';
      const location = tour.location?.toLowerCase() || '';

      return code.includes(term) ||
             name.includes(term) ||
             location.includes(term);
    });
  }, [tours, searchTerm]);

  // 該團體的訂單列表（訂單編號-聯絡人-業務）
  const tourOrders = useMemo(() => {
    if (!selectedTourId) return [];

    return orders
      .filter((order: Order) => order.tour_id === selectedTourId)
      .map((order: Order) => ({
        id: order.id,
        label: `${order.order_number || 'N/A'} - ${order.contact_person} - ${order.sales_person || '未指派'}`
      }));
  }, [selectedTourId, orders]);

  const selectedTour = (tours || []).find((t: Tour) => t.id === selectedTourId);

  const handleSubmit = () => {
    if (!formData.order_id || !formData.amount) {
      alert('請填寫必填欄位（團體、訂單、金額）');
      return;
    }

    onSubmit?.({
      tour_id: selectedTourId,
      order_id: formData.order_id!,
      amount: formData.amount!,
      paymentMethod: formData.paymentMethod!,
      payment_date: formData.payment_date!,
      note: formData.note
    });

    // 重置表單
    setSearchTerm('');
    setSelectedTourId('');
    setFormData({
      paymentMethod: 'transfer',
      payment_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-4">
      {/* 團體搜尋選擇器 */}
      <div>
        <label className="text-sm font-medium text-morandi-secondary mb-2 block">
          選擇團體 <span className="text-morandi-red">*</span>
        </label>

        {/* 搜尋輸入框 */}
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" />
          <Input
            placeholder="搜尋團號、團名或地點（如：0801、東京、TYO）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-morandi-container/30"
          />
        </div>

        {/* 搜尋結果列表 */}
        {searchTerm && (
          <div className="border border-morandi-container/30 rounded-lg max-h-48 overflow-y-auto">
            {filteredTours.length > 0 ? (
              filteredTours.map((tour: Tour) => (
                <button
                    key={tour.id}
                    onClick={() => {
                      setSelectedTourId(tour.id);
                      setSearchTerm('');
                      setFormData(prev => ({ ...prev, order_id: undefined })); // 重置訂單
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-morandi-container/10 transition-colors border-b border-morandi-container/20 last:border-0',
                      selectedTourId === tour.id && 'bg-morandi-gold/10'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-morandi-primary">
                          {tour.code || 'N/A'} - {tour.name}
                        </div>
                        <div className="text-xs text-morandi-secondary mt-1">
                          {tour.location} • {tour.departure_date}
                        </div>
                      </div>
                      {selectedTourId === tour.id && (
                        <div className="text-morandi-gold text-xs font-medium">已選</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-morandi-secondary">
                  找不到相關團體
                </div>
              )}
            </div>
          )}

          {/* 已選團體顯示 */}
          {selectedTour && !searchTerm && (
            <div className="bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-morandi-primary">
                    {selectedTour.code || 'N/A'} - {selectedTour.name}
                  </div>
                  <div className="text-xs text-morandi-secondary mt-1">
                    {selectedTour.location} • {selectedTour.departure_date}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTourId('');
                    setFormData(prev => ({ ...prev, order_id: undefined }));
                  }}
                  className="text-xs text-morandi-red hover:underline"
                >
                  清除
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 訂單選擇（必須先選團體） */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            選擇訂單 <span className="text-morandi-red">*</span>
          </label>
          <Select
            value={formData.order_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, order_id: value }))}
            disabled={!selectedTourId}
          >
            <SelectTrigger className="border-morandi-container/30">
              <SelectValue placeholder={selectedTourId ? '請選擇訂單' : '請先選擇團體'} />
            </SelectTrigger>
            <SelectContent>
              {tourOrders.length > 0 ? (
                tourOrders.map((order: { id: string; label: string }) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-morandi-secondary">
                  此團體尚無訂單
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 收款金額 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            收款金額 <span className="text-morandi-red">*</span>
          </label>
          <Input
            type="number"
            placeholder="請輸入金額"
            value={formData.amount || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
            className="border-morandi-container/30"
          />
        </div>

        {/* 付款方式 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            付款方式 <span className="text-morandi-red">*</span>
          </label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
          >
            <SelectTrigger className="border-morandi-container/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">現金</SelectItem>
              <SelectItem value="transfer">轉帳</SelectItem>
              <SelectItem value="card">信用卡</SelectItem>
              <SelectItem value="check">支票</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 收款日期 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            收款日期 <span className="text-morandi-red">*</span>
          </label>
          <Input
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
            className="border-morandi-container/30"
          />
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            備註
          </label>
          <Textarea
            placeholder="收款相關說明..."
            rows={2}
            value={formData.note || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="border-morandi-container/30"
          />
        </div>

      {/* 提交按鈕 */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedTourId || !formData.order_id || !formData.amount}
        className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
      >
        <Receipt size={16} className="mr-2" />
        建立收款單
      </Button>
    </div>
  );
}
