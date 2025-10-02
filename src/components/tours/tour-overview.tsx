'use client';

import { Card } from '@/components/ui/card';
import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Tour } from '@/stores/types';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourOverviewProps {
  tour: Tour;
  orderFilter?: string; // 選填：顯示特定訂單的總覽信息
}

export const TourOverview = React.memo(function TourOverview({ tour, orderFilter }: TourOverviewProps) {
  const overviewCards = [
    {
      title: '報價單價格',
      value: `NT$ ${tour.price.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-morandi-gold'
    },
    {
      title: '合約狀態',
      value: tour.contractStatus,
      icon: tour.contractStatus === '已簽署' ? CheckCircle : AlertCircle,
      color: tour.contractStatus === '已簽署' ? 'text-morandi-green' : 'text-morandi-red'
    },
    {
      title: '總收入',
      value: `NT$ ${tour.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-morandi-green'
    },
    {
      title: '總支出',
      value: `NT$ ${tour.totalCost.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-morandi-red'
    },
    {
      title: '淨利潤',
      value: `NT$ ${tour.profit.toLocaleString()}`,
      icon: TrendingUp,
      color: tour.profit >= 0 ? 'text-morandi-green' : 'text-morandi-red'
    },
    {
      title: '團員人數',
      value: '12 人', // 這裡應該從訂單中計算
      icon: Users,
      color: 'text-morandi-gold'
    }
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      '提案': 'bg-morandi-gold text-white',
      '進行中': 'bg-morandi-green text-white',
      '待結案': 'bg-morandi-gold text-white',
      '結案': 'bg-morandi-container text-morandi-secondary',
      '特殊團': 'bg-morandi-red text-white'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  return (
    <div className="space-y-6">
      {/* 基本資訊卡片 */}
      <ContentContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin size={16} className="mr-3 text-morandi-secondary" />
                <span className="text-morandi-primary">目的地：{tour.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-3 text-morandi-secondary" />
                <span className="text-morandi-primary">
                  出發：{tour.departureDate} 至 {tour.returnDate}
                </span>
              </div>
              <div className="flex items-center">
                <FileText size={16} className="mr-3 text-morandi-secondary" />
                <span className="text-morandi-primary">團號：{tour.code}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-3 text-morandi-secondary">狀態：</span>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusBadge(tour.status)
                )}>
                  {tour.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">快速操作</h3>
            <div className="space-y-2">
              <Button className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white justify-start">
                <FileText size={16} className="mr-2" />
                編輯基本資料
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle size={16} className="mr-2" />
                更新合約狀態
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign size={16} className="mr-2" />
                查看財務報表
              </Button>
            </div>
          </div>
        </div>
      </ContentContainer>

      {/* 財務概況 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">財務概況</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overviewCards.map((card, index) => (
            <Card key={index} className="p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">{card.title}</p>
                  <p className="text-xl font-bold text-morandi-primary">{card.value}</p>
                </div>
                <div className={`p-2 rounded-full bg-morandi-container ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ContentContainer>

      {/* 收支明細 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentContainer>
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">收入明細</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-morandi-secondary">訂單收款</span>
              <span className="text-morandi-green">NT$ 300,000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-morandi-secondary">額外費用</span>
              <span className="text-morandi-green">NT$ 50,000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-morandi-secondary">保險費用</span>
              <span className="text-morandi-green">NT$ 30,000</span>
            </div>
            <div className="flex justify-between py-2 font-medium">
              <span className="text-morandi-primary">總收入</span>
              <span className="text-morandi-green">NT$ {tour.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </ContentContainer>

        <ContentContainer>
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">支出明細</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-morandi-secondary">交通費用</span>
              <span className="text-morandi-red">NT$ 150,000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-morandi-secondary">住宿費用</span>
              <span className="text-morandi-red">NT$ 120,000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-morandi-secondary">餐食費用</span>
              <span className="text-morandi-red">NT$ 80,000</span>
            </div>
            <div className="flex justify-between py-2 font-medium">
              <span className="text-morandi-primary">總支出</span>
              <span className="text-morandi-red">NT$ {tour.totalCost.toLocaleString()}</span>
            </div>
          </div>
        </ContentContainer>
      </div>
    </div>
  );
});