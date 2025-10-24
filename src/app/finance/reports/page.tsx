'use client';

import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card } from '@/components/ui/card';
import { useTourStore, useOrderStore } from '@/stores';
// TODO: usePaymentStore deprecated - 財務報表功能未完整實作
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export default function ReportsPage() {
  const { items: tours } = useTourStore();
  const { items: _orders } = useOrderStore();
  const payments: unknown[] = []; // TODO: 實作完整財務報表

  const total_revenue = payments.filter(p => p.type === '收款').reduce((sum, p) => sum + p.amount, 0);
  const totalCosts = payments.filter(p => p.type === '請款').reduce((sum, p) => sum + p.amount, 0);
  const netProfit = total_revenue - totalCosts;

  return (
    <div className="space-y-6 ">
      <ResponsiveHeader
        title="財務報表"
      />

      {/* 財務概覽 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">財務概覽</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">總收入</p>
                <p className="text-2xl font-bold text-morandi-green">
                  NT$ {total_revenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp size={24} className="text-morandi-green" />
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">總支出</p>
                <p className="text-2xl font-bold text-morandi-red">
                  NT$ {totalCosts.toLocaleString()}
                </p>
              </div>
              <TrendingDown size={24} className="text-morandi-red" />
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">淨利潤</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                  NT$ {netProfit.toLocaleString()}
                </p>
              </div>
              <DollarSign size={24} className={netProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'} />
            </div>
          </Card>
        </div>
      </ContentContainer>

      {/* 旅遊團財務分析 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">旅遊團財務分析</h3>
        <div className="space-y-4">
          {tours.map((tour) => (
            <div key={tour.id} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-morandi-primary">{tour.name}</h4>
                  <p className="text-sm text-morandi-secondary">{tour.code}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tour.profit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                    利潤: NT$ {tour.profit.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-morandi-secondary">收入</p>
                  <p className="font-medium text-morandi-green">NT$ {tour.total_revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-morandi-secondary">支出</p>
                  <p className="font-medium text-morandi-red">NT$ {tour.total_cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-morandi-secondary">利潤率</p>
                  <p className="font-medium text-morandi-primary">
                    {tour.total_revenue > 0 ? ((tour.profit / tour.total_revenue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          ))}

          {tours.length === 0 && (
            <div className="text-center py-8 text-morandi-secondary">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>暫無旅遊團財務數據</p>
            </div>
          )}
        </div>
      </ContentContainer>

      {/* 報表功能 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">報表功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card border border-border rounded-lg text-center">
            <PieChart size={32} className="mx-auto mb-2 text-morandi-gold" />
            <p className="font-medium text-morandi-primary mb-2">月度損益表</p>
            <p className="text-sm text-morandi-secondary">功能開發中...</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg text-center">
            <BarChart3 size={32} className="mx-auto mb-2 text-morandi-primary" />
            <p className="font-medium text-morandi-primary mb-2">現金流分析</p>
            <p className="text-sm text-morandi-secondary">功能開發中...</p>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
}