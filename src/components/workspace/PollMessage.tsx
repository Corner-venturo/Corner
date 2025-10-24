'use client';

import type { ChannelPoll } from '@/types/workspace.types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface PollMessageProps {
  poll: ChannelPoll;
  currentUserId?: string;
  onVote?: (optionId: string) => void;
  onRevoke?: (optionId: string) => void;
}

const formatDeadline = (deadline: string) => {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return '未知時間';
  }

  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function PollMessage({ poll, currentUserId, onVote, onRevoke }: PollMessageProps) {
  const totalVotes = poll.stats?.totalVotes ?? poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  const uniqueVoters = poll.stats?.voterCount ?? new Set(poll.options.flatMap(option => option.votes)).size;
  const userVotes = useMemo(() => {
    if (!currentUserId) return [] as string[];
    return poll.options.filter(option => option.votes.includes(currentUserId)).map(option => option.id);
  }, [currentUserId, poll.options]);

  const pollClosed = useMemo(() => {
    if (!poll.settings.deadline) return false;
    const deadline = new Date(poll.settings.deadline);
    if (Number.isNaN(deadline.getTime())) return false;
    return deadline.getTime() <= Date.now();
  }, [poll.settings.deadline]);

  const allowMultiple = poll.settings.allowMultiple;
  const canInteract = Boolean(onVote) && Boolean(currentUserId) && !pollClosed;

  const handleOptionClick = (optionId: string, hasVoted: boolean) => {
    if (!currentUserId || pollClosed) return;
    if (hasVoted) {
      onRevoke?.(optionId);
    } else {
      onVote?.(optionId);
    }
  };

  return (
    <div className="mt-1 border border-morandi-container rounded-lg bg-white/70 overflow-hidden">
      <div className="p-3 border-b border-morandi-container/60 bg-morandi-container/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-morandi-primary text-[15px] leading-snug">{poll.question}</h4>
            {poll.description && (
              <p className="text-sm text-morandi-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                {poll.description}
              </p>
            )}
          </div>
          {poll.settings.deadline && (
            <span
              className={cn(
                'text-xs font-medium whitespace-nowrap',
                pollClosed ? 'text-morandi-red' : 'text-morandi-secondary'
              )}
            >
              {pollClosed ? '已截止' : '截止'}：{formatDeadline(poll.settings.deadline)}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-morandi-secondary/80">
          {allowMultiple ? '可複選' : '單選'} · {poll.settings.allowAddOptions ? '允許成員新增選項' : '僅限既有選項'} ·{' '}
          {poll.settings.anonymous ? '匿名投票' : '公開票數'}
        </p>
      </div>

      <div className="p-3 space-y-2">
        {poll.options.map(option => {
          const votes = option.votes.length;
          const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
          const hasVoted = userVotes.includes(option.id);

          return (
            <div
              key={option.id}
              className={cn(
                'border border-morandi-container rounded-lg p-3 transition-colors relative overflow-hidden',
                hasVoted ? 'border-morandi-gold/60 bg-morandi-gold/10' : 'bg-white hover:bg-morandi-container/10'
              )}
            >
              <button
                type="button"
                onClick={() => handleOptionClick(option.id, hasVoted)}
                disabled={!canInteract}
                className={cn(
                  'w-full text-left',
                  !canInteract && 'cursor-not-allowed opacity-80'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-morandi-primary font-medium break-words">{option.text}</span>
                  <span className="text-xs text-morandi-secondary flex-shrink-0">
                    {votes} 票 · {percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-morandi-container/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-morandi-gold transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {hasVoted && (
                  <p className="mt-2 text-xs text-morandi-gold">您已投此選項</p>
                )}
              </button>
            </div>
          );
        })}
        {pollClosed && (
          <p className="text-xs text-morandi-secondary/80 text-center pt-2">投票已截止，無法再變更選擇。</p>
        )}
        {!currentUserId && !pollClosed && (
          <p className="text-xs text-morandi-secondary/80 text-center pt-2">登入後即可參與投票。</p>
        )}
      </div>

      <div className="px-3 py-2 bg-morandi-container/15 text-xs text-morandi-secondary flex items-center justify-between">
        <span>總票數：{totalVotes}</span>
        <span>參與人數：{uniqueVoters}</span>
      </div>
    </div>
  );
}
