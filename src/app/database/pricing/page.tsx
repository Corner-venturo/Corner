'use client';

import { useRouter } from 'next/navigation';
import { Calculator, ArrowLeft, TrendingUp, Percent, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* 標題區域 */}
      <div className="fixed top-0 right-0 left-16 h-18 bg-background border-b border-border z-40 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/database')}
            className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
            title="返回資料庫管理"
          >
            <ArrowLeft size={20} className="text-morandi-secondary" />
          </button>
          <Calculator size={24} className="text-morandi-gold" />
          <h1 className="text-lg font-bold text-morandi-primary">價格管理</h1>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="px-6 pb-6">
        {/* 價格策略卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <span className="text-sm text-morandi-secondary">淡季策略</span>
            </div>
            <h3 className="text-lg font-medium text-morandi-primary mb-2">季節性調整</h3>
            <p className="text-sm text-morandi-secondary mb-4">
              根據淡旺季自動調整價格係數
            </p>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">-15%</div>
              <div className="text-xs text-morandi-secondary">當前折扣</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Percent size={24} className="text-white" />
              </div>
              <span className="text-sm text-morandi-secondary">團體優惠</span>
            </div>
            <h3 className="text-lg font-medium text-morandi-primary mb-2">團體折扣</h3>
            <p className="text-sm text-morandi-secondary mb-4">
              依人數規模提供階梯式折扣
            </p>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">5-20%</div>
              <div className="text-xs text-morandi-secondary">折扣範圍</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-white" />
              </div>
              <span className="text-sm text-morandi-secondary">匯率同步</span>
            </div>
            <h3 className="text-lg font-medium text-morandi-primary mb-2">匯率管理</h3>
            <p className="text-sm text-morandi-secondary mb-4">
              自動同步匯率並更新外幣價格
            </p>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">31.5</div>
              <div className="text-xs text-morandi-secondary">TWD/THB</div>
            </div>
          </div>
        </div>

        {/* 功能開發中提示 */}
        <div className="mt-8 bg-card border border-border rounded-lg p-12">
          <div className="text-center text-morandi-secondary">
            <Calculator size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-morandi-primary mb-2">價格管理功能開發中</h3>
            <p className="mb-4">
              此功能將包括季節性價格調整、團體折扣設定、匯率同步等進階價格管理工具
            </p>
            <Button variant="outline" disabled>
              敬請期待
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}