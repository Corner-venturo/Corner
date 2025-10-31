'use client';

import { useEffect } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ChannelChat } from '@/components/workspace/ChannelChat';
import { useTourStore, useWorkspaceStore } from '@/stores';
import { useAutoCreateTourChannels } from '@/hooks/use-auto-create-tour-channels';
import { useAutoAddVisaMembers } from '@/hooks/use-auto-add-visa-members';
import { useAutoAddOrderMembers } from '@/hooks/use-auto-add-order-members';
import { useChannelsRealtime } from '@/hooks/useChannelsRealtime';

export default function WorkspacePage() {
  const { items: tours } = useTourStore();
  const { loadWorkspaces, loadChannelGroups, currentWorkspace } = useWorkspaceStore();

  // ✅ 訂閱 Channels Realtime（即時同步）
  useChannelsRealtime();

  // 自動建立旅遊團頻道
  useAutoCreateTourChannels();

  // 自動將所有員工加入簽證頻道
  useAutoAddVisaMembers();

  // 自動將訂單的業務和助理加入旅遊團頻道
  useAutoAddOrderMembers();

  // 載入工作空間（只執行一次）
  useEffect(() => {
    loadWorkspaces();
    // ✅ 只在 mount 時執行一次，不依賴 loadWorkspaces（它每次都是新的函數）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 載入頻道群組（只在 workspace 改變時執行）
  useEffect(() => {
    if (currentWorkspace) {
      loadChannelGroups(currentWorkspace.id);
    }
    // ✅ 只依賴 currentWorkspace.id，不依賴 loadChannelGroups（它每次都是新的函數）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

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
