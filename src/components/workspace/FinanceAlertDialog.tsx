'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useTourStore } from '@/stores';

interface FinanceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (selectedTours: string[]) => void;
}

interface FilterOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'spent_not_collected',
    label: '💸 錢已花但沒收（最優先）',
    description: '已請款 > 0 且 收款 = 0',
    icon: <AlertTriangle className="text-morandi-red" size={16} />,
    priority: 'high'
  },
  {
    id: 'low_collection_rate',
    label: '📊 收款進度落後',
    description: '收款率 < 30%',
    icon: <TrendingDown className="text-morandi-gold" size={16} />,
    priority: 'medium'
  },
  {
    id: 'departure_soon',
    label: '⏰ 出發在即未結清',
    description: '出發 < 7天 且有缺口',
    icon: <Calendar className="text-morandi-blue" size={16} />,
    priority: 'low'
  }
];

export function FinanceAlertDialog({ open, onOpenChange, onShare }: FinanceAlertDialogProps) {
  const { items: tours } = useTourStore();
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['spent_not_collected']);
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  const [thresholdAmount, setThresholdAmount] = useState(10000);

  // 計算每個旅遊團的財務狀況
  const toursWithFinance = useMemo(() => {
    return tours.map(tour => {
      const totalCost = tour.total_cost || 0;
      const totalRevenue = tour.total_revenue || 0;
      const gap = totalCost - totalRevenue;
      const collectionRate = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

      // 計算出發天數
      const departureDate = tour.departure_date ? new Date(tour.departure_date) : null;
      const today = new Date();
      const daysUntilDeparture = departureDate
        ? Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      return {
        ...tour,
        totalCost,
        totalRevenue,
        gap,
        collectionRate,
        daysUntilDeparture,
        riskLevel: gap > 50000 ? 'high' : gap > 10000 ? 'medium' : 'low'
      };
    });
  }, [tours]);

  // 根據篩選條件過濾旅遊團
  const filteredTours = useMemo(() => {
    return toursWithFinance.filter(tour => {
      // 基本條件：必須有缺口且超過門檻
      if (tour.gap <= 0 || tour.gap < thresholdAmount) return false;

      // 檢查選中的篩選條件
      const matchesFilter = selectedFilters.some(filterId => {
        switch (filterId) {
          case 'spent_not_collected':
            // 已支出但完全沒收款
            return tour.totalCost > 0 && tour.totalRevenue === 0;

          case 'low_collection_rate':
            // 收款率低於30%
            return tour.collectionRate < 30;

          case 'departure_soon':
            // 7天內出發且有缺口
            return tour.daysUntilDeparture <= 7 && tour.gap > 0;

          default:
            return false;
        }
      });

      return matchesFilter;
    }).sort((a, b) => {
      // 優先顯示高風險訂單
      if (a.riskLevel !== b.riskLevel) {
        const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      // 同等風險按缺口金額排序
      return b.gap - a.gap;
    });
  }, [toursWithFinance, selectedFilters, thresholdAmount]);

  // 計算每個篩選條件匹配的數量
  const filterCounts = useMemo(() => {
    return FILTER_OPTIONS.map(option => ({
      ...option,
      count: toursWithFinance.filter(tour => {
        switch (option.id) {
          case 'spent_not_collected':
            return tour.totalCost > 0 && tour.totalRevenue === 0;
          case 'low_collection_rate':
            return tour.collectionRate < 30 && tour.gap >= thresholdAmount;
          case 'departure_soon':
            return tour.daysUntilDeparture <= 7 && tour.gap > 0;
          default:
            return false;
        }
      }).length
    }));
  }, [toursWithFinance, thresholdAmount]);

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleTourToggle = (tourId: string) => {
    setSelectedTours(prev =>
      prev.includes(tourId)
        ? prev.filter(id => id !== tourId)
        : [...prev, tourId]
    );
  };

  const handleShare = () => {
    if (selectedTours.length === 0) {
      alert('請至少選擇一個訂單');
      return;
    }
    onShare(selectedTours);
    onOpenChange(false);
    setSelectedTours([]);
  };

  const totalGap = filteredTours
    .filter(tour => selectedTours.includes(tour.id))
    .reduce((sum, tour) => sum + tour.gap, 0);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <span className="text-xs px-2 py-0.5 bg-morandi-red/10 text-morandi-red rounded">🔴高風險</span>;
      case 'medium':
        return <span className="text-xs px-2 py-0.5 bg-morandi-gold/10 text-morandi-gold rounded">🟡注意</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-morandi-blue/10 text-morandi-blue rounded">🟢低風險</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-morandi-primary">
            <DollarSign size={20} />
            分享財務預警訂單
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 智能篩選 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-morandi-primary">智能篩選：</h3>
            {filterCounts.map(option => (
              <div
                key={option.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  selectedFilters.includes(option.id)
                    ? "border-morandi-gold/20 bg-morandi-gold/5"
                    : "border-morandi-gold/20 hover:border-morandi-gold/20"
                )}
                onClick={() => handleFilterToggle(option.id)}
              >
                <Checkbox
                  checked={selectedFilters.includes(option.id)}
                  onCheckedChange={() => handleFilterToggle(option.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="font-medium text-sm">{option.label}</span>
                    <span className="text-xs text-morandi-secondary">符合 {option.count} 筆</span>
                  </div>
                  <p className="text-xs text-morandi-secondary mt-1">{option.description}</p>
                </div>
              </div>
            ))}

            {/* 缺口門檻 */}
            <div className="flex items-center gap-3 p-3 border border-morandi-gold/20 rounded-lg">
              <label className="text-sm text-morandi-secondary">缺口門檻：</label>
              <input
                type="number"
                value={thresholdAmount}
                onChange={(e) => setThresholdAmount(parseInt(e.target.value) || 0)}
                className="input-morandi w-32"
                step="1000"
              />
              <span className="text-sm text-morandi-secondary">以上顯示</span>
            </div>
          </div>

          {/* 符合條件的訂單 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-morandi-primary">
              符合條件的訂單： <span className="text-morandi-gold">{filteredTours.length} 筆</span>
            </h3>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredTours.length === 0 ? (
                <p className="text-sm text-morandi-secondary text-center py-4">沒有符合條件的訂單</p>
              ) : (
                filteredTours.map(tour => (
                  <div
                    key={tour.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedTours.includes(tour.id)
                        ? "border-morandi-blue bg-morandi-blue/5"
                        : "border-morandi-gold/20 hover:border-morandi-gold/20"
                    )}
                    onClick={() => handleTourToggle(tour.id)}
                  >
                    <Checkbox
                      checked={selectedTours.includes(tour.id)}
                      onCheckedChange={() => handleTourToggle(tour.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tour.name}</span>
                        <span className="text-xs text-morandi-secondary">{tour.code}</span>
                        {getRiskBadge(tour.riskLevel)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-morandi-secondary">
                        <span>成本：${tour.totalCost.toLocaleString()}</span>
                        <span>收入：${tour.totalRevenue.toLocaleString()}</span>
                        <span className="text-morandi-red font-medium">缺口：${tour.gap.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 底部統計與操作 */}
          <div className="border-t border-morandi-gold/20 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-morandi-secondary">
                已選 <span className="text-morandi-primary font-medium">{selectedTours.length}</span> 筆，
                總缺口 <span className="text-morandi-red font-semibold">NT$ {totalGap.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="btn-morandi-secondary"
              >
                取消
              </Button>
              <Button
                onClick={handleShare}
                disabled={selectedTours.length === 0}
                className="btn-morandi-primary"
              >
                分享並提醒
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
