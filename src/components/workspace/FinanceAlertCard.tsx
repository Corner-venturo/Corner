'use client';

import { AlertTriangle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { _cn } from '@/lib/utils';
import { useTourStore } from '@/stores';

interface FinanceAlertCardProps {
  tourIds: string[];
  authorName: string;
  createdAt: string;
}

export function FinanceAlertCard({ tourIds, authorName, createdAt }: FinanceAlertCardProps) {
  const { items: tours } = useTourStore();
  const [expanded, setExpanded] = useState(false);

  // 取得選中的旅遊團資料
  const selectedTours = tours.filter(tour => tourIds.includes(tour.id)).map(tour => ({
    ...tour,
    totalCost: tour.total_cost || 0,
    totalRevenue: tour.total_revenue || 0,
    gap: (tour.total_cost || 0) - (tour.total_revenue || 0),
    riskLevel: ((tour.total_cost || 0) - (tour.total_revenue || 0)) > 50000 ? 'high' : 'medium'
  }));

  // 分類訂單
  const criticalTours = selectedTours.filter(t => t.totalCost > 0 && t.totalRevenue === 0);
  const partialTours = selectedTours.filter(t => t.totalRevenue > 0 && t.gap > 0);

  const totalGap = selectedTours.reduce((sum, tour) => sum + tour.gap, 0);

  const _getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const handleSendReminder = (tour: typeof selectedTours[0]) => {
    // 待實作: 發送提醒功能
    alert(`發送收款提醒：${tour.name}`);
  };

  return (
    <div className="card-morandi p-4 space-y-3">
      {/* 標題 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-morandi-gold" size={20} />
          <div>
            <p className="font-semibold text-morandi-primary">
              {authorName} 分享了財務預警訂單
            </p>
            <p className="text-xs text-morandi-secondary mt-0.5">
              {new Date(createdAt).toLocaleString('zh-TW')}
            </p>
          </div>
        </div>
      </div>

      {/* 高風險區：已支出未收款 */}
      {criticalTours.length > 0 && (
        <div className="bg-morandi-red/10 border border-morandi-red/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-morandi-red">
              🔴 已支出未收款（{criticalTours.length}筆）- 優先處理
            </span>
          </div>

          <div className="space-y-2">
            {criticalTours.map(tour => (
              <div
                key={tour.id}
                className="bg-white rounded p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-morandi-primary">
                      {tour.name} <span className="text-xs text-morandi-secondary">#{tour.code}</span>
                    </p>
                    <p className="text-sm text-morandi-secondary mt-1">
                      已支出：<span className="text-morandi-primary font-medium">
                        NT$ {tour.totalCost.toLocaleString()}
                      </span> | 已收：<span className="text-morandi-red font-medium">NT$ 0</span> ⚠️
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSendReminder(tour)}
                    className="btn-morandi-primary !h-8"
                  >
                    <Send size={14} className="mr-1" />
                    催款
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-morandi-red/20">
            <p className="text-sm font-semibold text-morandi-red">
              總計已墊：NT$ {criticalTours.reduce((sum, t) => sum + t.totalCost, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* 中風險區：部分收款 */}
      {partialTours.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-semibold text-morandi-gold hover:text-morandi-primary transition-colors"
          >
            🟡 部分收款（{partialTours.length}筆）- 一般追蹤
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {partialTours.map(tour => (
                <div
                  key={tour.id}
                  className="bg-morandi-container/20 rounded p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-morandi-primary text-sm">
                        {tour.name}
                      </p>
                      <p className="text-xs text-morandi-secondary mt-1">
                        已付 ${(tour.totalCost / 1000).toFixed(0)}k |
                        已收 ${(tour.totalRevenue / 1000).toFixed(0)}k |
                        缺 <span className="text-morandi-red font-medium">
                          ${(tour.gap / 1000).toFixed(0)}k
                        </span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReminder(tour)}
                      className="btn-morandi-secondary !h-8"
                    >
                      提醒
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 底部統計 */}
      <div className="pt-3 border-t border-morandi-gold/20">
        <div className="flex items-center justify-between">
          <p className="text-sm text-morandi-secondary">
            共 {selectedTours.length} 筆訂單
          </p>
          <p className="text-sm font-semibold text-morandi-primary">
            總缺口：<span className="text-morandi-red">NT$ {totalGap.toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
