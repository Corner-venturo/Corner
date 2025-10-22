'use client';

import { useState } from 'react';
import { MessageSquare, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanvasEditor } from './CanvasEditor';
import { Channel } from '@/stores/workspace-store';

interface ChannelTabsProps {
  channel: Channel;
  children: React.ReactNode; // 對話內容
  headerActions?: React.ReactNode; // 右上角操作按鈕（選填）
}

export function ChannelTabs({ channel, children, headerActions }: ChannelTabsProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'canvas'>('chat');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 分頁標籤 */}
      <div className="h-[52px] border-b border-border bg-white px-6 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                'flex items-center gap-2 px-4 h-[52px] text-sm font-medium transition-colors relative',
                activeTab === 'chat'
                  ? 'text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              <MessageSquare size={16} />
              <span>對話</span>
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-morandi-gold"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('canvas')}
              className={cn(
                'flex items-center gap-2 px-4 h-[52px] text-sm font-medium transition-colors relative',
                activeTab === 'canvas'
                  ? 'text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
            >
              <FileText size={16} />
              <span>畫布</span>
              {activeTab === 'canvas' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-morandi-gold"></div>
              )}
            </button>
          </div>

          {/* 右側操作按鈕 */}
          {headerActions && (
            <div className="flex items-center gap-1">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* 分頁內容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0">{children}</div>
        ) : (
          <CanvasEditor channelId={channel.id} />
        )}
      </div>
    </div>
  );
}
