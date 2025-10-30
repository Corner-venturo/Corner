'use client';

import { useEffect } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ChannelChat } from '@/components/workspace/ChannelChat';
import { useTourStore, useWorkspaceStore } from '@/stores';
import { useAutoCreateTourChannels } from '@/hooks/use-auto-create-tour-channels';
import { useAutoAddVisaMembers } from '@/hooks/use-auto-add-visa-members';
import { useAutoCreateCompanyChannel } from '@/hooks/use-auto-create-company-channel';
import { useAutoAddOrderMembers } from '@/hooks/use-auto-add-order-members';
import { useChannelsRealtime } from '@/hooks/useChannelsRealtime';

export default function WorkspacePage() {
  const { items: tours } = useTourStore();
  const { loadWorkspaces, loadChannelGroups, currentWorkspace } = useWorkspaceStore();

  // ✅ 訂閱 Channels Realtime（即時同步）
  useChannelsRealtime();

  // 自動創建公司公告群組和總部辦公室頻道
  useAutoCreateCompanyChannel();

  // 自動建立旅遊團頻道
  useAutoCreateTourChannels();

  // 自動將所有員工加入簽證頻道
  useAutoAddVisaMembers();

  // 自動將訂單的業務和助理加入旅遊團頻道
  useAutoAddOrderMembers();

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

  // 監聽旅遊團資料變化（使用快取資料，不重新載入）
  useEffect(() => {
    // Tour data loaded
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
