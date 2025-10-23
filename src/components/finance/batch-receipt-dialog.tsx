'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderStore, useReceiptOrderStore } from '@/stores';
import { OrderAllocation, ReceiptPaymentItem } from '@/stores/types';
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 收款方式選項
const paymentMethods = [
  { value: 'cash', label: '現金' },
  { value: 'transfer', label: '匯款' },
  { value: 'card', label: '刷卡' },
  { value: 'check', label: '支票' }
];

export function BatchReceiptDialog({ open, onOpenChange }: BatchReceiptDialogProps) {
  const { items: orders } = useOrderStore();
  const { create: createReceiptOrder } = useReceiptOrderStore();

  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // 訂單分配列表
  const [orderAllocations, setOrderAllocations] = useState<OrderAllocation[]>([]);

  // 收款項目
  const [paymentItems, setPaymentItems] = useState<Partial<ReceiptPaymentItem>[]>([
    {
      payment_method: 'cash',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0]
    }
  ]);

  // 可用訂單（未收款或部分收款）
  const availableOrders = useMemo(() => {
    return orders.filter(order =>
      order.payment_status === 'unpaid' || order.payment_status === 'partial'
    );
  }, [orders]);

  // 計算總收款金額
  const totalPaymentAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [paymentItems]);

  // 計算已分配金額
  const totalAllocatedAmount = useMemo(() => {
    return orderAllocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0);
  }, [orderAllocations]);

  // 未分配金額
  const unallocatedAmount = totalPaymentAmount - totalAllocatedAmount;

  // 新增訂單分配
  const addOrderAllocation = () => {
    if (availableOrders.length === 0) {
      alert('沒有可用的訂單');
      return;
    }

    const firstAvailableOrder = availableOrders[0];
    setOrderAllocations(prev => [...prev, {
      order_id: firstAvailableOrder.id,
      order_number: firstAvailableOrder.code,
      tour_id: firstAvailableOrder.tour_id,
      code: firstAvailableOrder.code || '',
      tour_name: firstAvailableOrder.tour_name || '',
      contact_person: firstAvailableOrder.contact_person,
      allocated_amount: 0
    }]);
  };

  // 移除訂單分配
  const removeOrderAllocation = (index: number) => {
    setOrderAllocations(prev => prev.filter((_, i) => i !== index));
  };

  // 更新訂單分配
  const updateOrderAllocation = (index: number, updates: Partial<OrderAllocation>) => {
    setOrderAllocations(prev => prev.map((allocation, i) =>
      i === index ? { ...allocation, ...updates } : allocation
    ));
  };

  // 選擇訂單
  const selectOrder = (index: number, orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    updateOrderAllocation(index, {
      order_id: order.id,
      order_number: order.code,
      tour_id: order.tour_id,
      code: order.code || '',
      tour_name: order.tour_name || '',
      contact_person: order.contact_person
    });
  };

  // 新增收款項目
  const addPaymentItem = () => {
    setPaymentItems(prev => [...prev, {
      payment_method: 'cash',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0]
    }]);
  };

  // 移除收款項目
  const removePaymentItem = (index: number) => {
    if (paymentItems.length > 1) {
      setPaymentItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 更新收款項目
  const updatePaymentItem = (index: number, updates: Partial<ReceiptPaymentItem>) => {
    setPaymentItems(prev => prev.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    ));
  };

  // 平均分配未分配金額
  const distributeEvenly = () => {
    if (orderAllocations.length === 0 || unallocatedAmount <= 0) return;

    const amountPerOrder = Math.floor(unallocatedAmount / orderAllocations.length);
    const remainder = unallocatedAmount - (amountPerOrder * orderAllocations.length);

    setOrderAllocations(prev => prev.map((allocation, index) => ({
      ...allocation,
      allocated_amount: allocation.allocated_amount + amountPerOrder + (index === 0 ? remainder : 0)
    })));
  };

  // 重置表單
  const resetForm = () => {
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setOrderAllocations([]);
    setPaymentItems([{
      payment_method: 'cash',
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0]
    }]);
  };

  // 儲存
  const handleSave = async () => {
    if (orderAllocations.length === 0) {
      alert('請至少新增一個訂單分配');
      return;
    }

    if (totalPaymentAmount === 0) {
      alert('收款金額不能為 0');
      return;
    }

    if (unallocatedAmount !== 0) {
      alert(`還有 NT$ ${unallocatedAmount.toLocaleString()} 未分配，請確認分配金額`);
      return;
    }

    try {
      await createReceiptOrder({
        allocation_mode: 'multiple',
        order_allocations: orderAllocations,
        receipt_date: receiptDate,
        payment_items: paymentItems as ReceiptPaymentItem[],
        total_amount: totalPaymentAmount,
        status: '已收款',
        note,
        created_by: '1' // TODO: 從 auth store 取得當前用戶
      } as any);

      alert('✅ 批量收款單建立成功');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('建立批量收款單失敗:', error);
      alert('❌ 建立失敗，請稍後再試');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-morandi-gold" />
            批量分配收款（一筆款分多訂單）
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 收款日期 */}
          <div>
            <Label>收款日期</Label>
            <Input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
            />
          </div>

          {/* 收款項目 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">收款項目</Label>
              <Button size="sm" variant="outline" onClick={addPaymentItem}>
                <Plus className="h-4 w-4 mr-1" />
                新增收款項目
              </Button>
            </div>

            <div className="space-y-2">
              {paymentItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Select
                    value={item.payment_method}
                    onValueChange={(value) => updatePaymentItem(index, { payment_method: value as any })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="金額"
                    value={item.amount || ''}
                    onChange={(e) => updatePaymentItem(index, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-40"
                  />

                  <Input
                    type="date"
                    value={item.transaction_date}
                    onChange={(e) => updatePaymentItem(index, { transaction_date: e.target.value })}
                    className="w-40"
                  />

                  {paymentItems.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePaymentItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-morandi-red" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="text-right text-sm font-semibold">
              總收款金額：
              <span className="text-lg text-morandi-gold ml-2">
                NT$ {totalPaymentAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 訂單分配 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">訂單分配</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={distributeEvenly} disabled={orderAllocations.length === 0}>
                  平均分配
                </Button>
                <Button size="sm" variant="outline" onClick={addOrderAllocation}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增訂單
                </Button>
              </div>
            </div>

            {orderAllocations.length === 0 ? (
              <div className="text-center py-8 text-morandi-secondary border rounded-lg border-dashed">
                請新增訂單分配
              </div>
            ) : (
              <div className="space-y-2">
                {orderAllocations.map((allocation, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-morandi-container/20">
                    <Select
                      value={allocation.order_id}
                      onValueChange={(value) => selectOrder(index, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="選擇訂單" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOrders.map(order => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.code} - {order.contact_person} ({order.tour_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="分配金額"
                      value={allocation.allocated_amount || ''}
                      onChange={(e) => updateOrderAllocation(index, { allocated_amount: parseFloat(e.target.value) || 0 })}
                      className="w-40"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOrderAllocation(index)}
                    >
                      <Trash2 className="h-4 w-4 text-morandi-red" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-3 border rounded-lg bg-morandi-container/10">
              <div className="text-sm">
                <span className="text-morandi-secondary">已分配：</span>
                <span className="font-semibold ml-2">NT$ {totalAllocatedAmount.toLocaleString()}</span>
              </div>
              <div className={cn(
                "text-sm",
                unallocatedAmount > 0 && "text-morandi-gold",
                unallocatedAmount < 0 && "text-morandi-red"
              )}>
                <span>未分配：</span>
                <span className="font-semibold ml-2">NT$ {unallocatedAmount.toLocaleString()}</span>
              </div>
            </div>

            {unallocatedAmount !== 0 && (
              <div className="flex items-center gap-2 p-3 border border-morandi-gold/30 rounded-lg bg-morandi-gold/5 text-sm">
                <AlertCircle className="h-4 w-4 text-morandi-gold" />
                <span className="text-morandi-gold">
                  {unallocatedAmount > 0 ? '還有金額未分配' : '分配金額超過收款金額'}，請調整分配金額
                </span>
              </div>
            )}
          </div>

          {/* 備註 */}
          <div>
            <Label>備註</Label>
            <Input
              placeholder="收款備註（選填）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
            disabled={unallocatedAmount !== 0 || orderAllocations.length === 0}
          >
            建立批量收款單
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
