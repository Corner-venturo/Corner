'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTourStore } from '@/stores/tour-store';
import { ShoppingCart, CreditCard, AlertCircle, CheckCircle, Clock, Kanban, List, Search } from 'lucide-react';
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table';
import { OrderKanban } from '@/components/orders/order-kanban';
import { cn } from '@/lib/utils';

const statusFilters = ['全部', '未收款', '部分收款', '已收款'];

export default function OrdersPage() {
  const router = useRouter();
  const { orders, tours, addOrder } = useTourStore();
  const [statusFilter, setStatusFilter] = useState('全部');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderNumber: '',
    tourId: '',
    contactPerson: '',
    salesPerson: '',
    assistant: '',
    totalAmount: 0,
    paidAmount: 0
  });

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === '全部' || order.paymentStatus === statusFilter;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.contactPerson.toLowerCase().includes(searchLower) ||
      order.tourName?.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // 計算待辦事項
  const todos = React.useMemo(() => {
    const result = [];
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
      const tour = tours.find(t => t.id === order.tourId);
      if (!tour) return;

      const departureDate = new Date(tour.departureDate);
      const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 1. 即將出發但未收齊款項
      if (daysUntilDeparture <= 7 && daysUntilDeparture >= 0 && order.paymentStatus !== '已收款') {
        result.push({
          type: 'payment',
          priority: 'high',
          message: `${order.orderNumber} - ${daysUntilDeparture}天後出發，尚未收齊款項`,
          orderId: order.id
        });
      }

      // 2. 未收款超過30天
      if (order.paymentStatus === '未收款') {
        const orderDate = new Date(order.createdAt || today);
        const daysOverdue = Math.ceil((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 30) {
          result.push({
            type: 'overdue',
            priority: 'high',
            message: `${order.orderNumber} - 訂單已${daysOverdue}天未收款`,
            orderId: order.id
          });
        }
      }

      // 3. 部分收款提醒
      if (order.paymentStatus === '部分收款' && daysUntilDeparture <= 14 && daysUntilDeparture >= 0) {
        result.push({
          type: 'partial',
          priority: 'medium',
          message: `${order.orderNumber} - 尚有 NT$ ${order.remainingAmount.toLocaleString()} 未收`,
          orderId: order.id
        });
      }
    });

    return result;
  }, [orders, tours]);


  const handleAddOrder = () => {
    if (!newOrder.orderNumber || !newOrder.tourId || !newOrder.contactPerson) return;

    const selectedTour = tours.find(t => t.id === newOrder.tourId);
    if (!selectedTour) return;

    addOrder({
      ...newOrder,
      code: selectedTour.code,
      tourName: selectedTour.name,
      paymentStatus: newOrder.paidAmount >= newOrder.totalAmount ? '已收款' :
                    newOrder.paidAmount > 0 ? '部分收款' : '未收款',
      remainingAmount: newOrder.totalAmount - newOrder.paidAmount
    });

    setNewOrder({
      orderNumber: '',
      tourId: '',
      contactPerson: '',
      salesPerson: '',
      assistant: '',
      totalAmount: 0,
      paidAmount: 0
    });
    setIsAddDialogOpen(false);
  };



  return (
    <>
      <ResponsiveHeader
        title="訂單管理"
        icon={ShoppingCart}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '訂單管理', href: '/orders' }
        ]}
        tabs={[
          { value: '全部', label: '全部', icon: ShoppingCart },
          { value: '未收款', label: '未收款', icon: AlertCircle },
          { value: '部分收款', label: '部分收款', icon: Clock },
          { value: '已收款', label: '已收款', icon: CheckCircle }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增訂單"
        actions={
          <div className="flex items-center gap-4">
            {todos.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-morandi-red/10 text-morandi-red rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{todos.length} 個待辦</span>
              </div>
            )}
            <div className="text-sm text-morandi-secondary">
              {filteredOrders.length} 筆訂單
            </div>
          </div>
        }
      />

      {/* 待辦事項提醒 */}
      {todos.length > 0 && (
        <div className="mb-6">
          <div className="bg-morandi-red/5 border border-morandi-red/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={20} className="text-morandi-red" />
              <h3 className="font-semibold text-morandi-primary">待辦事項</h3>
            </div>
            <div className="space-y-2">
              {todos.map((todo, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg hover:bg-morandi-container/20 transition-colors cursor-pointer"
                  onClick={() => {
                    // 可以跳轉到訂單詳情
                    const order = orders.find(o => o.id === todo.orderId);
                    if (order) {
                      // 展開該訂單或跳轉
                      // TODO: 實作訂單跳轉功能
                    }
                  }}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    todo.priority === 'high' ? "bg-morandi-red" : "bg-morandi-gold"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm text-morandi-primary">{todo.message}</p>
                    <p className="text-xs text-morandi-secondary mt-1">
                      {todo.type === 'payment' && '💰 收款提醒'}
                      {todo.type === 'overdue' && '⚠️ 逾期提醒'}
                      {todo.type === 'partial' && '💵 尾款提醒'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 訂單列表 */}
      <div className="pb-6">
        <ExpandableOrderTable
          orders={filteredOrders}
          showTourInfo={true}
        />
      </div>

      {/* 新增訂單對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增訂單</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddOrder();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-morandi-primary">訂單編號</label>
              <Input
                value={newOrder.orderNumber}
                onChange={(e) => setNewOrder(prev => ({ ...prev, orderNumber: e.target.value }))}
                placeholder="輸入訂單編號"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">選擇旅遊團</label>
              <select
                value={newOrder.tourId}
                onChange={(e) => setNewOrder(prev => ({ ...prev, tourId: e.target.value }))}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="">請選擇旅遊團</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.code} - {tour.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
              <Input
                value={newOrder.contactPerson}
                onChange={(e) => setNewOrder(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="輸入聯絡人姓名"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">業務</label>
                <Input
                  value={newOrder.salesPerson}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, salesPerson: e.target.value }))}
                  placeholder="業務員"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">助理</label>
                <Input
                  value={newOrder.assistant}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, assistant: e.target.value }))}
                  placeholder="助理"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">訂單金額</label>
                <Input
                  type="number"
                  value={newOrder.totalAmount}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">已收款</label>
                <Input
                  type="number"
                  value={newOrder.paidAmount}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!newOrder.orderNumber || !newOrder.tourId || !newOrder.contactPerson}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增 <span className="ml-1 text-xs opacity-70">(Enter)</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}