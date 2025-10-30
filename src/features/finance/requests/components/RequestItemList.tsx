'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { RequestItem, categoryOptions } from '../types';

interface RequestItemListProps {
  items: RequestItem[];
  onRemoveItem: (itemId: string) => void;
  showBatchTotal?: boolean;
  batchCount?: number;
}

export function RequestItemList({ items, onRemoveItem, showBatchTotal, batchCount = 1 }: RequestItemListProps) {
  const total_amount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  if (items.length === 0) return null;

  return (
    <div className="border border-border rounded-md p-4">
      <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目列表</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-morandi-container/10 rounded-md">
            <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
              <div>
                <span className="text-xs text-morandi-secondary">類別:</span>
                <div className="font-medium">
                  {categoryOptions.find(c => c.value === item.category)?.label}
                </div>
              </div>
              <div>
                <span className="text-xs text-morandi-secondary">供應商:</span>
                <div className="font-medium">{item.supplierName}</div>
              </div>
              <div>
                <span className="text-xs text-morandi-secondary">項目:</span>
                <div className="font-medium">{item.description}</div>
              </div>
              <div>
                <span className="text-xs text-morandi-secondary">單價:</span>
                <div className="font-medium">NT$ {item.unit_price.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-xs text-morandi-secondary">數量:</span>
                <div className="font-medium">{item.quantity}</div>
              </div>
              <div>
                <span className="text-xs text-morandi-secondary">小計:</span>
                <div className="font-semibold text-morandi-gold">
                  NT$ {(item.unit_price * item.quantity).toLocaleString()}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveItem(item.id)}
              className="ml-4 text-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-morandi-primary">
            {showBatchTotal ? '單個團總金額:' : '總金額:'}
          </span>
          <span className="text-xl font-bold text-morandi-gold">
            NT$ {total_amount.toLocaleString()}
          </span>
        </div>
        {showBatchTotal && batchCount > 0 && (
          <div className="flex justify-between items-center mt-2 text-sm text-morandi-secondary">
            <span>批次總金額 ({batchCount} 個團):</span>
            <span className="font-semibold text-morandi-primary">
              NT$ {(total_amount * batchCount).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
