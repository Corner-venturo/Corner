'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { useTourStore } from '@/stores/tour-store';
import { TourOverview } from '@/components/tours/tour-overview';
import { TourMembers } from '@/components/tours/tour-members';
import { TourOperations } from '@/components/tours/tour-operations';
import { TourPayments } from '@/components/tours/tour-payments';
import { TourCosts } from '@/components/tours/tour-costs';
import { TourDocuments } from '@/components/tours/tour-documents';
import { TourAddOns } from '@/components/tours/tour-add-ons';
import { TourRefunds } from '@/components/tours/tour-refunds';

// 訂單詳細頁面的分頁配置 - 統一使用與旅遊團詳細頁面相同的標籤
const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'members', label: '團員名單' },
  { value: 'operations', label: '團務' },
  { value: 'addons', label: '加購' },
  { value: 'refunds', label: '退費' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
  { value: 'documents', label: '文件確認' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, tours } = useTourStore();
  const [activeTab, setActiveTab] = useState('overview');

  const orderId = params.orderId as string;
  const order = orders.find(o => o.id === orderId);
  const tour = order ? tours.find(t => t.id === order.tourId) : null;

  if (!order) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">找不到指定的訂單</p>
          </div>
        </ContentContainer>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">找不到相關的旅遊團資料</p>
          </div>
        </ContentContainer>
      </div>
    );
  }

  // 創建針對單一訂單的過濾版本組件
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TourOverview tour={tour} orderFilter={order.id} />;
      case 'members':
        return <TourMembers tour={tour} orderFilter={order.id} />;
      case 'operations':
        return <TourOperations tour={tour} orderFilter={order.id} />;
      case 'addons':
        return <TourAddOns tour={tour} />;
      case 'refunds':
        return <TourRefunds tour={tour} />;
      case 'payments':
        return <TourPayments tour={tour} orderFilter={order.id} />;
      case 'costs':
        return <TourCosts tour={tour} orderFilter={order.id} />;
      case 'documents':
        return <TourDocuments tour={tour} orderFilter={order.id} />;
      default:
        return <TourOverview tour={tour} orderFilter={order.id} />;
    }
  };

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title={`訂單 ${order.orderNumber} - ${tour.name}`}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showBackButton={true}
        onBack={() => router.push('/orders')}
      />

      <div className="px-6 pb-6">
        {renderTabContent()}
      </div>
    </div>
  );
}