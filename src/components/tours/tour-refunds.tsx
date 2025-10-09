'use client';

import React, { useState } from 'react';
import { Tour } from '@/stores/types';
import { useTourAddOnStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourRefundsProps {
  tour: Tour;
  triggerAdd?: boolean;
  onTriggerAddComplete?: () => void;
}

export const TourRefunds = React.memo(function TourRefunds({ tour, triggerAdd, onTriggerAddComplete }: TourRefundsProps) {
  // 使用 tourAddOns 相同的 store 結構，但用於退費項目管理
  const { items: tourAddOns, create: addTourAddOn, update: updateTourAddOn, delete: deleteTourAddOn } = useTourAddOnStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRefund, setNewRefund] = useState({
    name: '',
    price: 0,
    description: ''
  });

  // 監聽外部觸發新增
  React.useEffect(() => {
    if (triggerAdd) {
      setIsAddingNew(true);
      onTriggerAddComplete?.();
    }
  }, [triggerAdd, onTriggerAddComplete]);

  // 獲取此旅遊團的退費項目 (使用 tourAddOns 但標記為退費類型)
  const refunds = tourAddOns.filter(item =>
    item.tour_id === tour.id && item.description?.includes('[REFUND]')
  );

  const handleAddNew = () => {
    if (!newRefund.name.trim()) return;

    addTourAddOn({
      tour_id: tour.id,
      name: newRefund.name,
      price: -Math.abs(newRefund.price), // 退費金額為負值
      description: `[REFUND] ${newRefund.description}`, // 標記為退費項目
      is_active: true,
    });

    setNewRefund({ name: '', price: 0, description: '' });
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    deleteTourAddOn(id);
  };

  const toggleActive = (id: string) => {
    const refund = refunds.find(item => item.id === id);
    if (refund) {
      updateTourAddOn(id, { is_active: !refund.is_active });
    }
  };

  return (
    <div className="space-y-6">
      {/* 退費項目列表 */}
      <div className="border border-border rounded-lg overflow-hidden">
        {refunds.length === 0 && !isAddingNew ? (
          <div className="text-center py-12 text-morandi-secondary">
            <CreditCard size={24} className="mx-auto mb-4 opacity-50" />
            <p>尚未設定任何退費項目</p>
            <p className="text-sm mt-1">點擊「新增退費」開始建立</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-morandi-container/30">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">項目名稱</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">退費金額</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">說明</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary">狀態</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary">操作</th>
                </tr>
              </thead>
              <tbody>
                {/* 新增表單行 */}
                {isAddingNew && (
                  <tr className="border-b border-border bg-morandi-red/10">
                    <td className="py-3 px-4">
                      <Input
                        value={newRefund.name}
                        onChange={(e) => setNewRefund({...newRefund, name: e.target.value})}
                        placeholder="退費項目名稱 (如：機票退費、飯店退費)"
                        className="h-8"
                        autoFocus
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={newRefund.price}
                        onChange={(e) => setNewRefund({...newRefund, price: Number(e.target.value)})}
                        placeholder="退費金額"
                        className="h-8"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        value={newRefund.description}
                        onChange={(e) => setNewRefund({...newRefund, description: e.target.value})}
                        placeholder="退費說明（選填）"
                        className="h-8"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-morandi-green text-sm">啟用</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={handleAddNew}
                          size="sm"
                          className="bg-morandi-green hover:bg-morandi-green-hover text-white"
                        >
                          確定
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewRefund({ name: '', price: 0, description: '' });
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          取消
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* 現有項目列表 */}
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b border-border">
                    <td className="py-3 px-4 font-medium text-morandi-primary">
                      {refund.name}
                    </td>
                    <td className="py-3 px-4 text-morandi-red font-medium">
                      -NT$ {Math.abs(refund.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-morandi-secondary text-sm">
                      {refund.description?.replace('[REFUND] ', '') || '無'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleActive(refund.id)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium cursor-pointer',
                          refund.is_active
                            ? 'bg-morandi-green text-white'
                            : 'bg-morandi-container text-morandi-secondary'
                        )}
                      >
                        {refund.is_active ? '啟用' : '停用'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <Button
                          onClick={() => handleDelete(refund.id)}
                          size="sm"
                          variant="ghost"
                          className="text-morandi-red hover:text-morandi-red hover:bg-morandi-red/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 使用說明 */}
      <div className="bg-morandi-container/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-morandi-primary mb-2">使用說明</h4>
        <ul className="text-xs text-morandi-secondary space-y-1">
          <li>• 退費項目可供團員在訂單中選擇申請退費</li>
          <li>• 停用的項目不會顯示給團員選擇，但已申請的仍然有效</li>
          <li>• 退費金額會自動轉換為負值，並在計算中扣除</li>
          <li>• 建議設定常見的退費項目，如機票退費、飯店退費等</li>
        </ul>
      </div>
    </div>
  );
});