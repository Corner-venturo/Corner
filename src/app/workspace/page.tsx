'use client';

import { useEffect } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ChannelChat } from '@/components/workspace/ChannelChat';
import { useTourStore, useWorkspaceStore } from '@/stores';
import { useAutoCreateTourChannels } from '@/hooks/use-auto-create-tour-channels';
import { useAutoAddVisaMembers } from '@/hooks/use-auto-add-visa-members';

export default function WorkspacePage() {
  const { items: tours } = useTourStore();
  const { loadWorkspaces, loadChannelGroups, currentWorkspace } = useWorkspaceStore();

  // 自動建立旅遊團頻道
  useAutoCreateTourChannels();

  // 自動將所有員工加入簽證頻道
  useAutoAddVisaMembers();

  // 載入工作空間
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // 載入頻道群組
  useEffect(() => {
    if (currentWorkspace) {
      loadChannelGroups(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, loadChannelGroups]);

  // 🐛 Debug: 監聽旅遊團資料變化（使用快取資料，不重新載入）
  useEffect(() => {
    console.log('📍 WorkspacePage: 旅遊團資料變化', {
      toursCount: tours.length,
      tours: tours.map(t => ({ id: t.id, name: t.name, code: t.code }))
    });
  }, [tours]);

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="工作空間"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '工作空間', href: '/workspace' },
        ]}
      />

      <div className="flex-1 overflow-hidden">
        <ChannelChat />
      </div>
    </div>
  );
}
