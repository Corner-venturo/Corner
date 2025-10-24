'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, Image as ImageIcon, FileText, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Message } from '@/stores/workspace-store';

interface ThreadPanelProps {
  rootMessage: Message;
  channelName: string;
  onClose: () => void;
  onSendReply: (content: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => void | Promise<void>;
  formatMessageTime: (dateString: string) => string;
  formatFileSize: (bytes: number) => string;
  downloadFile: (path: string, bucket: string, fileName: string) => void;
  currentUserId?: string;
}

const getAttachmentMeta = (attachment: unknown) => {
  if (typeof window !== 'undefined' && attachment instanceof File) {
    return {
      fileName: attachment.name,
      fileSize: attachment.size,
      fileType: attachment.type,
      path: '',
    };
  }

  const record = attachment as Record<string, unknown> | undefined;
  return {
    fileName: (record?.fileName as string) || (record?.name as string) || '附件',
    fileSize: (record?.fileSize as number) ?? (record?.size as number) ?? 0,
    fileType: (record?.fileType as string) || (record?.type as string) || '',
    path: (record?.path as string) || (record?.url as string) || '',
  };
};

export function ThreadPanel({
  rootMessage,
  channelName,
  onClose,
  onSendReply,
  onReact,
  formatMessageTime,
  formatFileSize,
  downloadFile,
  currentUserId,
}: ThreadPanelProps) {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const replies = useMemo(() => rootMessage.replies || [], [rootMessage]);
  const replyCount = replies.length;

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replyCount, rootMessage.id]);

  useEffect(() => {
    setReplyText('');
  }, [rootMessage.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyText.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await onSendReply(replyText);
      setReplyText('');
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (message: Message, isRoot = false) => {
    const messageReactions = Object.entries(message.reactions || {});
    const messageAttachments = message.attachments || [];

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 group',
          isRoot
            ? 'bg-morandi-container/10 border border-morandi-container/40 rounded-lg p-3'
            : 'p-3 rounded-lg hover:bg-morandi-container/10 transition-colors'
        )}
      >
        <div className="w-9 h-9 bg-gradient-to-br from-morandi-gold/30 to-morandi-gold/10 rounded-md flex items-center justify-center text-sm font-semibold text-morandi-gold shrink-0">
          {message.author?.display_name?.charAt(0) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-morandi-primary text-[15px]">
              {message.author?.display_name || '未知用戶'}
            </span>
            <span className="text-[11px] text-morandi-secondary/80 font-normal">
              {formatMessageTime(message.created_at)}
            </span>
            {message.edited_at && (
              <span className="text-[11px] text-morandi-secondary/60">(已編輯)</span>
            )}
          </div>

          <div className="text-morandi-primary text-[15px] whitespace-pre-wrap leading-[1.46668] break-words">
            {message.content}
          </div>

          {messageAttachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {messageAttachments.map((attachment, index) => {
                const { fileName, fileSize, fileType, path } = getAttachmentMeta(attachment);
                const isImage = (fileType || '').startsWith('image/');
                const sizeLabel = typeof fileSize === 'number' ? formatFileSize(fileSize) : fileSize;

                return (
                  <div
                    key={`${message.id}-attachment-${index}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-morandi-container/10 border border-morandi-container rounded-lg hover:bg-morandi-container/20 transition-colors group/attachment"
                  >
                    {isImage ? (
                      <ImageIcon size={16} className="text-morandi-gold shrink-0" />
                    ) : (
                      <FileText size={16} className="text-morandi-secondary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-morandi-primary truncate max-w-[200px]">
                        {fileName}
                      </p>
                      {fileSize ? (
                        <p className="text-xs text-morandi-secondary">{sizeLabel}</p>
                      ) : null}
                    </div>
                    {path && (
                      <button
                        onClick={() => downloadFile(path, 'workspace-files', fileName)}
                        className="opacity-0 group-hover/attachment:opacity-100 transition-opacity p-1 hover:bg-morandi-gold/10 rounded"
                        title="下載檔案"
                        type="button"
                      >
                        <Download size={14} className="text-morandi-gold" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {messageReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {messageReactions.map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors',
                    users.includes(currentUserId || '')
                      ? 'bg-morandi-gold/20 border-morandi-gold text-morandi-primary'
                      : 'bg-morandi-container/20 border-border text-morandi-secondary hover:bg-morandi-container/30'
                  )}
                  type="button"
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[360px] border-l border-border bg-morandi-container/5 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-morandi-primary">Thread</h3>
          <p className="text-xs text-morandi-secondary">
            #{channelName} ・ {replyCount} 則回覆
          </p>
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {renderMessage(rootMessage, true)}
        <div className="border-t border-morandi-container/30 pt-3 space-y-3">
          {replyCount > 0 ? (
            replies.map((reply) => renderMessage(reply))
          ) : (
            <p className="text-xs text-morandi-secondary">還沒有任何回覆。開始對話吧！</p>
          )}
          <div ref={repliesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border bg-morandi-container/5 p-3 space-y-2">
        <Textarea
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          placeholder="輸入回覆內容..."
          className="min-h-[96px] resize-none"
        />
        <div className="flex items-center justify-end">
          <Button type="submit" size="sm" disabled={isSending || !replyText.trim()}>
            <Send size={14} className="mr-2" />
            發送
          </Button>
        </div>
      </form>
    </div>
  );
}
