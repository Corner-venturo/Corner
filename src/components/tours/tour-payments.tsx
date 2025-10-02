'use client';

import React, { useState } from 'react';
import { Tour } from '@/stores/types';
import { useTourStore } from '@/stores/tour-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DollarSign, Calendar, TrendingUp, TrendingDown, CreditCard, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourPaymentsProps {
  tour: Tour;
  orderFilter?: string; // 選填：只顯示特定訂單的收款記錄
  triggerAdd?: boolean;
  onTriggerAddComplete?: () => void;
}

export const TourPayments = React.memo(function TourPayments({ tour, orderFilter, triggerAdd, onTriggerAddComplete }: TourPaymentsProps) {
  const { orders, payments, addPayment } = useTourStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 監聽外部觸發新增
  React.useEffect(() => {
    if (triggerAdd) {
      setIsAddDialogOpen(true);
      onTriggerAddComplete?.();
    }
  }, [triggerAdd, onTriggerAddComplete]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    description: '',
    method: 'bank_transfer',
    status: '已確認' as const
  });

  // 獲取屬於這個旅遊團的所有訂單（如果有 orderFilter，則只取該訂單）
  const tourOrders = orders.filter(order => {
    if (orderFilter) {
      return order.id === orderFilter;
    }
    return order.tourId === tour.id;
  });

  // 獲取所有相關的收款記錄（根據 orderFilter 過濾）
  const tourPayments = payments.filter(payment => {
    if (payment.type !== '收款') return false;

    if (orderFilter) {
      return payment.orderId === orderFilter;
    }

    return payment.tourId === tour.id ||
           tourOrders.some(order => order.id === payment.orderId);
  });

  const handleAddPayment = () => {
    if (!newPayment.amount || !newPayment.description) return;

    addPayment({
      type: '收款',
      tourId: tour.id,
      orderId: selectedOrderId || undefined,
      ...newPayment
    });

    setNewPayment({
      amount: 0,
      description: '',
      method: 'bank_transfer',
      status: '已確認'
    });
    setSelectedOrderId('');
    setIsAddDialogOpen(false);
  };

  // 統計數據計算
  const confirmedPayments = tourPayments.filter(p => p.status === '已確認');
  const pendingPayments = tourPayments.filter(p => p.status === '待確認');
  const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = totalConfirmed + totalPending;

  // 計算應收金額 (基於訂單)
  const totalOrderAmount = tourOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const remainingAmount = Math.max(0, totalOrderAmount - totalConfirmed);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      '已確認': 'bg-morandi-green text-white',
      '待確認': 'bg-morandi-gold text-white',
      '已完成': 'bg-morandi-container text-morandi-primary'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  const getMethodBadge = (method: string) => {
    const badges: Record<string, string> = {
      'bank_transfer': 'bg-blue-100 text-blue-800',
      'credit_card': 'bg-purple-100 text-purple-800',
      'cash': 'bg-green-100 text-green-800',
      'check': 'bg-yellow-100 text-yellow-800'
    };
    return badges[method] || 'bg-gray-100 text-gray-800';
  };

  const getMethodDisplayName = (method: string) => {
    const names: Record<string, string> = {
      'bank_transfer': '銀行轉帳',
      'credit_card': '信用卡',
      'cash': '現金',
      'check': '支票'
    };
    return names[method] || method;
  };

  const getPaymentTypeIcon = (type: string) => {
    if (type === '收款') return <TrendingUp size={16} className="text-morandi-green" />;
    if (type === '請款') return <TrendingDown size={16} className="text-morandi-red" />;
    return <CreditCard size={16} className="text-morandi-gold" />;
  };

  return (
    <div className="space-y-6">
      {/* 收款統計 */}
      <div className="bg-morandi-container/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">收款概況</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-green">
              NT$ {totalConfirmed.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">已收款</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-gold">
              NT$ {totalPending.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">待確認</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">
              NT$ {totalPayments.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">總收款</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-red">
              NT$ {remainingAmount.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">待收款</div>
          </div>
        </div>
      </div>


      {/* 收款紀錄表格 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-morandi-container/30">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">日期</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">類型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">金額</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">說明</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">付款方式</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">訂單</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">狀態</th>
              </tr>
            </thead>
            <tbody>
              {tourPayments.length > 0 ? (
                tourPayments.map((payment) => {
                  const relatedOrder = tourOrders.find(order => order.id === payment.orderId);

                  return (
                    <tr key={payment.id} className="border-b border-border/30">
                      <td className="py-3 px-4 text-morandi-primary">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getPaymentTypeIcon(payment.type)}
                          <span className="text-morandi-primary">{payment.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "font-medium",
                          payment.type === '收款' ? 'text-morandi-green' : 'text-morandi-red'
                        )}>
                          {payment.type === '收款' ? '+' : '-'} NT$ {payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-morandi-primary">
                        {payment.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          getMethodBadge(payment.method)
                        )}>
                          {getMethodDisplayName(payment.method)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-morandi-primary">
                        {relatedOrder ? relatedOrder.orderNumber : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          getStatusBadge(payment.status)
                        )}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-morandi-secondary">
                    <DollarSign size={24} className="mx-auto mb-4 opacity-50" />
                    <p>尚無收款紀錄</p>
                    <p className="text-sm mt-1">點擊上方「新增收款」按鈕開始記錄收款</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增收款對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增收款紀錄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">關聯訂單 (選填)</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="">- 不關聯特定訂單 -</option>
                {tourOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">收款金額</label>
              <Input
                type="number"
                value={newPayment.amount || ''}
                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">收款說明</label>
              <Input
                value={newPayment.description}
                onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例：王小明訂金"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">付款方式</label>
              <select
                value={newPayment.method}
                onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="bank_transfer">銀行轉帳</option>
                <option value="credit_card">信用卡</option>
                <option value="cash">現金</option>
                <option value="check">支票</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">確認狀態</label>
              <select
                value={newPayment.status}
                onChange={(e) => setNewPayment(prev => ({ ...prev, status: e.target.value as any }))}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="已確認">已確認</option>
                <option value="待確認">待確認</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleAddPayment}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});