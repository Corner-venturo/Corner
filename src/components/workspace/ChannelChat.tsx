'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Hash,
  Users,
  Send,
  Plus,
  Settings,
  Smile,
  MoreHorizontal,
  Trash2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Receipt,
  DollarSign,
  CheckSquare,
  Link2,
  TrendingUp,
  Download,
  ShoppingCart
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

// 本地模式下載檔案（暫時停用）
const downloadFile = (path: string, bucket: string, fileName: string) => {
  console.log('📦 本地模式：檔案下載功能暫時停用', { path, bucket, fileName });
  alert('檔案下載功能目前僅支援線上模式');
};

interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by?: string;
  created_at: string;
}

interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  reactions: Record<string, string[]>;
  created_at: string;
  edited_at?: string;
  author?: {
    id: string;
    chinese_name: string;
    avatar?: string;
  };
}

export function ChannelChat() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showShareQuoteDialog, setShowShareQuoteDialog] = useState(false);
  const [showShareTourDialog, setShowShareTourDialog] = useState(false);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  const {
    channels,
    messages,
    currentWorkspace,
    loading,
    loadChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    loadMessages,
    sendMessage,
    updateMessageReactions
  } = useWorkspaceStore();

  const { user } = useAuthStore();

  useEffect(() => {
    console.log('ChannelChat - 用戶狀態:', user);
  }, [user]);

  // 只在 workspace 改變時載入頻道
  useEffect(() => {
    if (currentWorkspace?.id) {
      console.log('載入頻道列表...');
      loadChannels(currentWorkspace.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const defaultChannel = channels.find(c => c.name === 'general') || channels[0];
      setSelectedChannel(defaultChannel);
    }
  }, [channels, selectedChannel]);

  // 當打開設定對話框時，載入當前頻道資訊
  useEffect(() => {
    if (showSettingsDialog && selectedChannel) {
      setEditChannelName(selectedChannel.name);
      setEditChannelDescription(selectedChannel.description || '');
    }
  }, [showSettingsDialog, selectedChannel]);

  // 只在頻道改變時載入訊息
  useEffect(() => {
    if (selectedChannel?.id) {
      console.log('載入訊息列表...', selectedChannel.id);
      loadMessages(selectedChannel.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('嘗試發送訊息:', { messageText, selectedChannel, user, attachedFiles });

    if (!messageText.trim() && attachedFiles.length === 0) {
      console.log('訊息內容為空且無附件');
      return;
    }

    if (!selectedChannel) {
      console.log('未選擇頻道');
      return;
    }

    if (!user) {
      console.log('用戶未登入');
      alert('請先登入才能發送訊息');
      return;
    }

    try {
      setUploadingFiles(true);
      setUploadProgress(0);

      await sendMessage({
        channel_id: selectedChannel.id,
        author_id: user.id,
        content: messageText.trim() || '（傳送了附件）',
        author: {
          id: user.id,
          chinese_name: user.chineseName || '未知用戶',
          avatar: undefined
        }
      }, attachedFiles.length > 0 ? attachedFiles : undefined);

      setMessageText('');
      setAttachedFiles([]);
      setUploadProgress(100);
      console.log('訊息發送成功');
    } catch (error) {
      console.error('發送訊息失敗:', error);
      alert('發送訊息失敗，請稍後再試');
    } finally {
      setUploadingFiles(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !currentWorkspace) return;

    try {
      await createChannel({
        workspace_id: currentWorkspace.id,
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        type: 'public',
        created_by: user?.id
      });
      setNewChannelName('');
      setShowChannelForm(false);
    } catch (error) {
      console.error('建立頻道失敗:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentReactions = { ...message.reactions };
    if (!currentReactions[emoji]) {
      currentReactions[emoji] = [];
    }

    const userIndex = currentReactions[emoji].indexOf(user.id);
    if (userIndex > -1) {
      currentReactions[emoji].splice(userIndex, 1);
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji];
      }
    } else {
      currentReactions[emoji].push(user.id);
    }

    await updateMessageReactions(messageId, currentReactions);
  };

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `昨天 ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MM/dd HH:mm');
    }
  };

  // 檔案驗證設定
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_FILE_TYPES = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt']
  };

  // 檔案驗證函數
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 檢查檔案大小
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `檔案 "${file.name}" 超過 10 MB 限制 (${formatFileSize(file.size)})`
      };
    }

    // 檢查檔案類型
    const isValidType = Object.keys(ALLOWED_FILE_TYPES).some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isValidType) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidExtension = Object.values(ALLOWED_FILE_TYPES)
        .flat()
        .includes(fileExtension);

      if (!isValidExtension) {
        return {
          valid: false,
          error: `不支援的檔案格式 "${file.name}" (僅支援圖片、PDF、Word、Excel、文字檔)`
        };
      }
    }

    return { valid: true };
  };

  // 檔案處理函數
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else if (validation.error) {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }

    // 清空 input value 以允許重複選擇同一檔案
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else if (validation.error) {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach(file => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(validation.error);
        }
      });

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }

      if (validFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 快捷選單操作
  const quickMenuActions = [
    {
      id: 'new-order',
      icon: ShoppingCart,
      label: '新增訂單',
      color: 'text-purple-600',
      action: () => {
        setShowNewOrderDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'share-order',
      icon: ShoppingCart,
      label: '分享訂單',
      color: 'text-indigo-600',
      action: () => {
        setShowShareTourDialog(true);  // 暫時共用對話框，之後改為分享訂單
        setShowQuickMenu(false);
      }
    },
    {
      id: 'share-quote',
      icon: Receipt,
      label: '分享報價單',
      color: 'text-blue-600',
      action: () => {
        setShowShareQuoteDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'new-payment',
      icon: DollarSign,
      label: '新增請款單',
      color: 'text-orange-600',
      action: () => {
        setShowNewPaymentDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'new-receipt',
      icon: DollarSign,
      label: '新增收款單',
      color: 'text-emerald-600',
      action: () => {
        setShowNewReceiptDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'new-task',
      icon: CheckSquare,
      label: '新增任務',
      color: 'text-morandi-gold',
      action: () => {
        setShowNewTaskDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'upload-file',
      icon: Paperclip,
      label: '上傳檔案',
      color: 'text-morandi-secondary',
      action: () => {
        fileInputRef.current?.click();
        setShowQuickMenu(false);
      }
    }
  ];

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false);
      }
    };

    if (showQuickMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickMenu]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex rounded-lg border border-border overflow-hidden bg-white">
      {/* 頻道側邊欄 */}
      <div className="w-64 bg-morandi-container/5 border-r border-morandi-gold/20 flex flex-col shrink-0">
        {/* 工作空間標題 */}
        <div className="px-4 py-3 border-b border-morandi-gold/20 bg-gradient-to-r from-morandi-gold/5 to-transparent">
          <h2 className="font-semibold text-morandi-primary truncate">
            {currentWorkspace?.icon} {currentWorkspace?.name || '工作空間'}
          </h2>
        </div>

        {/* 頻道區塊 */}
        <div className="flex-1 overflow-y-auto">
          {/* 頻道標題 */}
          <div className="px-3 py-2 flex items-center justify-between sticky top-0 bg-morandi-container/5 z-10">
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-morandi-secondary" />
              <span className="text-xs font-semibold text-morandi-secondary uppercase tracking-wider">頻道</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 hover:bg-morandi-gold/10"
              onClick={() => setShowChannelForm(true)}
            >
              <Plus size={12} className="text-morandi-secondary" />
            </Button>
          </div>

          {/* 頻道列表 */}
          <div className="px-2 pb-2 space-y-0.5">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-left rounded text-sm transition-all group",
                  selectedChannel?.id === channel.id
                    ? "bg-morandi-gold/15 text-morandi-primary font-medium"
                    : "text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary"
                )}
              >
                <Hash size={14} className={cn(
                  "shrink-0",
                  selectedChannel?.id === channel.id ? "text-morandi-gold" : "text-morandi-secondary group-hover:text-morandi-gold"
                )} />
                <span className="truncate">{channel.name}</span>
                {/* 未讀訊息數（預留） */}
                {/* <span className="ml-auto text-xs bg-morandi-gold text-white rounded-full px-1.5 py-0.5">3</span> */}
              </button>
            ))}
          </div>
        </div>

        {/* 新增頻道表單 */}
        {showChannelForm && (
          <div className="p-4 border-t border-border">
            <form onSubmit={handleCreateChannel} className="space-y-2">
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="頻道名稱"
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  建立
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowChannelForm(false);
                    setNewChannelName('');
                  }}
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 主要聊天區域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <>
            {/* 頻道標題列 */}
            <div className="p-4 border-b border-border bg-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash size={20} className="text-morandi-gold" />
                  <div>
                    <h3 className="font-medium text-morandi-primary">
                      {selectedChannel.name}
                    </h3>
                    {selectedChannel.description && (
                      <p className="text-sm text-morandi-secondary">
                        {selectedChannel.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setShowMemberSidebar(!showMemberSidebar)}
                  >
                    <Users size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setShowSettingsDialog(true)}
                  >
                    <Settings size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* 訊息與成員區域 */}
            <div className="flex-1 flex min-h-0">
              {/* 訊息區域 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Hash size={48} className="text-morandi-secondary/50 mb-4" />
                  <h3 className="text-lg font-medium text-morandi-primary mb-2">
                    歡迎來到 #{selectedChannel.name}
                  </h3>
                  <p className="text-morandi-secondary">
                    這裡還沒有任何訊息。開始對話吧！
                  </p>
                </div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className="flex gap-3 group hover:bg-morandi-container/5 -mx-2 px-3 py-1.5 rounded transition-colors">
                    {/* 用戶頭像 */}
                    <div className="w-9 h-9 bg-gradient-to-br from-morandi-gold/30 to-morandi-gold/10 rounded-md flex items-center justify-center text-sm font-semibold text-morandi-gold shrink-0 mt-0.5">
                      {(message.author?.chineseName || message.author?.chinese_name)?.charAt(0) || '?'}
                    </div>

                    {/* 訊息內容 */}
                    <div className="flex-1 min-w-0 relative pt-0.5">
                      {/* 訊息標題 */}
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-morandi-primary text-[15px]">
                          {message.author?.chineseName || message.author?.chinese_name || '未知用戶'}
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
                            const isImage = attachment.fileType.startsWith('image/');
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
                                    {attachment.fileName}
                                  </p>
                                  <p className="text-xs text-morandi-secondary">
                                    {formatFileSize(attachment.fileSize)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => downloadFile(attachment.path, 'workspace-files', attachment.fileName)}
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
                              onClick={() => handleReaction(message.id, emoji)}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors",
                                users.includes(user?.id || '')
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

                      {/* 反應按鈕 - hover 訊息時顯示 */}
                      <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {['👍', '❤️', '😄', '😮', '🎉'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className="w-6 h-6 flex items-center justify-center text-xs hover:bg-morandi-container/30 rounded border border-morandi-container hover:border-morandi-gold/40 transition-all hover:scale-110"
                            title={`加上 ${emoji} 反應`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              </div>

              {/* 成員側邊欄 */}
              {showMemberSidebar && (
                <div className="w-64 border-l border-border bg-morandi-container/5 flex flex-col shrink-0">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-medium text-morandi-primary">成員列表</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="text-center text-morandi-secondary text-sm py-4">
                      載入成員列表中...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 輸入區域 */}
            <div
              className={cn(
                "p-4 border-t border-morandi-gold/20 bg-morandi-container/5 shrink-0 transition-colors",
                isDragging && "bg-morandi-gold/10 border-morandi-gold"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* 檔案預覽區 */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <div
                        key={index}
                        className="relative bg-white border border-morandi-container rounded-lg p-2 pr-8 flex items-center gap-2 max-w-xs"
                      >
                        {isImage ? (
                          <ImageIcon size={16} className="text-morandi-gold shrink-0" />
                        ) : (
                          <FileText size={16} className="text-morandi-secondary shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-morandi-primary truncate">{file.name}</p>
                          <p className="text-xs text-morandi-secondary">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-red transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 上傳進度條 */}
              {uploadingFiles && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-morandi-secondary">上傳檔案中...</span>
                    <span className="text-xs text-morandi-secondary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-morandi-container/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-morandi-gold transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex items-center gap-1 relative">
                  {/* 快捷選單按鈕 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10"
                    onClick={() => setShowQuickMenu(!showQuickMenu)}
                  >
                    <Plus size={18} />
                  </Button>

                  {/* 快捷選單 */}
                  {showQuickMenu && (
                    <div
                      ref={quickMenuRef}
                      className="absolute bottom-full left-0 mb-2 bg-white border border-morandi-gold/20 rounded-lg shadow-xl py-1.5 min-w-[220px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      <div className="px-3 py-1.5 border-b border-morandi-container/30">
                        <p className="text-xs font-semibold text-morandi-secondary uppercase tracking-wider">快捷操作</p>
                      </div>
                      {quickMenuActions.map((action, index) => {
                        const Icon = action.icon;
                        const isLast = index === quickMenuActions.length - 1;
                        return (
                          <div key={action.id}>
                            {isLast && <div className="my-1 border-t border-morandi-container/30" />}
                            <button
                              type="button"
                              onClick={action.action}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-morandi-gold/10 transition-all text-left group"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center transition-all",
                                "bg-gradient-to-br from-morandi-container/20 to-morandi-container/5",
                                "group-hover:from-morandi-gold/10 group-hover:to-morandi-gold/5"
                              )}>
                                <Icon size={16} className={cn(action.color, "group-hover:scale-110 transition-transform")} />
                              </div>
                              <span className="text-sm text-morandi-primary font-medium">{action.label}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 附件上傳按鈕 (隱藏的 input) */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                </div>

                <div
                  className="flex-1 relative"
                  ref={messageInputRef}
                  onPaste={handlePaste}
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`在 #${selectedChannel.name} 中輸入訊息...`}
                    className="pr-10 bg-white border-morandi-container"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-morandi-secondary hover:text-morandi-gold transition-colors pointer-events-auto z-10"
                  >
                    <Smile size={16} />
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={(!messageText.trim() && attachedFiles.length === 0) || uploadingFiles}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingFiles ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </form>

              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-morandi-gold/5 border-2 border-dashed border-morandi-gold rounded-lg pointer-events-none">
                  <div className="text-center">
                    <Paperclip size={32} className="mx-auto mb-2 text-morandi-gold" />
                    <p className="text-morandi-gold font-medium">放開以上傳檔案</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash size={48} className="text-morandi-secondary/50 mx-auto mb-4" />
              <p className="text-morandi-secondary">選擇一個頻道開始對話</p>
            </div>
          </div>
        )}
      </div>

      {/* 頻道設定對話框 */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>頻道設定</DialogTitle>
            <DialogDescription>
              管理 #{selectedChannel?.name} 的設定
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">頻道名稱</label>
              <Input
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
                placeholder="頻道名稱"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">頻道描述</label>
              <Input
                value={editChannelDescription}
                onChange={(e) => setEditChannelDescription(e.target.value)}
                placeholder="頻道描述（選填）"
              />
            </div>
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  console.log('刪除按鈕被點擊', { selectedChannel });
                  if (!selectedChannel) {
                    console.log('沒有選擇頻道');
                    return;
                  }

                  const confirmed = confirm(`確定要刪除 #${selectedChannel.name} 頻道嗎？此操作無法復原。`);
                  console.log('確認刪除:', confirmed);

                  if (confirmed) {
                    try {
                      console.log('開始刪除頻道:', selectedChannel.id);
                      await deleteChannel(selectedChannel.id);
                      console.log('頻道刪除成功');
                      setSelectedChannel(null);
                      setShowSettingsDialog(false);
                      alert('頻道已刪除');
                    } catch (error) {
                      console.error('刪除頻道失敗:', error);
                      alert('刪除頻道失敗，請稍後再試');
                    }
                  }
                }}
              >
                <Trash2 size={16} className="mr-2" />
                刪除頻道
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              取消
            </Button>
            <Button onClick={async () => {
              console.log('儲存變更按鈕被點擊');
              if (!selectedChannel) {
                console.log('沒有選擇頻道');
                return;
              }

              if (!editChannelName.trim()) {
                alert('頻道名稱不能為空');
                return;
              }

              try {
                console.log('開始更新頻道:', selectedChannel.id, { name: editChannelName, description: editChannelDescription });
                await updateChannel(selectedChannel.id, {
                  name: editChannelName.toLowerCase().replace(/\s+/g, '-'),
                  description: editChannelDescription.trim() || undefined
                });
                setShowSettingsDialog(false);
                alert('頻道設定已更新');
              } catch (error) {
                console.error('更新頻道失敗:', error);
                alert('更新頻道失敗，請稍後再試');
              }
            }}>
              儲存變更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享報價單對話框 */}
      <Dialog open={showShareQuoteDialog} onOpenChange={setShowShareQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享報價單</DialogTitle>
            <DialogDescription>
              選擇要分享到頻道的報價單
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">報價單編號</label>
              <Input placeholder="輸入報價單編號搜尋..." />
            </div>
            <div className="border border-morandi-container rounded-lg p-3 space-y-2">
              <p className="text-sm text-morandi-secondary">暫無報價單資料</p>
              <p className="text-xs text-morandi-secondary">提示：完整功能將連接報價單系統</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareQuoteDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 實作分享報價單卡片
              console.log('分享報價單卡片');
              setShowShareQuoteDialog(false);
            }}>
              分享到頻道
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享團況對話框 */}
      <Dialog open={showShareTourDialog} onOpenChange={setShowShareTourDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享團況</DialogTitle>
            <DialogDescription>
              選擇要分享到頻道的團況資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">團號</label>
              <Input placeholder="輸入團號搜尋..." />
            </div>
            <div className="border border-morandi-container rounded-lg p-3 space-y-2">
              <p className="text-sm text-morandi-secondary">暫無團況資料</p>
              <p className="text-xs text-morandi-secondary">提示：完整功能將連接團況管理系統</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareTourDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 實作分享團況卡片
              console.log('分享團況卡片');
              setShowShareTourDialog(false);
            }}>
              分享到頻道
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增訂單對話框 */}
      <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增訂單</DialogTitle>
            <DialogDescription>
              建立新訂單並分享到頻道
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">訂單名稱</label>
              <Input placeholder="輸入訂單名稱..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">客戶名稱</label>
              <Input placeholder="輸入客戶名稱..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">金額</label>
              <Input type="number" placeholder="輸入金額..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOrderDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 實作新增訂單
              console.log('新增訂單');
              setShowNewOrderDialog(false);
            }}>
              建立並分享
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增請款單對話框 */}
      <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增請款單</DialogTitle>
            <DialogDescription>
              建立新請款單並分享到頻道
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">請款項目</label>
              <Input placeholder="輸入請款項目..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">請款金額</label>
              <Input type="number" placeholder="輸入請款金額..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">請款原因</label>
              <Input placeholder="輸入請款原因..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 實作新增請款單
              console.log('新增請款單');
              setShowNewPaymentDialog(false);
            }}>
              建立並分享
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增收款單對話框 */}
      <Dialog open={showNewReceiptDialog} onOpenChange={setShowNewReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增收款單</DialogTitle>
            <DialogDescription>
              建立新收款單並分享到頻道
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">收款項目</label>
              <Input placeholder="輸入收款項目..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">收款金額</label>
              <Input type="number" placeholder="輸入收款金額..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">付款人</label>
              <Input placeholder="輸入付款人..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReceiptDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 實作新增收款單
              console.log('新增收款單');
              setShowNewReceiptDialog(false);
            }}>
              建立並分享
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增任務對話框 */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增任務</DialogTitle>
            <DialogDescription>
              建立新任務並分享到頻道
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">任務標題</label>
              <Input placeholder="輸入任務標題..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">任務描述</label>
              <Input placeholder="輸入任務描述..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">指派給</label>
              <Input placeholder="輸入成員名稱..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">截止日期</label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              // TODO: 實作新增任務
              console.log('新增任務');
              setShowNewTaskDialog(false);
            }}>
              建立並分享
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}