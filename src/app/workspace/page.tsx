'use client';

import { useEffect } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ChannelChat } from '@/components/workspace/ChannelChat';
import { useWorkspaceChannels } from '@/stores/workspace-store';

export default function WorkspacePage() {
  const { loadWorkspaces, loadChannelGroups, loadChannels, currentWorkspace } = useWorkspaceChannels();

  // 🔥 簡化版：只載入資料，不要自動建立、不要 Realtime（先讓頁面能跑）
  useEffect(() => {
    const init = async () => {
      // Step 1: 載入 workspaces
      await loadWorkspaces();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: 當 workspace 載入後，載入 channels 和 groups
  useEffect(() => {
    if (currentWorkspace) {
      const loadData = async () => {
        await loadChannelGroups(currentWorkspace.id);
        await loadChannels(currentWorkspace.id);
      };
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

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
