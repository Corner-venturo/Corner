'use client';

import React, { useState } from 'react';
import { Order, Tour } from '@/stores/types';
import { useOrderStore } from '@/stores';
import { Users, DollarSign, Calendar, User, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OrderKanbanProps {
  orders: Order[];
  tours: Tour[];
  onOrderClick?: (order: Order) => void;
}

type PaymentStatus = 'unpaid' | 'partial' | 'paid';

const columns: Array<{
  id: PaymentStatus;
  label: string;
  color: string;
  icon: React.ElementType;
}> = [
  { id: 'unpaid', label: '未收款', color: 'bg-morandi-gold/10 border-morandi-gold', icon: Clock },
  { id: 'partial', label: '部分收款', color: 'bg-morandi-blue/10 border-morandi-blue', icon: CheckCircle2 },
  { id: 'paid', label: '已收款', color: 'bg-morandi-green/10 border-morandi-green', icon: DollarSign },
];

export function OrderKanban({ orders, tours, onOrderClick }: OrderKanbanProps) {
  const orderStore = useOrderStore();
  const updateOrder = orderStore.update;
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);

  const getOrdersByStatus = (status: PaymentStatus) => {
    return orders.filter(order => order.payment_status === status);
  };

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: PaymentStatus) => {
    if (draggedOrder) {
      updateOrder(draggedOrder.id, { payment_status: status as unknown });
      setDraggedOrder(null);
    }
  };

  const getTourInfo = (order: Order) => {
    return tours.find(t => t.id === order.tour_id);
  };

  const getPaymentProgress = (order: Order) => {
    if (order.total_amount === 0) return 0;
    return (order.paid_amount / order.total_amount) * 100;
  };

  const getDaysUntilDeparture = (tour: Tour | undefined) => {
    if (!tour) return null;
    const today = new Date();
    const departure = new Date(tour.departure_date);
    const days = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnOrders = getOrdersByStatus(column.id);
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className={cn(
              'flex flex-col rounded-xl border-2 p-4 min-h-[600px]',
              column.color
            )}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* 欄位標題 */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <Icon size={18} className="text-morandi-primary" />
                <h3 className="font-semibold text-morandi-primary">{column.label}</h3>
              </div>
              <span className="px-2 py-1 bg-morandi-container rounded-full text-xs font-medium text-morandi-secondary">
                {columnOrders.length}
              </span>
            </div>

            {/* 訂單卡片列表 */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnOrders.map((order) => {
                const tour = getTourInfo(order);
                const progress = getPaymentProgress(order);
                const daysUntil = getDaysUntilDeparture(tour);
                const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0 && order.payment_status !== 'paid';

                return (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={() => handleDragStart(order)}
                    onClick={() => onOrderClick?.(order)}
                    className={cn(
                      'bg-card border border-border rounded-lg p-4 cursor-move hover:shadow-md transition-all',
                      'hover:border-morandi-gold',
                      isUrgent && 'border-morandi-red border-2'
                    )}
                  >
                    {/* 緊急標示 */}
                    {isUrgent && (
                      <div className="flex items-center space-x-1 text-morandi-red text-xs font-medium mb-2">
                        <AlertTriangle size={12} />
                        <span>{daysUntil}天後出發</span>
                      </div>
                    )}

                    {/* 訂單編號 */}
                    <div className="font-mono text-xs text-morandi-secondary mb-2">
                      {order.order_number}
                    </div>

                    {/* 客戶名稱 */}
                    <div className="font-semibold text-morandi-primary mb-2 text-lg">
                      {order.contact_person}
                    </div>

                    {/* 旅遊團資訊 */}
                    {tour && (
                      <div className="text-sm text-morandi-secondary mb-3 space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>{tour.location}</span>
                        </div>
                        <div className="text-xs">
                          {new Date(tour.departure_date).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    )}

                    {/* 人數 */}
                    <div className="flex items-center space-x-2 text-sm text-morandi-primary mb-3">
                      <Users size={14} className="text-morandi-secondary" />
                      <span>{order.member_count} 人</span>
                    </div>

                    {/* 金額資訊 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-morandi-secondary">總金額</span>
                        <span className="font-medium text-morandi-primary">
                          ${order.total_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-morandi-secondary">已收</span>
                        <span className="font-medium text-morandi-green">
                          ${order.paid_amount.toLocaleString()}
                        </span>
                      </div>
                      {order.remaining_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-morandi-secondary">未收</span>
                          <span className="font-medium text-morandi-red">
                            ${order.remaining_amount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* 付款進度條 */}
                      <div className="mt-3">
                        <div className="w-full h-2 bg-morandi-container rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              progress === 100 ? 'bg-morandi-green' :
                              progress >= 50 ? 'bg-morandi-gold' : 'bg-morandi-red'
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-morandi-secondary mt-1 text-right">
                          {progress.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* 業務資訊 */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center space-x-1 text-xs text-morandi-secondary">
                        <User size={12} />
                        <span>{order.sales_person || '未指派'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 空狀態 */}
              {columnOrders.length === 0 && (
                <div className="text-center py-8 text-morandi-secondary">
                  <Icon size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">尚無訂單</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
