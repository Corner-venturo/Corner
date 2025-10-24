'use client';

import { useState, useRef, useEffect } from 'react';

import { Send, Paperclip, Smile, MoreVertical, Pin } from 'lucide-react';

import { CanvasView } from './canvas-view';
import { Button } from '@/components/ui/button';
import type { Channel } from '@/stores/workspace-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';

import { cn } from '@/lib/utils';

interface ChannelViewProps {
  channel: Channel;
}

export function ChannelView({ channel }: ChannelViewProps) {
  const {
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    togglePinMessage,
    addReaction,
    activeCanvasTab,
    setActiveCanvasTab
  } = useWorkspaceStore();

  // ✅ 從 auth-store 讀取當前登入者資訊
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';
  const currentUserName = user?.display_name || '未知使用者';

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 獲取該頻道的訊息
  const channelMessages = messages
    .filter(m => m.channel_id === channel.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // 釘選的訊息
  const pinnedMessages = channelMessages.filter(m => m.is_pinned);
  
  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);
  
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // ✅ 使用正確的 author 資料結構
    addMessage({
      channel_id: channel.id,
      author_id: currentUserId,
      content: messageInput.trim(),
      author: {
        id: currentUserId,
        display_name: currentUserName,
      },
    });

    setMessageInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* 頻道標題 */}
      <div className="px-4 h-[57px] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-morandi-primary">{channel.name}</h2>
        <div className="flex items-center gap-2">
          {/* 分頁按鈕 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveCanvasTab('messages')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors rounded',
                activeCanvasTab === 'messages'
                  ? 'bg-morandi-gold/10 text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20'
              )}
            >
              💬 訊息
            </button>
            <button
              onClick={() => setActiveCanvasTab('canvas')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors rounded',
                activeCanvasTab === 'canvas'
                  ? 'bg-morandi-gold/10 text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20'
              )}
            >
              📋 Canvas
            </button>
            <button
              onClick={() => setActiveCanvasTab('settings')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors rounded',
                activeCanvasTab === 'settings'
                  ? 'bg-morandi-gold/10 text-morandi-primary'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20'
              )}
            >
              ⚙️ 設定
            </button>
          </div>

          <Button variant="outline" size="sm" className="h-6 w-6 p-0">
            <MoreVertical size={14} />
          </Button>
        </div>
      </div>
      <div className="mx-4 border-b border-border"></div>
      
      {/* 內容區 */}
      {activeCanvasTab === 'messages' ? (
        <>
          {/* 釘選訊息 */}
          {pinnedMessages.length > 0 && (
            <div className="bg-morandi-gold/5 px-6 py-2">
              <div className="flex items-center gap-2">
                <Pin size={14} className="text-morandi-gold" />
                <span className="text-sm text-morandi-secondary">
                  {pinnedMessages.length} 則釘選訊息
                </span>
              </div>
            </div>
          )}
          
          {/* 訊息列表 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {channelMessages.map((message) => (
              <div 
                key={message.id}
                className={cn(
                  'group relative',
                  message.is_pinned && 'bg-morandi-gold/5 -mx-2 px-2 py-1 rounded'
                )}
              >
                {message.is_pinned && (
                  <div className="absolute -left-6 top-2">
                    <Pin size={12} className="text-morandi-gold" />
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  {/* 頭像 */}
                  <div className="w-8 h-8 rounded-full bg-morandi-gold/20 flex items-center justify-center text-sm font-medium text-morandi-primary flex-shrink-0">
                    {message.author?.display_name?.[0] || '?'}
                  </div>

                  {/* 訊息內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm text-morandi-primary">
                        {message.author?.display_name || '未知使用者'}
                      </span>
                      <span className="text-xs text-morandi-secondary">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-morandi-primary whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    
                    {/* 反應 */}
                    {Object.keys(message.reactions).length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {Object.entries(message.reactions).map(([emoji, users], i) => (
                          <button
                            key={i}
                            onClick={() => addReaction(message.id, emoji, currentUserId)}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors',
                              users.includes(currentUserId)
                                ? 'bg-morandi-gold/20 border border-morandi-gold/20'
                                : 'bg-morandi-container/20 border border-border hover:border-morandi-gold/20'
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="text-morandi-secondary">{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 操作按鈕（懸停顯示） */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => addReaction(message.id, '👍', currentUserId)}
                      className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20 rounded"
                      title="新增反應"
                    >
                      <Smile size={14} />
                    </button>
                    <button
                      onClick={() => togglePinMessage(message.id)}
                      className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20 rounded"
                      title={message.is_pinned ? '取消釘選' : '釘選'}
                    >
                      <Pin size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {channelMessages.length === 0 && (
              <div className="flex items-center justify-center h-full text-morandi-secondary">
                <div className="text-center">
                  <p className="text-sm">開始對話</p>
                  <p className="text-xs mt-1">在下方輸入訊息</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* 訊息輸入區 */}
          <div className="px-6 py-4">
            <div className="border-t border-border mb-4 -mx-2"></div>
            <div className="flex items-end gap-3">
              <button className="p-2 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/20 rounded transition-colors">
                <Paperclip size={20} />
              </button>
              
              <div className="flex-1">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`在 ${channel.name} 傳送訊息...`}
                  className="w-full px-4 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
                  rows={1}
                  style={{
                    minHeight: '40px',
                    maxHeight: '120px',
                  }}
                />
                <div className="text-xs text-morandi-secondary mt-1">
                  Enter 傳送，Shift + Enter 換行
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </>
      ) : activeCanvasTab === 'canvas' ? (
        <CanvasView channel={channel} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-morandi-secondary">
          <p>設定功能開發中...</p>
        </div>
      )}
    </div>
  );
}
