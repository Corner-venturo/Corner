'use client';

import { Trash2, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, MessageAttachment } from '@/stores/workspace-store';
import { formatMessageTime, formatFileSize, resolveAttachmentUrl } from './utils';
import { QUICK_REACTIONS } from './constants';
import { downloadFile } from '@/lib/files';

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  onReaction: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageItem({ message, currentUserId, onReaction, onDelete }: MessageItemProps) {
  const handleDownloadAttachment = async (attachment: MessageAttachment) => {
    const fileName = attachment.fileName || attachment.name || '未命名檔案';
    const targetUrl = resolveAttachmentUrl(attachment);

    if (!targetUrl) {
      alert('找不到檔案下載連結');
      return;
    }

    try {
      await downloadFile(targetUrl, fileName);
    } catch (error) {
      console.error('下載附件失敗:', error);
    }
  };

  return (
    <div className="flex gap-3 group hover:bg-morandi-container/5 -mx-2 px-3 py-1.5 rounded transition-colors">
      {/* 用戶頭像 */}
      <div className="w-9 h-9 bg-gradient-to-br from-morandi-gold/30 to-morandi-gold/10 rounded-md flex items-center justify-center text-sm font-semibold text-morandi-gold shrink-0 mt-0.5">
        {message.author?.display_name?.charAt(0) || '?'}
      </div>

      {/* 訊息內容 */}
      <div className="flex-1 min-w-0 relative pt-0.5">
        {/* 訊息標題 */}
        <div className="flex items-baseline gap-2 mb-0.5">
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

        {/* 訊息文字 */}
        <div className="text-morandi-primary text-[15px] whitespace-pre-wrap leading-[1.46668] break-words">
          {message.content}
        </div>

        {/* 附件列表 */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => {
              const mimeType = attachment.mimeType || attachment.fileType || attachment.type || 'application/octet-stream';
              const fileName = attachment.fileName || attachment.name || '未命名檔案';
              const fileSize = typeof attachment.fileSize === 'number'
                ? attachment.fileSize
                : typeof attachment.size === 'number'
                  ? attachment.size
                  : 0;
              const isImage = mimeType.startsWith('image/');
              return (
                <div
                  key={index}
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
                    <p className="text-xs text-morandi-secondary">
                      {formatFileSize(fileSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(attachment)}
                    className="opacity-0 group-hover/attachment:opacity-100 transition-opacity p-1 hover:bg-morandi-gold/10 rounded"
                    title="下載檔案"
                  >
                    <Download size={14} className="text-morandi-gold" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 反應列 */}
        {Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors",
                  users.includes(currentUserId || '')
                    ? "bg-morandi-gold/20 border-morandi-gold text-morandi-primary"
                    : "bg-morandi-container/20 border-border text-morandi-secondary hover:bg-morandi-container/30"
                )}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* 反應按鈕 & 刪除按鈕 - hover 訊息時顯示 */}
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-0.5">
            {QUICK_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                className="w-6 h-6 flex items-center justify-center text-xs hover:bg-morandi-container/30 rounded border border-morandi-container hover:border-morandi-gold/20 transition-all hover:scale-110"
                title={`加上 ${emoji} 反應`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {/* 刪除按鈕 - 只有作者可以刪除 */}
          {currentUserId === message.author_id && (
            <button
              onClick={() => {
                if (confirm('確定要刪除這則訊息嗎？')) {
                  onDelete(message.id);
                }
              }}
              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-morandi-red/10 rounded border border-morandi-container hover:border-morandi-red/40 transition-all hover:scale-110"
              title="刪除訊息"
            >
              <Trash2 size={12} className="text-morandi-red" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
