'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { _Card } from '@/components/ui/card';
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
  Smile,
  Trash2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Receipt,
  DollarSign,
  CheckSquare,
  Download,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceStore, type Message } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAutoCreateTourChannels } from '@/hooks/use-auto-create-tour-channels';
import { useCleanupOrphanChannels } from '@/hooks/use-cleanup-orphan-channels';
import { ChannelSidebar } from './ChannelSidebar';
import { ChannelTabs } from './ChannelTabs';
import { ShareAdvanceDialog } from './ShareAdvanceDialog';
import { AdvanceListCard } from './AdvanceListCard';
import { _FinanceAlertDialog } from './FinanceAlertDialog';
import { FinanceAlert_Card } from './_FinanceAlertCard';
import { ShareOrdersDialog } from './ShareOrdersDialog';
import { OrderListCard } from './OrderListCard';
import { CreateReceiptDialog } from './CreateReceiptDialog';
import { CreatePaymentRequestDialog } from './CreatePaymentRequestDialog';
import { CreatePollDialog, type CreatePollFormValues } from './CreatePollDialog';
import { PollMessage } from './PollMessage';
import type { ChannelPoll } from '@/types/workspace.types';


const downloadFile = (path: string, bucket: string, fileName: string) => {
  console.log('📦 本地模式：檔案下載功能暫時停用', { path, bucket, fileName });
  alert('檔案下載功能目前僅支援線上模式');
};

export function ChannelChat() {
  // ❌ 移除本地 state，改用 store 管理
  // const [selectedChannel, setSelectedChannel] = useState<unknown>(null);
  const [messageText, setMessageText] = useState('');
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showShareQuoteDialog, setShowShareQuoteDialog] = useState(false);
  const [showShareTourDialog, setShowShareTourDialog] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showShareAdvanceDialog, setShowShareAdvanceDialog] = useState(false);
  const [showShareOrdersDialog, setShowShareOrdersDialog] = useState(false);
  const [showCreateReceiptDialog, setShowCreateReceiptDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [showCreatePollDialog, setShowCreatePollDialog] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<unknown>(null);
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState<unknown>(null);
  const [selectedAdvanceListId, setSelectedAdvanceListId] = useState<string>('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [_showChannelForm, setShowChannelForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
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
    selectedChannel,      // ✨ 從 store 取得
    selectChannel,        // ✨ 從 store 取得
    loadChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    loadMessages,
    sendMessage,
    votePollOption,
    revokePollVote,
    updateMessageReactions,
    advanceLists,
    sharedOrderLists,
    loadAdvanceLists,
    loadSharedOrderLists,
    deleteAdvanceList
  } = useWorkspaceStore();

  const { user, currentProfile } = useAuthStore();


  useAutoCreateTourChannels();


  useCleanupOrphanChannels();

  useEffect(() => {
    console.log('ChannelChat - 用戶狀態:', user);
  }, [user]);


  useEffect(() => {
    if (currentWorkspace?.id) {
      console.log('載入頻道列表...');
      loadChannels(currentWorkspace.id);
    }

  }, [currentWorkspace?.id, loadChannels]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const defaultChannel = channels.find(c => c.name === '一般討論') || channels[0];
      selectChannel(defaultChannel);  // ✨ 改用 store 的 selectChannel
    }
  }, [channels, selectedChannel, selectChannel]);


  useEffect(() => {
    if (showSettingsDialog && selectedChannel) {
      setEditChannelName(selectedChannel.name);
      setEditChannelDescription(selectedChannel.description || '');
    }
  }, [showSettingsDialog, selectedChannel]);


  useEffect(() => {
    if (selectedChannel?.id) {

      if (!channelMessages[selectedChannel.id]) {
        console.log('載入訊息列表...', selectedChannel.id);
        setIsLoadingMessages(true);
        Promise.all([
          loadMessages(selectedChannel.id),
          loadAdvanceLists(selectedChannel.id),
          loadSharedOrderLists(selectedChannel.id)
        ]).then(() => {
          setIsLoadingMessages(false);

          setChannelMessages(prev => ({
            ...prev,
            [selectedChannel.id]: messages
          }));
        });
      } else {

        Promise.all([
          loadMessages(selectedChannel.id),
          loadAdvanceLists(selectedChannel.id),
          loadSharedOrderLists(selectedChannel.id)
        ]).then(() => {

          setChannelMessages(prev => ({
            ...prev,
            [selectedChannel.id]: messages
          }));
        });
      }
    }

  }, [selectedChannel?.id, channelMessages, loadMessages, loadAdvanceLists, loadSharedOrderLists, messages]);


  useEffect(() => {
    if (selectedChannel?.id && messages.length > 0) {
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel.id]: messages
      }));
    }
  }, [messages, selectedChannel?.id]);


  const currentMessages = useMemo(() =>
    selectedChannel?.id
      ? (channelMessages[selectedChannel.id] || messages)
      : []
  , [selectedChannel?.id, channelMessages, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

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
        type: 'text',
        author: {
          id: user.id,
          display_name: currentProfile?.display_name || user.display_name || '未知用戶',
          avatar: undefined
        },
        attachments: attachedFiles.length > 0 ? attachedFiles : undefined
      });

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

  const _handleCreateChannel = async (e: React.FormEvent) => {
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

  const handleVotePollOption = useCallback(async (messageId: string, optionId: string) => {
    if (!user) {
      alert('請先登入才能投票');
      return;
    }

    try {
      await votePollOption(messageId, optionId, user.id);
    } catch (error) {
      console.error('投票失敗:', error);
      alert('投票失敗，請稍後再試');
    }
  }, [user, votePollOption]);

  const handleRevokePollOption = useCallback(async (messageId: string, optionId: string) => {
    if (!user) {
      alert('請先登入才能收回投票');
      return;
    }

    try {
      await revokePollVote(messageId, optionId, user.id);
    } catch (error) {
      console.error('收回投票失敗:', error);
      alert('收回投票失敗，請稍後再試');
    }
  }, [user, revokePollVote]);

  const handleCreatePoll = useCallback(async (values: CreatePollFormValues) => {
    if (!selectedChannel) {
      alert('請先選擇頻道');
      return;
    }

    if (!user) {
      alert('請先登入才能建立投票');
      return;
    }

    setIsCreatingPoll(true);

    try {
      const poll: ChannelPoll = {
        id: uuidv4(),
        question: values.question.trim(),
        description: values.description?.trim() || undefined,
        options: values.options.map(option => ({
          id: uuidv4(),
          text: option.trim(),
          votes: [],
        })),
        settings: {
          allowMultiple: values.allowMultiple,
          allowAddOptions: values.allowAddOptions,
          anonymous: values.anonymous,
          deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
        },
        stats: {
          totalVotes: 0,
          voterCount: 0,
        },
        created_by: user.id,
        created_at: new Date().toISOString(),
      };

      await sendMessage({
        channel_id: selectedChannel.id,
        author_id: user.id,
        content: poll.question,
        type: 'poll',
        poll,
        author: {
          id: user.id,
          display_name: currentProfile?.display_name || user.display_name || '未知用戶',
          avatar: undefined,
        },
      });

      setShowCreatePollDialog(false);
    } catch (error) {
      console.error('建立投票失敗:', error);
      alert('建立投票失敗，請稍後再試');
    } finally {
      setIsCreatingPoll(false);
    }
  }, [currentProfile?.display_name, sendMessage, selectedChannel, user]);


  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt']
  };


  const validateFile = (file: File): { valid: boolean; error?: string } => {

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `檔案 "${file.name}" 超過 10 MB 限制 (${formatFileSize(file.size)})`
      };
    }


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


  const quickMenuActions = [
    {
      id: 'share-order',
      icon: Receipt,
      label: '分享待收款',
      color: 'text-indigo-600',
      action: () => {
        setShowShareOrdersDialog(true);
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
      id: 'share-advance',
      icon: Wallet,
      label: '分享代墊清單',
      color: 'text-purple-600',
      action: () => {
        setShowShareAdvanceDialog(true);
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
      id: 'create-poll',
      icon: BarChart3,
      label: '建立投票',
      color: 'text-sky-600',
      action: () => {
        setShowCreatePollDialog(true);
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

  if (loading && channels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex rounded-lg border border-border overflow-hidden bg-white">
      {/* 頻道側邊欄 - 使用新的 ChannelSidebar 組件 */}
      <ChannelSidebar
        selectedChannelId={selectedChannel?.id || null}
        onSelectChannel={(channel) => {
          if (selectedChannel?.id !== channel.id) {
            // 設定切換狀態，產生淡出效果
            setIsSwitching(true);

            // 150ms 後切換頻道
            setTimeout(() => {
              selectChannel(channel);  // ✨ 改用 store 的 selectChannel

              // 再 150ms 後移除切換狀態，產生淡入效果
              setTimeout(() => setIsSwitching(false), 150);
            }, 150);
          }
        }}
      />

      {/* 主要聊天區域 - 使用 ChannelTabs 包裹 */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
        <ChannelTabs
          channel={selectedChannel}
          headerActions={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setShowMemberSidebar(!showMemberSidebar)}
              >
                <Users size={16} />
              </Button>
            </div>
          }
        >

            {/* 訊息與成員區域 */}
            <div className="flex-1 flex min-h-0">
              {/* 訊息區域 */}
              <div className={cn(
                "flex-1 overflow-y-auto p-4 space-y-4 min-h-0 transition-opacity duration-150",
                isSwitching ? "opacity-0" : "opacity-100"
              )}>
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-6 h-6 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
                </div>
              ) : currentMessages.length === 0 ? (
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
                currentMessages.map(message => {
                  const isPollMessage = message.type === 'poll' && Boolean(message.poll);

                  return (
                    <div key={message.id} className="flex gap-3 group hover:bg-morandi-container/5 -mx-2 px-3 py-1.5 rounded transition-colors">
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

                        {isPollMessage && message.poll ? (
                          <PollMessage
                            poll={message.poll}
                            messageId={message.id}
                            currentUserId={user?.id || ''}
                            onVote={optionId => handleVotePollOption(message.id, optionId)}
                            onRevoke={optionId => handleRevokePollOption(message.id, optionId)}
                          />
                        ) : (
                          <div className="text-morandi-primary text-[15px] whitespace-pre-wrap leading-[1.46668] break-words">
                            {message.content}
                          </div>
                        )}

                        {/* 附件列表 */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => {
                              const fileType = attachment.fileType || attachment.type || '';
                              const fileName = attachment.fileName || attachment.name;
                              const fileSize = attachment.fileSize ?? attachment.size;
                              const isImage = fileType.startsWith('image/');
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
                                      {fileSize ? formatFileSize(fileSize) : '未知大小'}
                                    </p>
                                  </div>
                                  {attachment.path && fileName && (
                                    <button
                                      onClick={() => downloadFile(attachment.path, 'workspace-files', fileName)}
                                      className="opacity-0 group-hover/attachment:opacity-100 transition-opacity p-1 hover:bg-morandi-gold/10 rounded"
                                      title="下載檔案"
                                    >
                                      <Download size={14} className="text-morandi-gold" />
                                    </button>
                                  )}
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

                        {/* 反應按鈕 & 刪除按鈕 - hover 訊息時顯示 */}
                        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-0.5">
                            {['👍', '❤️', '😄', '😮', '🎉'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="w-6 h-6 flex items-center justify-center text-xs hover:bg-morandi-container/30 rounded border border-morandi-container hover:border-morandi-gold/20 transition-all hover:scale-110"
                                title={`加上 ${emoji} 反應`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          {/* 刪除按鈕 - 只有作者可以刪除 */}
                          {user?.id === message.author_id && (
                            <button
                              onClick={async () => {
                                if (confirm('確定要刪除這則訊息嗎？')) {
                                  const { deleteMessage } = useWorkspaceStore.getState();
                                  await deleteMessage(message.id);

                                  // 同時更新 local state 中的訊息列表
                                  if (selectedChannel?.id) {
                                    setChannelMessages(prev => ({
                                      ...prev,
                                      [selectedChannel.id]: prev[selectedChannel.id]?.filter(m => m.id !== message.id) || []
                                    }));
                                  }
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
                })
              )}

              {/* 代墊清單卡片 */}
              {advanceLists.map(advanceList => (
                <AdvanceListCard
                  key={advanceList.id}
                  advanceList={advanceList}
                  userName={advanceList.author?.display_name}
                  currentUserId={user?.id || ''}
                  userRole="admin" // TODO: 從實際權限系統取得
                  onCreatePayment={(itemId, item) => {
                    setSelectedAdvanceItem(item);
                    setSelectedAdvanceListId(advanceList.id);
                    setShowCreatePaymentDialog(true);
                  }}
                  onDelete={(listId) => {
                    deleteAdvanceList(listId);
                  }}
                />
              ))}

              {/* 訂單列表卡片 */}
              {sharedOrderLists.map(orderList => (
                <OrderListCard
                  key={orderList.id}
                  orderList={orderList}
                  userName={orderList.author?.display_name}
                  currentUserId={user?.id || ''}
                  userRole="admin" // TODO: 從實際權限系統取得
                  onCreateReceipt={(orderId, order) => {
                    setSelectedOrder(order);
                    setShowCreateReceiptDialog(true);
                  }}
                />
              ))}

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
        </ChannelTabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash size={48} className="text-morandi-secondary/50 mx-auto mb-4" />
              <p className="text-morandi-secondary">選擇一個頻道開始對話</p>
            </div>
          </div>
        )}
      </div>

      {/* 分享代墊對話框 */}
      {showShareAdvanceDialog && selectedChannel && user && (
        <ShareAdvanceDialog
          channelId={selectedChannel.id}
          currentUserId={user.id}
          onClose={() => setShowShareAdvanceDialog(false)}
          onSuccess={() => {
            console.log('代墊已分享');
            setShowShareAdvanceDialog(false);
          }}
        />
      )}

      <CreatePollDialog
        open={showCreatePollDialog}
        onOpenChange={setShowCreatePollDialog}
        onSubmit={handleCreatePoll}
        loading={isCreatingPoll}
      />

      {/* 分享訂單對話框 */}
      {showShareOrdersDialog && selectedChannel && (
        <ShareOrdersDialog
          channelId={selectedChannel.id}
          onClose={() => setShowShareOrdersDialog(false)}
          onSuccess={() => {
            console.log('訂單已分享');
            setShowShareOrdersDialog(false);
            // 重新載入訂單列表
            if (selectedChannel?.id) {
              loadSharedOrderLists(selectedChannel.id);
            }
          }}
        />
      )}

      {/* 建立收款單對話框 */}
      {showCreateReceiptDialog && selectedOrder && (
        <CreateReceiptDialog
          order={selectedOrder}
          onClose={() => {
            setShowCreateReceiptDialog(false);
            setSelectedOrder(null);
          }}
          onSuccess={(receiptId) => {
            console.log('收款單已建立:', receiptId);
            // TODO: 更新訂單的收款狀態
            setShowCreateReceiptDialog(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* 建立請款單對話框（從代墊項目） */}
      {showCreatePaymentDialog && selectedAdvanceItem && selectedAdvanceListId && (
        <CreatePaymentRequestDialog
          items={selectedAdvanceItem}
          listId={selectedAdvanceListId}
          onClose={() => {
            setShowCreatePaymentDialog(false);
            setSelectedAdvanceItem(null);
            setSelectedAdvanceListId('');
          }}
          onSuccess={() => {
            console.log('請款單已建立');
            setShowCreatePaymentDialog(false);
            setSelectedAdvanceItem(null);
            setSelectedAdvanceListId('');
            // 重新載入代墊列表
            if (selectedChannel?.id) {
              loadAdvanceLists(selectedChannel.id);
            }
          }}
        />
      )}

      {/* 頻道設定對話框 - 暫時保留以後實作 */}
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
                      selectChannel(null);  // ✨ 改用 store 的 selectChannel
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