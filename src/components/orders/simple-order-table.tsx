'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useOrderStore } from '@/stores';
import { User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '@/stores/types';

interface SimpleOrderTableProps {
  orders: Order[];
  showTourInfo?: boolean;
  className?: string;
}

export const SimpleOrderTable = React.memo(function SimpleOrderTable({
  orders,
  showTourInfo = false,
  className
}: SimpleOrderTableProps) {
  const router = useRouter();
  const orderStore = useOrderStore();
  const deleteOrder = orderStore.delete;

  const handleDeleteOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmMessage = `⚠️ 確定要刪除訂單「${order.order_number}」嗎？\n\n此操作會影響：\n- 團員名單將被移除\n- 收款記錄將被刪除\n- 旅遊團人數統計將更新\n\n此操作無法復原！`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteOrder(order.id);
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
              <th className="text-left py-2.5 px-4 text-xs relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="font-medium text-morandi-secondary">訂單編號</span>
              </th>
              {showTourInfo && (
                <th className="text-left py-2.5 px-4 text-xs relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                  <span className="font-medium text-morandi-secondary">旅遊團</span>
                </th>
              )}
              <th className="text-left py-2.5 px-4 text-xs relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="font-medium text-morandi-secondary">聯絡人</span>
              </th>
              <th className="text-left py-2.5 px-4 text-xs relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="font-medium text-morandi-secondary">業務</span>
              </th>
              <th className="text-left py-2.5 px-4 text-xs relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                <span className="font-medium text-morandi-secondary">狀態</span>
              </th>
              <th className="text-left py-2.5 px-4 text-xs relative">
                <span className="font-medium text-morandi-secondary">操作</span>
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
              orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => {
                    router.push(`/orders/${order.id}`);
                  }}
                  className="relative transition-colors cursor-pointer hover:bg-morandi-container/30"
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
                      order.payment_status === 'paid' ? 'text-morandi-green' :
                      order.payment_status === 'partial' ? 'text-morandi-gold' :
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
                        className="h-10 w-10 p-0 text-morandi-green hover:text-morandi-green hover:bg-morandi-green/10 font-bold text-base"
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
                        className="h-10 w-10 p-0 text-morandi-blue hover:text-morandi-blue hover:bg-morandi-blue/10"
                        title="快速請款"
                      >
                        ¥
                      </Button>

                      {/* 刪除按鈕 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteOrder(order, e)}
                        className="h-10 w-10 p-0 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10"
                        title="刪除訂單"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
