'use client';

import { Hash, Lock, Archive } from 'lucide-react';

import type { Channel } from '@/stores/workspace-store';

import { cn } from '@/lib/utils';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
}

export function ChannelList({ channels, activeChannelId, onSelectChannel }: ChannelListProps) {
  // 分類頻道 - 使用實際的 type 值
  const publicChannels = channels.filter(c => c.type === 'public');
  const privateChannels = channels.filter(c => c.type === 'private');
  const directChannels = channels.filter(c => c.type === 'direct');

  const renderChannel = (channel: Channel) => {
    const is_active = channel.id === activeChannelId;
    const isArchived = (channel as unknown).isArchived; // TODO: Add isArchived to Channel interface

    return (
      <button
        onClick={() => onSelectChannel(channel.id)}
        className={cn(
          'w-full text-left px-3 py-2 text-sm transition-colors rounded-md flex items-center gap-2',
          is_active
            ? 'bg-morandi-gold/10 text-morandi-primary font-medium'
            : 'text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary',
          isArchived && 'opacity-60'
        )}
      >
        {channel.type === 'private' ? (
          <Lock size={14} className="flex-shrink-0" />
        ) : (
          <Hash size={14} className="flex-shrink-0" />
        )}
        <span className="flex-1 truncate">{channel.name}</span>
        {isArchived && <Archive size={12} className="flex-shrink-0" />}
      </button>
    );
  };
  
  return (
    <div className="py-2 space-y-4">
      {/* 公開頻道 */}
      {publicChannels.length > 0 && (
        <div className="px-3">
          <div className="text-xs font-semibold text-morandi-secondary mb-2">公開頻道</div>
          <div className="space-y-0.5">
            {publicChannels.map(channel => (
              <div key={channel.id}>{renderChannel(channel)}</div>
            ))}
          </div>
        </div>
      )}

      {/* 私人頻道 */}
      {privateChannels.length > 0 && (
        <div className="px-3">
          <div className="text-xs font-semibold text-morandi-secondary mb-2">私人頻道</div>
          <div className="space-y-0.5">
            {privateChannels.map(channel => (
              <div key={channel.id}>{renderChannel(channel)}</div>
            ))}
          </div>
        </div>
      )}

      {/* 直接訊息 */}
      {directChannels.length > 0 && (
        <div className="px-3">
          <div className="text-xs font-semibold text-morandi-secondary mb-2">直接訊息</div>
          <div className="space-y-0.5">
            {directChannels.map(channel => (
              <div key={channel.id}>{renderChannel(channel)}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* 空狀態 */}
      {channels.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-morandi-secondary">
          <p>尚無頻道</p>
          <p className="text-xs mt-1">點擊上方 + 建立頻道</p>
        </div>
      )}
    </div>
  );
}
