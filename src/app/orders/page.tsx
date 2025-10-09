'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrderStore, useTourStore } from '@/stores';
import { ShoppingCart, CreditCard, AlertCircle, CheckCircle, Clock, Kanban, List, Search } from 'lucide-react';
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table';
import { OrderKanban } from '@/components/orders/order-kanban';
import { cn } from '@/lib/utils';

const statusFilters = ['全部', '未收款', '部分收款', '已收款'];

export default function OrdersPage() {
  const router = useRouter();
  const { items: orders, create: addOrder } = useOrderStore();
  const { items: tours } = useTourStore();
  const [statusFilter, setStatusFilter] = useState('全部');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    order_number: '',
    tour_id: '',
    contact_person: '',
    salesPerson: '',
    assistant: '',
    total_amount: 0,
    paidAmount: 0
  });

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === '全部' || order.payment_status === statusFilter;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      order.order_number.toLowerCase().includes(searchLower) ||
      order.contact_person.toLowerCase().includes(searchLower) ||
      order.tour_name?.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // 計算待辦事項
  const todos = React.useMemo(() => {
    const result = [];
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
      const tour = tours.find(t => t.id === order.tour_id);
      if (!tour) return;

      const departureDate = new Date(tour.departure_date);
      const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 1. 即將出發但未收齊款項
      if (daysUntilDeparture <= 7 && daysUntilDeparture >= 0 && order.payment_status !== '已收款') {
        result.push({
          type: 'payment',
          priority: 'high',
          message: `${order.order_number} - ${daysUntilDeparture}天後出發，尚未收齊款項`,
          order_id: order.id
        });
      }

      // 2. 未收款超過30天
      if (order.payment_status === '未收款') {
        const orderDate = new Date(order.created_at || today);
        const daysOverdue = Math.ceil((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 30) {
          result.push({
            type: 'overdue',
            priority: 'high',
            message: `${order.order_number} - 訂單已${daysOverdue}天未收款`,
            order_id: order.id
          });
        }
      }

      // 3. 部分收款提醒
      if (order.payment_status === '部分收款' && daysUntilDeparture <= 14 && daysUntilDeparture >= 0) {
        result.push({
          type: 'partial',
          priority: 'medium',
          message: `${order.order_number} - 尚有 NT$ ${order.remaining_amount.toLocaleString()} 未收`,
          order_id: order.id
        });
      }
    });

    return result;
  }, [orders, tours]);


  const handleAddOrder = () => {
    if (!newOrder.order_number || !newOrder.tour_id || !newOrder.contact_person) return;

    const selectedTour = tours.find(t => t.id === newOrder.tour_id);
    if (!selectedTour) return;

    addOrder({
      ...newOrder,
      code: selectedTour.code,
      tour_name: selectedTour.name,
      paymentStatus: newOrder.paid_amount >= newOrder.total_amount ? '已收款' :
                    newOrder.paid_amount > 0 ? '部分收款' : '未收款',
      remainingAmount: newOrder.total_amount - newOrder.paid_amount
    });

    setNewOrder({
      order_number: '',
      tour_id: '',
      contact_person: '',
      salesPerson: '',
      assistant: '',
      total_amount: 0,
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
                    const order = orders.find(o => o.id === todo.order_id);
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
                value={newOrder.order_number}
                onChange={(e) => setNewOrder(prev => ({ ...prev, order_number: e.target.value }))}
                placeholder="輸入訂單編號"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">選擇旅遊團</label>
              <select
                value={newOrder.tour_id}
                onChange={(e) => setNewOrder(prev => ({ ...prev, tour_id: e.target.value }))}
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
                value={newOrder.contact_person}
                onChange={(e) => setNewOrder(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="輸入聯絡人姓名"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">業務</label>
                <Input
                  value={newOrder.sales_person}
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
                  value={newOrder.total_amount}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">已收款</label>
                <Input
                  type="number"
                  value={newOrder.paid_amount}
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
                disabled={!newOrder.order_number || !newOrder.tour_id || !newOrder.contact_person}
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