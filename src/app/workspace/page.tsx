'use client';

import { useEffect } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ChannelChat } from '@/components/workspace/ChannelChat';
import { useTourStore } from '@/stores';

export default function WorkspacePage() {
  const { items: tours } = useTourStore();

  // 🐛 Debug: 監聽旅遊團資料變化（使用快取資料，不重新載入）
  useEffect(() => {
    console.log('📍 WorkspacePage: 旅遊團資料變化', {
      toursCount: tours.length,
      tours: tours.map(t => ({ id: t.id, name: t.name, code: t.code }))
    });
  }, [tours]);

  return (
    <div className="fixed top-[72px] bottom-0 left-[190px] right-0 p-6">
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="工作空間"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '工作空間', href: '/workspace' },
          ]}
        />

        <div className="flex-1 overflow-hidden mt-4">
          <ChannelChat />
        </div>
      </div>
    </div>
  );
}
