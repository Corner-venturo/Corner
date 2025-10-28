'use client';

import React, { useState } from 'react';
import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tour, Payment } from '@/stores/types';
import { useOrderStore } from '@/stores';
import { Receipt, Calendar, Plus, Truck, Hotel, Utensils, MapPin } from 'lucide-react';

interface TourCostsProps {
  tour: Tour;
  orderFilter?: string; // 選填：只顯示特定訂單相關的成本
}

// 擴展 Payment 型別以包含成本專用欄位
interface CostPayment extends Payment {
  category?: string;
  vendor?: string;
  receipt?: string;
}

export const TourCosts = React.memo(function TourCosts({ tour, orderFilter }: TourCostsProps) {
  const { items: orders } = useOrderStore();
  const addPayment = async (_data: any) => { console.warn("addPayment not implemented"); };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCost, setNewCost] = useState({
    amount: 0,
    description: '',
    category: 'transport',
    status: '待確認' as const,
    vendor: ''
  });

  // TODO: 實作 payment store
  const payments: CostPayment[] = [];

  const _tourCosts = payments.filter(payment => {
    if (payment.type !== 'request') return false;

    if (orderFilter) {
      return payment.order_id === orderFilter;
    }

    return payment.tour_id === tour.id;
  });

  const handleAddCost = () => {
    if (!newCost.amount || !newCost.description) return;

    addPayment({
      type: 'request',
      tour_id: tour.id,
      ...newCost
    });

    setNewCost({
      amount: 0,
      description: '',
      category: 'transport',
      status: '待確認',
      vendor: ''
    });
    setIsAddDialogOpen(false);
  };

  // 獲取屬於這個旅遊團的所有訂單
  const tourOrders = orders.filter(order => order.tour_id === tour.id);

  // 獲取所有相關的成本支出記錄
  const costPayments = payments.filter(payment =>
    payment.type === 'request' &&
    (payment.tour_id === tour.id ||
     tourOrders.some(order => order.id === payment.order_id))
  );

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'transport': Truck,
      'accommodation': Hotel,
      'food': Utensils,
      'attraction': MapPin,
      '交通': Truck,
      '住宿': Hotel,
      '餐食': Utensils,
      '景點': MapPin
    };
    return icons[category] || Receipt;
  };

  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      'transport': '交通',
      'accommodation': '住宿',
      'food': '餐食',
      'attraction': '景點',
      'other': '其他'
    };
    return names[category] || category;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      '已確認': 'bg-morandi-green text-white',
      '待確認': 'bg-morandi-gold text-white',
      '已付款': 'bg-morandi-container text-morandi-secondary'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  const getReceiptBadge = (receipt: string) => {
    return receipt === '已上傳'
      ? 'bg-morandi-green text-white'
      : 'bg-morandi-red text-white';
  };

  const totalCosts = costPayments.reduce((sum, cost) => sum + cost.amount, 0);
  const confirmedCosts = costPayments.filter(cost => cost.status === 'confirmed').reduce((sum, cost) => sum + cost.amount, 0);
  const pendingCosts = costPayments.filter(cost => cost.status === 'pending').reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <div className="space-y-6">
      {/* 成本統計 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">成本概況</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-primary">
              NT$ {totalCosts.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">總成本</div>
          </div>
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-green">
              NT$ {confirmedCosts.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">已確認</div>
          </div>
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-gold">
              NT$ {pendingCosts.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">待確認</div>
          </div>
          <div className="bg-morandi-container p-4 rounded-lg">
            <div className="text-2xl font-bold text-morandi-red">
              NT$ {Math.max(0, tour.total_revenue - totalCosts).toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">預估利潤</div>
          </div>
        </div>
      </ContentContainer>

      {/* 分類統計 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">成本分類</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {['transport', 'accommodation', 'food', 'attraction', 'other'].map((category) => {
            const categoryTotal = costPayments
              .filter(cost => cost.category === category)
              .reduce((sum, cost) => sum + cost.amount, 0);
            const Icon = getCategoryIcon(category);
            const displayName = getCategoryDisplayName(category);

            return (
              <div key={category} className="bg-card border border-border p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={20} className="text-morandi-gold" />
                  <div className="text-lg font-bold text-morandi-primary">
                    NT$ {categoryTotal.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-morandi-secondary">{displayName}</div>
              </div>
            );
          })}
        </div>
      </ContentContainer>

      {/* 新增支出按鈕 - 右上角 */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Plus size={16} className="mr-2" />
          新增支出
        </Button>
      </div>

      {/* 成本列表 */}
      <ContentContainer>
        <div className="space-y-4">
          {/* 表格標頭 */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-morandi-container rounded-lg text-sm font-medium text-morandi-secondary">
            <div className="col-span-2">日期</div>
            <div className="col-span-2">金額</div>
            <div className="col-span-2">類別</div>
            <div className="col-span-2">說明</div>
            <div className="col-span-2">供應商</div>
            <div className="col-span-1">收據</div>
            <div className="col-span-1">狀態</div>
          </div>

          {/* 成本項目 */}
          <div className="space-y-2">
            {costPayments.map((cost) => {
              const Icon = getCategoryIcon(cost.category || '');
              const displayCategory = getCategoryDisplayName(cost.category || '');
              const relatedOrder = tourOrders.find(order => order.id === cost.order_id);

              return (
                <div key={cost.id} className="grid grid-cols-12 gap-4 p-4 bg-card border border-border rounded-lg">
                  <div className="col-span-2">
                    <div className="flex items-center text-sm text-morandi-primary">
                      <Calendar size={14} className="mr-1" />
                      {new Date(cost.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-medium text-morandi-red">
                      NT$ {cost.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center text-sm text-morandi-primary">
                      <Icon size={14} className="mr-1" />
                      {displayCategory}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-sm text-morandi-primary">
                      {cost.description}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-sm text-morandi-primary">
                      {cost.vendor || relatedOrder?.order_number || '-'}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReceiptBadge('待上傳')}`}>
                      待上傳
                    </span>
                  </div>

                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(cost.status)}`}>
                      {cost.status}
                    </span>
                  </div>
                </div>
              );
            })}

            {costPayments.length === 0 && (
              <div className="text-center py-12 text-morandi-secondary">
                <Receipt size={24} className="mx-auto mb-4 opacity-50" />
                <p>尚無成本支出記錄</p>
                <p className="text-sm mt-1">點擊上方「新增支出」按鈕開始記錄成本</p>
              </div>
            )}
          </div>
        </div>
      </ContentContainer>

      {/* 新增成本對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增成本支出</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">支出金額</label>
              <Input
                type="number"
                value={newCost.amount}
                onChange={(e) => setNewCost(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">支出說明</label>
              <Input
                value={newCost.description}
                onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例：機票費用"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">類別</label>
              <select
                value={newCost.category}
                onChange={(e) => setNewCost(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="transport">交通</option>
                <option value="accommodation">住宿</option>
                <option value="food">餐食</option>
                <option value="attraction">景點</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">供應商</label>
              <Input
                value={newCost.vendor}
                onChange={(e) => setNewCost(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder="供應商名稱"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleAddCost}
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