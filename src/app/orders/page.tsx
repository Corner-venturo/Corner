'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrderStore, useTourStore } from '@/stores';
import { ShoppingCart, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { SimpleOrderTable } from '@/components/orders/simple-order-table';
import { AddOrderForm } from '@/components/orders/add-order-form';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const router = useRouter();
  const { items: orders, create: addOrder } = useOrderStore();
  const { items: tours } = useTourStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [tourFilter, _setTourFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter;
    const matchesTour = !tourFilter || order.tour_id === tourFilter;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      order.order_number.toLowerCase().includes(searchLower) ||
      order.code?.toLowerCase().includes(searchLower) ||
      order.tour_name?.toLowerCase().includes(searchLower) ||
      order.contact_person.toLowerCase().includes(searchLower) ||
      order.sales_person?.toLowerCase().includes(searchLower) ||
      order.assistant?.toLowerCase().includes(searchLower);

    return matchesStatus && matchesTour && matchesSearch;
  });

  // 計算待辦事項
  const todos = React.useMemo(() => {
    const result: unknown[] = [];
    const today = new Date();
    const _sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
      const tour = tours.find(t => t.id === order.tour_id);
      if (!tour) return;

      const departure_date = new Date(tour.departure_date);
      const daysUntilDeparture = Math.ceil((departure_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 1. 即將出發但未收齊款項
      if (daysUntilDeparture <= 7 && daysUntilDeparture >= 0 && order.payment_status !== 'paid') {
        result.push({
          type: 'payment',
          priority: 'high',
          message: `${order.order_number} - ${daysUntilDeparture}天後出發，尚未收齊款項`,
          order_id: order.id
        });
      }

      // 2. 未收款超過30天
      if (order.payment_status === 'unpaid') {
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
      if (order.payment_status === 'partial' && daysUntilDeparture <= 14 && daysUntilDeparture >= 0) {
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


  const handleAddOrder = (orderData: {
    tour_id: string;
    contact_person: string;
    sales_person: string;
    assistant: string;
    member_count: number;
    total_amount: number;
  }) => {
    const selectedTour = tours.find(t => t.id === orderData.tour_id);
    if (!selectedTour) return;

    // 計算該團的訂單序號
    const tourOrders = orders.filter(o => o.tour_id === orderData.tour_id);
    const nextOrderNumber = tourOrders.length + 1;
    const orderNumber = `${selectedTour.code}-${nextOrderNumber.toString().padStart(2, '0')}`;

    addOrder({
      order_number: orderNumber,
      tour_id: orderData.tour_id,
      code: selectedTour.code,
      tour_name: selectedTour.name,
      contact_person: orderData.contact_person,
      sales_person: orderData.sales_person,
      assistant: orderData.assistant,
      member_count: orderData.member_count,
      total_amount: orderData.total_amount,
      paid_amount: 0,
      payment_status: 'unpaid',
      remaining_amount: orderData.total_amount
    } as unknown);

    setIsAddDialogOpen(false);
  };



  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        {...{
        title: "訂單管理",
        icon: ShoppingCart} as unknown}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '訂單管理', href: '/orders' }
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋訂單..."
        tabs={[
          { value: 'all', label: '全部', icon: ShoppingCart },
          { value: 'unpaid', label: '未收款', icon: AlertCircle },
          { value: 'partial', label: '部分收款', icon: Clock },
          { value: 'paid', label: '已收款', icon: CheckCircle }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增訂單"
        actions={
          todos.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-morandi-red/10 text-morandi-red rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{todos.length} 個待辦</span>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-auto">
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
                    const order = orders.find(o => o.id === todo.order_id);
                    if (order) {
                      router.push(`/orders/${order.id}`);
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
        <SimpleOrderTable
          className="min-h-full"
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
          <AddOrderForm
            onSubmit={handleAddOrder}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}