'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTourStore, useOrderStore } from '@/stores';
import { ChevronDown, BarChart3, CreditCard, Users, Plus, User, ShoppingCart, DollarSign, Banknote, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExcelMemberTable, MemberTableRef } from '@/components/members/excel-member-table';
import { Order } from '@/stores/types';

interface ExpandableOrderTableProps {
  orders: Order[];
  showTourInfo?: boolean;
  tourDepartureDate?: string; // 用於成員管理的出發日期
  className?: string;
}

const orderTabs = [
  { id: 'overview', label: '總覽', icon: BarChart3 },
  { id: 'payment', label: '付款記錄', icon: CreditCard },
  { id: 'members', label: '成員管理', icon: Users },
];

export const ExpandableOrderTable = React.memo(function ExpandableOrderTable({ orders, showTourInfo = false, tourDepartureDate, className }: ExpandableOrderTableProps) {
  const router = useRouter();
  const tourStore = useTourStore();
  const tours = tourStore.items;
  const orderStore = useOrderStore();
  const deleteOrder = orderStore.delete;
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const memberTableRefs = useRef<Record<string, MemberTableRef | null>>({});

  const toggleOrderExpand = (order_id: string) => {
    setExpandedOrders(prev =>
      prev.includes(order_id)
        ? prev.filter(id => id !== order_id)
        : [...prev, order_id]
    );
    if (!activeTabs[order_id]) {
      setActiveTabs(prev => ({ ...prev, [order_id]: 'overview' }));
    }
  };

  const setActiveTab = (order_id: string, tabId: string) => {
    setActiveTabs(prev => ({ ...prev, [order_id]: tabId }));
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      '已收款': 'bg-morandi-green text-white',
      '部分收款': 'bg-morandi-gold text-white',
      '未收款': 'bg-morandi-red text-white'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  const handleDeleteOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmMessage = `⚠️ 確定要刪除訂單「${order.order_number}」嗎？\n\n此操作會影響：\n- 團員名單將被移除\n- 收款記錄將被刪除\n- 旅遊團人數統計將更新\n\n此操作無法復原！`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteOrder(order.id);
      // 如果訂單展開中，關閉展開
      if (expandedOrders.includes(order.id)) {
        setExpandedOrders(prev => prev.filter(id => id !== order.id));
      }
    } catch (err) {
      console.error('刪除訂單失敗:', err);
      alert('刪除失敗，請稍後再試');
    }
  };

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col", className)}>
      <div className="overflow-x-auto flex-1">
        <table className="w-full h-full">
          <thead className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20">
            <tr className="relative">
              <th className="text-left py-1.5 sm:py-2 px-3 sm:px-4 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="text-[10px] sm:text-xs font-medium text-morandi-secondary">訂單編號</span>
              </th>
              {showTourInfo && (
                <th className="text-left py-1.5 sm:py-2 px-3 sm:px-4 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                  <span className="text-[10px] sm:text-xs font-medium text-morandi-secondary">旅遊團</span>
                </th>
              )}
              <th className="text-left py-1.5 sm:py-2 px-3 sm:px-4 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="text-[10px] sm:text-xs font-medium text-morandi-secondary">聯絡人</span>
              </th>
              <th className="text-left py-1.5 sm:py-2 px-3 sm:px-4 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="text-[10px] sm:text-xs font-medium text-morandi-secondary">業務</span>
              </th>
              <th className="text-left py-1.5 sm:py-2 px-3 sm:px-4 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="text-[10px] sm:text-xs font-medium text-morandi-secondary">狀態</span>
              </th>
              <th className="text-left py-1.5 sm:py-2 px-3 sm:px-4 relative">
                <span className="text-[10px] sm:text-xs font-medium text-morandi-secondary">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <>
                <tr>
                  <td className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-morandi-secondary/50">-</td>
                  {showTourInfo && <td className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-morandi-secondary/50">-</td>}
                  <td className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-morandi-secondary/50">-</td>
                  <td className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-morandi-secondary/50">-</td>
                  <td className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-morandi-secondary/50">-</td>
                  <td className="py-1.5 sm:py-2 px-3 sm:px-4 text-center text-morandi-secondary/50">-</td>
                </tr>
                <tr>
                  <td colSpan={showTourInfo ? 6 : 5} className="py-8">
                  </td>
                </tr>
              </>
            ) : (
              orders.map((order, index) => (
              <React.Fragment key={order.id}>
                <tr
                  onClick={() => toggleOrderExpand(order.id)}
                  onDoubleClick={() => {
                    // 雙擊跳轉到訂單詳細頁面
                    router.push(`/orders/${order.id}`);
                  }}
                  className={cn(
                    "relative transition-colors cursor-pointer",
                    !expandedOrders.includes(order.id) && "hover:bg-morandi-container/30"
                  )}
                >
                  <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                    <div className="text-[10px] sm:text-xs font-medium text-morandi-primary">{order.order_number}</div>
                  </td>

                  {showTourInfo && (
                    <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                      <div className="text-[10px] sm:text-xs font-medium text-morandi-primary">{order.tour_name}</div>
                    </td>
                  )}

                  <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                    <div className="flex items-center text-[10px] sm:text-xs">
                      <User size={14} className="mr-1 text-morandi-secondary" />
                      <span className="font-medium text-morandi-primary">{order.contact_person}</span>
                    </div>
                  </td>

                  <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                    <div className="text-[10px] sm:text-xs text-morandi-primary">{order.sales_person}</div>
                  </td>

                  <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                    <span className={cn(
                      'text-[10px] sm:text-xs font-medium',
                      order.payment_status === '已收款' ? 'text-morandi-green' :
                      order.payment_status === '部分收款' ? 'text-morandi-gold' :
                      'text-morandi-red'
                    )}>
                      {order.payment_status}
                    </span>
                  </td>

                  <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                    <div className="flex items-center space-x-1">
                      {/* 快速收款按鈕 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/finance/payments?order_id=${order.id}&order_number=${order.order_number}&contact_person=${order.contact_person}&amount=${order.remaining_amount}`);
                        }}
                        className="h-7 w-7 p-0 text-morandi-green hover:text-morandi-green hover:bg-morandi-green/10 font-bold text-base"
                        title="快速收款"
                      >
                        $
                      </Button>

                      {/* 快速請款按鈕 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/finance/requests`);
                        }}
                        className="h-7 w-7 p-0 text-morandi-blue hover:text-morandi-blue hover:bg-morandi-blue/10"
                        title="快速請款"
                      >
                        <CreditCard size={14} />
                      </Button>

                      {/* 刪除按鈕 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteOrder(order, e)}
                        className="h-7 w-7 p-0 text-morandi-red hover:text-morandi-red hover:bg-morandi-red/10"
                        title="刪除訂單"
                      >
                        <Trash2 size={14} />
                      </Button>

                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-morandi-secondary transition-transform duration-200",
                          expandedOrders.includes(order.id) && "rotate-180"
                        )}
                      />
                    </div>
                  </td>

                  {index < orders.length - 1 && !expandedOrders.includes(order.id) && (
                    <td className="absolute bottom-0 left-4 right-4 h-[1px] bg-border"></td>
                  )}
                </tr>

                {expandedOrders.includes(order.id) && (
                  <tr>
                    <td colSpan={showTourInfo ? 6 : 5} className="p-0 border-none">
                      <div className="relative">
                        {/* 聚焦效果：左側金色邊條 */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-morandi-gold z-30 rounded-l-lg"></div>

                        <div className="overflow-x-auto ml-1">
                          {/* 分頁標籤 */}
                          <div className="flex border-b border-border overflow-x-auto">
                            <div className="flex min-w-max w-full justify-between">
                              <div className="flex">
                                {orderTabs.map((tab) => {
                                  const is_active = activeTabs[order.id] === tab.id;
                                  return (
                                    <button
                                      key={tab.id}
                                      onClick={() => setActiveTab(order.id, tab.id)}
                                      className={cn(
                                        'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap flex-shrink-0',
                                        'hover:bg-morandi-container/50',
                                        is_active
                                          ? 'text-morandi-primary bg-white border-b-2 border-morandi-gold shadow-sm'
                                          : 'text-morandi-secondary hover:text-morandi-primary'
                                      )}
                                    >
                                      <tab.icon size={16} />
                                      <span>{tab.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* 各分頁的專屬按鈕 */}
                              <div className="flex items-center space-x-2 px-4">
                                {activeTabs[order.id] === 'members' && (
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Button clicked for order:', order.id);
                                      console.log('Ref available:', !!memberTableRefs.current[order.id]);
                                      console.log('All refs:', Object.keys(memberTableRefs.current));
                                      const tableRef = memberTableRefs.current[order.id];
                                      if (tableRef) {
                                        console.log('Calling addRow...');
                                        tableRef.addRow();
                                      } else {
                                        console.log('No ref found for order:', order.id);
                                      }
                                    }}
                                    size="sm"
                                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                                  >
                                    <Plus size={14} className="mr-1" />
                                    新增行
                                  </Button>
                                )}

                                {/* 統一的詳細頁面按鈕 */}
                                <Button
                                  onClick={() => {
                                    // 跳轉到統一的訂單詳細頁面
                                    router.push(`/orders/${order.id}`);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-morandi-container hover:bg-morandi-container text-morandi-secondary hover:text-morandi-primary"
                                >
                                  詳
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* 分頁內容 */}
                          {activeTabs[order.id] === 'members' ? (
                            <ExcelMemberTable
                              ref={(ref) => { if (ref) memberTableRefs.current[order.id] = ref; }}
                              order_id={order.id}
                              departure_date={tourDepartureDate || tours.find((t: any) => t.id === order.tour_id)?.departure_date || ''}
                              member_count={order.member_count}
                            />
                          ) : (
                            <div className="px-6 py-4">
                              {activeTabs[order.id] === 'overview' && (
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-morandi-secondary">基本資訊</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">訂單編號:</span>
                                        <span className="text-morandi-primary">{order.order_number}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">聯絡人:</span>
                                        <span className="text-morandi-primary">{order.contact_person}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">業務:</span>
                                        <span className="text-morandi-primary">{order.sales_person}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">助理:</span>
                                        <span className="text-morandi-primary">{order.assistant}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-morandi-secondary">付款狀態</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">總金額:</span>
                                        <span className="text-morandi-primary font-medium">NT$ {order.total_amount.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">已收款:</span>
                                        <span className="text-morandi-green font-medium">NT$ {order.paid_amount.toLocaleString()}</span>
                                      </div>
                                      {order.remaining_amount > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-morandi-secondary">餘款:</span>
                                          <span className="text-morandi-red font-medium">NT$ {order.remaining_amount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-morandi-secondary">付款狀態:</span>
                                        <span className={cn(
                                          'px-2 py-1 rounded text-xs font-medium',
                                          getPaymentBadge(order.payment_status)
                                        )}>
                                          {order.payment_status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeTabs[order.id] === 'payment' && (
                                <div className="space-y-4">
                                  <div className="border border-border rounded-lg p-4">
                                    <div className="text-center text-morandi-secondary">
                                      <CreditCard size={24} className="mx-auto mb-2 opacity-50" />
                                      <p>付款記錄功能開發中...</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});