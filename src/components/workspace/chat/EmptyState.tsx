'use client';

import { Hash } from 'lucide-react';

interface EmptyStateProps {
  channelName: string;
}

export function EmptyState({ channelName }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <Hash size={48} className="text-morandi-secondary/50 mb-4" />
      <h3 className="text-lg font-medium text-morandi-primary mb-2">
        歡迎來到 #{channelName}
      </h3>
      <p className="text-morandi-secondary">
        這裡還沒有任何訊息。開始對話吧！
      </p>
    </div>
  );
}
