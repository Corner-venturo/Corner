'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { useTourStore } from '@/stores/tour-store';
import { TourOverview } from '@/components/tours/tour-overview';
import { TourOrders } from '@/components/tours/tour-orders';
import { TourMembers } from '@/components/tours/tour-members';
import { TourOperations } from '@/components/tours/tour-operations';
import { TourPayments } from '@/components/tours/tour-payments';
import { TourCosts } from '@/components/tours/tour-costs';
import { TourDocuments } from '@/components/tours/tour-documents';
import { TourAddOns } from '@/components/tours/tour-add-ons';
import { TourRefunds } from '@/components/tours/tour-refunds';

const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'orders', label: '訂單管理' },
  { value: 'members', label: '團員名單' },
  { value: 'operations', label: '團務' },
  { value: 'addons', label: '加購' },
  { value: 'refunds', label: '退費' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
  { value: 'documents', label: '文件確認' },
];

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { tours } = useTourStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [triggerAddOnAdd, setTriggerAddOnAdd] = useState(false);
  const [triggerPaymentAdd, setTriggerPaymentAdd] = useState(false);
  const [triggerRefundAdd, setTriggerRefundAdd] = useState(false);

  const tour = tours.find(t => t.id === params.id);

  if (!tour) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">找不到指定的旅遊團</p>
          </div>
        </ContentContainer>
      </div>
    );
  }

  // 統一的編輯按鈕配置 - 固定位置不跳動
  const getEditButtonConfig = () => {
    // 根據分頁決定按鈕文字 - 保持相同寬度避免畫面跳動
    const getButtonLabel = () => {
      switch (activeTab) {
        case 'operations':
          return '新增欄位';
        case 'addons':
          return '新增加購';
        case 'payments':
          return '新增收款';
        case 'costs':
          return '新增成本';
        case 'refunds':
          return '新增退費';
        default:
          return '新增項目';
      }
    };

    return {
      onAdd: () => {
        // 根據不同分頁執行不同的編輯邏輯
        switch (activeTab) {
          case 'operations':
            // TODO: 新增團務欄位
            break;
          case 'addons':
            setTriggerAddOnAdd(true);
            break;
          case 'payments':
            setTriggerPaymentAdd(true);
            break;
          case 'costs':
            // TODO: 編輯成本支出
            break;
          case 'refunds':
            setTriggerRefundAdd(true);
            break;
          default:
            // 其他分頁暫時不做任何動作
            break;
        }
      },
      addLabel: getButtonLabel()
    };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TourOverview tour={tour} />;
      case 'orders':
        return <TourOrders tour={tour} />;
      case 'members':
        return <TourMembers tour={tour} />;
      case 'operations':
        return <TourOperations tour={tour} />;
      case 'addons':
        return <TourAddOns tour={tour} triggerAdd={triggerAddOnAdd} onTriggerAddComplete={() => setTriggerAddOnAdd(false)} />;
      case 'refunds':
        return <TourRefunds tour={tour} triggerAdd={triggerRefundAdd} onTriggerAddComplete={() => setTriggerRefundAdd(false)} />;
      case 'payments':
        return <TourPayments tour={tour} triggerAdd={triggerPaymentAdd} onTriggerAddComplete={() => setTriggerPaymentAdd(false)} />;
      case 'costs':
        return <TourCosts tour={tour} />;
      case 'documents':
        return <TourDocuments tour={tour} />;
      default:
        return <TourOverview tour={tour} />;
    }
  };

  const buttonConfig = getEditButtonConfig();

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title={`${tour.name} (${tour.code})`}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showBackButton={true}
        onBack={() => router.push('/tours')}
        {...(buttonConfig ? { onAdd: buttonConfig.onAdd, addLabel: buttonConfig.addLabel } : {})}
      />

      <ContentContainer>
        {renderTabContent()}
      </ContentContainer>
    </div>
  );
}