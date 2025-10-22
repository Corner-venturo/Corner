'use client';

import React, { useState, useMemo } from 'react';

import { FileText, Search, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplierStore, useTourStore, useOrderStore } from '@/stores';
import type { Tour, Order } from '@/stores/types';

import { cn } from '@/lib/utils';
import { generateUUID } from '@/lib/utils/uuid';

interface QuickDisbursementProps {
  onSubmit?: (data: DisbursementData) => void;
}

interface DisbursementItem {
  id: string;
  category: '住宿' | '交通' | '餐食' | '門票' | '導遊' | '其他';
  supplier_id: string;
  supplierName: string;
  description: string;
  unit_price: number;
  quantity: number;
}

interface DisbursementData {
  tour_id: string;
  order_id?: string;
  request_date: string;
  items: DisbursementItem[];
  total_amount: number;
  note?: string;
  isSpecialBilling?: boolean;
}

const categoryOptions = [
  { value: '住宿', label: '🏨 住宿' },
  { value: '交通', label: '🚌 交通' },
  { value: '餐食', label: '🍽️ 餐食' },
  { value: '門票', label: '🎫 門票' },
  { value: '導遊', label: '👥 導遊' },
  { value: '其他', label: '📦 其他' }
];

export function QuickDisbursement({ onSubmit }: QuickDisbursementProps) {
  const { items: tours } = useTourStore();
  const { items: orders } = useOrderStore();
  const { items: suppliers } = useSupplierStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [isSpecialBilling, setIsSpecialBilling] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [note, setNote] = useState('');

  // 請款項目列表
  const [items, setItems] = useState<DisbursementItem[]>([]);

  // 新增項目表單
  const [newItem, setNewItem] = useState<{
    category: '住宿' | '交通' | '餐食' | '門票' | '導遊' | '其他';
    supplier_id: string;
    description: string;
    unit_price: number;
    quantity: number;
  }>({
    category: '住宿',
    supplier_id: '',
    description: '',
    unit_price: 0,
    quantity: 1
  });

  // 模糊搜尋團體
  const filteredTours = useMemo(() => {
    if (!searchTerm.trim()) return tours;

    const term = searchTerm.toLowerCase();
    return tours.filter((tour: Tour) => {
      const code = tour.code?.toLowerCase() || '';
      const name = tour.name?.toLowerCase() || '';
      const location = tour.location?.toLowerCase() || '';

      return code.includes(term) ||
             name.includes(term) ||
             location.includes(term);
    });
  }, [tours, searchTerm]);

  // 該團體的訂單列表
  const tourOrders = useMemo(() => {
    if (!selectedTourId) return [];

    return orders
      .filter((order: Order) => order.tour_id === selectedTourId)
      .map((order: Order) => ({
        id: order.id,
        label: `${order.order_number || 'N/A'} - ${order.contact_person} - ${order.sales_person || '未指派'}`
      }));
  }, [selectedTourId, orders]);

  const selectedTour = tours.find((t: Tour) => t.id === selectedTourId);

  // 生成接下來8週的週四日期
  const upcomingThursdays = useMemo(() => {
    const thursdays = [];
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilThursday = (4 - currentDay + 7) % 7;
    if (daysUntilThursday === 0 && today.getHours() >= 12) {
      daysUntilThursday = 7;
    }

    for (let i = 0; i < 8; i++) {
      const thursdayDate = new Date(today);
      thursdayDate.setDate(today.getDate() + daysUntilThursday + (i * 7));

      thursdays.push({
        value: thursdayDate.toISOString().split('T')[0],
        label: `${thursdayDate.toLocaleDateString('zh-TW')} (${thursdayDate.toLocaleDateString('zh-TW', { weekday: 'short' })})`
      });
    }

    return thursdays;
  }, []);

  // 新增項目到列表
  const addItemToList = () => {
    if (!newItem.supplier_id || !newItem.description) {
      alert('請選擇供應商並填寫項目描述');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === newItem.supplier_id);
    if (!selectedSupplier) return;

    const itemId = generateUUID();
    setItems(prev => [...prev, {
      id: itemId,
      ...newItem,
      supplierName: selectedSupplier.name
    }]);

    // 重置表單
    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1
    });
  };

  // 移除項目
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // 計算總金額
  const total_amount = useMemo(() =>
    items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  , [items]);

  const handleSubmit = () => {
    if (!selectedTourId || items.length === 0 || !requestDate) {
      alert('請填寫必填欄位（團體、請款日期、至少一項請款項目）');
      return;
    }

    if (onSubmit) {
      onSubmit({
        tour_id: selectedTourId,
        order_id: selectedOrderId,
        request_date: requestDate,
        items,
        total_amount,
        note,
        isSpecialBilling
      });
    }

    // 重置表單
    setSearchTerm('');
    setSelectedTourId('');
    setSelectedOrderId(undefined);
    setRequestDate('');
    setNote('');
    setIsSpecialBilling(false);
    setItems([]);
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
      <div className="space-y-4">
        {/* 團體搜尋選擇器 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            選擇團體 <span className="text-morandi-red">*</span>
          </label>

          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" />
            <Input
              placeholder="搜尋團號、團名或地點（如：0801、東京、TYO）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-morandi-container/30"
            />
          </div>

          {searchTerm && (
            <div className="border border-morandi-container/30 rounded-lg max-h-48 overflow-y-auto mb-2">
              {filteredTours.length > 0 ? (
                filteredTours.map((tour) => (
                  <button
                    key={tour.id}
                    onClick={() => {
                      setSelectedTourId(tour.id);
                      setSearchTerm('');
                      setSelectedOrderId(undefined);
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
                    setSelectedOrderId(undefined);
                  }}
                  className="text-xs text-morandi-red hover:underline"
                >
                  清除
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 訂單選擇（選填） */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            選擇訂單（選填，團體層級支出可不選）
          </label>
          <Select
            value={selectedOrderId}
            onValueChange={(value) => setSelectedOrderId(value === 'none' ? undefined : value)}
            disabled={!selectedTourId}
          >
            <SelectTrigger className="border-morandi-container/30">
              <SelectValue placeholder={selectedTourId ? '選擇訂單或留空' : '請先選擇團體'} />
            </SelectTrigger>
            <SelectContent>
              {tourOrders.length > 0 ? (
                <>
                  <SelectItem value="none">不指定訂單（團體支出）</SelectItem>
                  {tourOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.label}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <div className="px-2 py-4 text-center text-sm text-morandi-secondary">
                  此團體尚無訂單
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 請款日期 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            請款日期 <span className="text-morandi-red">*</span>
          </label>

          <div className="mb-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="isSpecialBilling"
              checked={isSpecialBilling}
              onChange={(e) => {
                setIsSpecialBilling(e.target.checked);
                setRequestDate('');
              }}
              className="rounded border-border"
            />
            <label htmlFor="isSpecialBilling" className="text-sm text-morandi-primary cursor-pointer">
              特殊出帳 (可選擇任何日期)
            </label>
          </div>

          {isSpecialBilling ? (
            <div>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="bg-morandi-gold/10 border-morandi-gold/50"
              />
              <p className="text-xs text-morandi-gold mt-1">⚠️ 特殊出帳：可選擇任何日期</p>
            </div>
          ) : (
            <div>
              <Select
                value={requestDate}
                onValueChange={(value) => setRequestDate(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇請款日期 (週四)" />
                </SelectTrigger>
                <SelectContent>
                  {upcomingThursdays.map((thursday) => (
                    <SelectItem key={thursday.value} value={thursday.value}>
                      {thursday.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-morandi-secondary mt-1">💼 一般請款固定每週四</p>
            </div>
          )}
        </div>

        {/* 新增項目區塊 */}
        <div className="border border-morandi-container/30 rounded-lg p-4 bg-morandi-container/5">
          <h6 className="font-medium text-morandi-primary mb-3">新增請款項目</h6>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-morandi-secondary mb-1 block">類別</label>
                <Select
                  value={newItem.category}
                  onValueChange={(value: any) => setNewItem(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="border-morandi-container/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-morandi-secondary mb-1 block">供應商</label>
                <Select
                  value={newItem.supplier_id}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger className="border-morandi-container/30">
                    <SelectValue placeholder="選擇供應商" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-morandi-secondary mb-1 block">項目描述</label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="輸入項目描述"
                className="border-morandi-container/30"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-morandi-secondary mb-1 block">單價</label>
                <Input
                  type="number"
                  value={newItem.unit_price || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                  placeholder="0"
                  className="border-morandi-container/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-morandi-secondary mb-1 block">數量</label>
                <Input
                  type="number"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  placeholder="1"
                  className="border-morandi-container/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-morandi-secondary mb-1 block">小計</label>
                <Input
                  value={`NT$ ${(newItem.unit_price * newItem.quantity).toLocaleString()}`}
                  disabled
                  className="bg-morandi-container/30"
                />
              </div>
            </div>

            <Button
              onClick={addItemToList}
              disabled={!newItem.supplier_id || !newItem.description}
              className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              size="sm"
            >
              <Plus size={16} className="mr-2" />
              新增項目
            </Button>
          </div>
        </div>

        {/* 項目列表 */}
        {items.length > 0 && (
          <div className="border border-morandi-container/30 rounded-lg p-4">
            <h6 className="font-medium text-morandi-primary mb-3">請款項目列表 ({items.length})</h6>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-morandi-container/10 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-morandi-gold/20 text-morandi-gold px-2 py-0.5 rounded">
                        {categoryOptions.find(c => c.value === item.category)?.label}
                      </span>
                      <span className="text-sm font-medium text-morandi-primary">{item.supplierName}</span>
                    </div>
                    <div className="text-xs text-morandi-secondary">{item.description}</div>
                    <div className="text-xs text-morandi-secondary mt-1">
                      NT$ {item.unit_price.toLocaleString()} × {item.quantity} =
                      <span className="font-semibold text-morandi-gold ml-1">
                        NT$ {(item.unit_price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-4 text-morandi-red hover:bg-morandi-red/10 p-2 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-morandi-container/30 flex justify-between items-center">
              <span className="text-sm font-semibold text-morandi-primary">總金額:</span>
              <span className="text-lg font-bold text-morandi-gold">NT$ {total_amount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            備註
          </label>
          <Textarea
            placeholder="請款相關說明..."
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border-morandi-container/30"
          />
        </div>

        {/* 提交按鈕 */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedTourId || items.length === 0 || !requestDate}
          className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <FileText size={16} className="mr-2" />
          建立請款單 ({items.length} 項，NT$ {total_amount.toLocaleString()})
        </Button>
      </div>
    </div>
  );
}
