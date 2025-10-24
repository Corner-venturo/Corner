'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  MessageSquarePlus,
  BarChart3,
  FolderOpen
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAutoCreateTourChannels } from '@/hooks/use-auto-create-tour-channels';
import { useCleanupOrphanChannels } from '@/hooks/use-cleanup-orphan-channels';
import { theme } from '@/constants/theme';
import { shallow } from 'zustand/shallow';
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
  const [showThreadComposer, setShowThreadComposer] = useState(false);
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [showFileLibrary, setShowFileLibrary] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadMessage, setThreadMessage] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [fileSearch, setFileSearch] = useState('');
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
    currentWorkspace,
    loading,
    selectedChannel,
    selectChannel,
    loadChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    loadMessages,
    sendMessage,
    updateMessageReactions,
    advanceLists,
    sharedOrderLists,
    loadAdvanceLists,
    loadSharedOrderLists,
    deleteAdvanceList,
    currentMessages,
    messagesLoading
  } = useWorkspaceStore(
    (state) => {
      const channelId = state.selectedChannel?.id;
      return {
        channels: state.channels,
        currentWorkspace: state.currentWorkspace,
        loading: state.loading,
        selectedChannel: state.selectedChannel,
        selectChannel: state.selectChannel,
        loadChannels: state.loadChannels,
        createChannel: state.createChannel,
        updateChannel: state.updateChannel,
        deleteChannel: state.deleteChannel,
        loadMessages: state.loadMessages,
        sendMessage: state.sendMessage,
        updateMessageReactions: state.updateMessageReactions,
        advanceLists: state.advanceLists,
        sharedOrderLists: state.sharedOrderLists,
        loadAdvanceLists: state.loadAdvanceLists,
        loadSharedOrderLists: state.loadSharedOrderLists,
        deleteAdvanceList: state.deleteAdvanceList,
        currentMessages: channelId ? state.channelMessages[channelId] ?? [] : [],
        messagesLoading: channelId ? state.messagesLoading[channelId] ?? false : false
      };
    },
    shallow
  );

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
    if (!selectedChannel?.id) {
      return;
    }

    Promise.all([
      loadMessages(selectedChannel.id),
      loadAdvanceLists(selectedChannel.id),
      loadSharedOrderLists(selectedChannel.id)
    ]).catch((error) => {
      console.error('載入頻道資料失敗:', error);
    });
  }, [selectedChannel?.id, loadMessages, loadAdvanceLists, loadSharedOrderLists]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length]);

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

    const message = currentMessages.find(m => m.id === messageId);
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


  const resetInlinePanels = () => {
    setShowThreadComposer(false);
    setShowPollComposer(false);
    setShowFileLibrary(false);
  };

  const openComposer = (type: 'thread' | 'poll' | 'files') => {
    resetInlinePanels();

    if (type === 'thread') {
      setShowThreadComposer(true);
    }

    if (type === 'poll') {
      setShowPollComposer(true);
    }

    if (type === 'files') {
      setShowFileLibrary(true);
    }

    setShowQuickMenu(false);
  };


  const quickMenuActions = [
    {
      id: 'share-order',
      icon: Receipt,
      label: '分享待收款',
      description: '快速貼上待收款進度',
      iconColor: theme.colors.accent,
      onSelect: () => {
        resetInlinePanels();
        setShowShareOrdersDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'share-quote',
      icon: Receipt,
      label: '分享報價單',
      description: '同步報價單狀態',
      iconColor: theme.colors.accent,
      onSelect: () => {
        resetInlinePanels();
        setShowShareQuoteDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'new-payment',
      icon: DollarSign,
      label: '新增請款單',
      description: '建立請款與財務同步',
      iconColor: theme.colors.success,
      onSelect: () => {
        resetInlinePanels();
        setShowNewPaymentDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'new-receipt',
      icon: DollarSign,
      label: '新增收款單',
      description: '建立收款紀錄',
      iconColor: theme.colors.success,
      onSelect: () => {
        resetInlinePanels();
        setShowNewReceiptDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'share-advance',
      icon: Wallet,
      label: '分享代墊清單',
      description: '關注代墊進度',
      iconColor: theme.colors.accent,
      onSelect: () => {
        resetInlinePanels();
        setShowShareAdvanceDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'new-task',
      icon: CheckSquare,
      label: '新增任務',
      description: '分派待辦事項',
      iconColor: theme.colors.accent,
      onSelect: () => {
        resetInlinePanels();
        setShowNewTaskDialog(true);
        setShowQuickMenu(false);
      }
    },
    {
      id: 'open-thread',
      icon: MessageSquarePlus,
      label: '建立討論串',
      description: '針對訊息展開子討論',
      iconColor: theme.colors.accent,
      onSelect: () => openComposer('thread')
    },
    {
      id: 'create-poll',
      icon: BarChart3,
      label: '建立投票',
      description: '蒐集團隊意見',
      iconColor: theme.colors.accent,
      onSelect: () => openComposer('poll')
    },
    {
      id: 'open-files',
      icon: FolderOpen,
      label: '頻道檔案',
      description: '快速瀏覽共享檔案',
      iconColor: theme.colors.accent,
      onSelect: () => openComposer('files')
    }
  ];

  const composerBackground = isDragging ? theme.colors.accentMuted : theme.colors.surfaceSubtle;

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addPollOption = () => {
    setPollOptions((prev) => [...prev, '']);
  };

  const handleCreateThread = () => {
    console.log('建立討論串', { threadTitle, threadMessage, channelId: selectedChannel?.id });
    resetInlinePanels();
    setThreadTitle('');
    setThreadMessage('');
  };

  const handleCreatePoll = () => {
    console.log('建立投票', { pollQuestion, pollOptions, channelId: selectedChannel?.id });
    resetInlinePanels();
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const channelFiles = useMemo(() => {
    return currentMessages.flatMap((message) =>
      (message.attachments || []).map((attachment, index) => {
        const file = attachment as unknown as Record<string, unknown>;
        const name = (file.fileName as string) || (file.name as string) || '未命名檔案';
        const size = (file.fileSize as number) || (file.size as number) || 0;
        const type = (file.fileType as string) || (file.type as string) || '';
        const pathOrUrl = (file.path as string) || (file.url as string) || '';
        return {
          id: `${message.id}-${(file.id as string) || index}`,
          name,
          size,
          type,
          owner: message.author?.display_name || '未知用戶',
          createdAt: message.created_at,
          path: pathOrUrl,
        };
      })
    );
  }, [currentMessages]);

  const filteredChannelFiles = useMemo(() => {
    const keyword = fileSearch.trim().toLowerCase();
    if (!keyword) {
      return channelFiles;
    }
    return channelFiles.filter((file) => file.name.toLowerCase().includes(keyword));
  }, [channelFiles, fileSearch]);


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
      <div className="flex h-full items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: theme.colors.accent, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <Card
      className="h-full flex overflow-hidden"
      style={{
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        boxShadow: theme.shadows.card
      }}
    >
      {/* 頻道側邊欄 - 使用新的 ChannelSidebar 組件 */}
      <ChannelSidebar
        selectedChannelId={selectedChannel?.id || null}
        onSelectChannel={(channel) => {
          if (selectedChannel?.id !== channel.id) {
            selectChannel(channel);
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
              <div
                className="flex-1 overflow-y-auto space-y-4 min-h-0 transition-opacity duration-150"
                style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.lg }}
              >
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: theme.colors.accent, borderTopColor: 'transparent' }}
                  />
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Hash size={48} className="mb-4" style={{ color: theme.colors.textMuted, opacity: 0.4 }} />
                  <h3 className="mb-2 text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                    歡迎來到 #{selectedChannel.name}
                  </h3>
                  <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                    這裡還沒有任何訊息。開始對話吧！
                  </p>
                </div>
              ) : (
                currentMessages.map(message => (
                  <div
                    key={message.id}
                    className="group -mx-2 flex gap-3 px-3 py-2 transition-colors hover:bg-accent/5"
                    style={{ borderRadius: theme.radius.lg }}
                  >
                    {/* 用戶頭像 */}
                    <div
                      className="mt-0.5 flex h-9 w-9 items-center justify-center text-sm font-semibold"
                      style={{
                        borderRadius: theme.radius.md,
                        background: `linear-gradient(135deg, ${theme.colors.accentMuted}, ${theme.colors.accentStrong})`,
                        color: theme.colors.accent
                      }}
                    >
                      {message.author?.display_name?.charAt(0) || '?'}
                    </div>

                    {/* 訊息內容 */}
                    <div className="flex-1 min-w-0 relative pt-0.5">
                      {/* 訊息標題 */}
                      <div className="mb-1 flex items-baseline gap-2">
                        <span className="text-[15px] font-semibold" style={{ color: theme.colors.textPrimary }}>
                          {message.author?.display_name || '未知用戶'}
                        </span>
                        <span className="text-[11px]" style={{ color: theme.colors.textMuted }}>
                          {formatMessageTime(message.created_at)}
                        </span>
                        {message.edited_at && (
                          <span className="text-[11px]" style={{ color: theme.colors.textMuted, opacity: 0.6 }}>(已編輯)</span>
                        )}
                      </div>

                      {/* 訊息文字 */}
                      <div
                        className="whitespace-pre-wrap break-words text-[15px]"
                        style={{ color: theme.colors.textPrimary, lineHeight: 1.6 }}
                      >
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
                                className="group/attachment inline-flex items-center gap-2 px-3 py-2 transition-colors hover:bg-accent/5"
                                style={{
                                  borderRadius: theme.radius.md,
                                  border: `1px solid ${theme.colors.border}`,
                                  backgroundColor: theme.colors.surfaceSubtle
                                }}
                              >
                                {isImage ? (
                                  <ImageIcon size={16} style={{ color: theme.colors.accent }} className="shrink-0" />
                                ) : (
                                  <FileText size={16} style={{ color: theme.colors.textMuted }} className="shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="max-w-[200px] truncate text-sm" style={{ color: theme.colors.textPrimary }}>
                                    {attachment.fileName}
                                  </p>
                                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                    {formatFileSize(attachment.fileSize)}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={() => downloadFile(attachment.path, 'workspace-files', attachment.fileName)}
                                  className="opacity-0 transition-opacity group-hover/attachment:opacity-100"
                                  style={{ color: theme.colors.accent }}
                                  title="下載檔案"
                                >
                                  <Download size={14} />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 反應列 */}
                      {Object.keys(message.reactions).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(message.reactions).map(([emoji, users]) => {
                            const isReacted = users.includes(user?.id || '');
                            return (
                              <Button
                                key={emoji}
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => handleReaction(message.id, emoji)}
                                className="h-7 rounded-full border px-3 text-xs font-medium transition-all"
                                style={{
                                  borderColor: isReacted ? theme.colors.accent : theme.colors.border,
                                  backgroundColor: isReacted ? theme.colors.accentMuted : 'transparent',
                                  color: isReacted ? theme.colors.accent : theme.colors.textMuted
                                }}
                              >
                                <span>{emoji}</span>
                                <span className="ml-1">{users.length}</span>
                              </Button>
                            );
                          })}
                        </div>
                      )}

                      {/* 反應按鈕 & 刪除按鈕 - hover 訊息時顯示 */}
                      <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex gap-1">
                          {['👍', '❤️', '😄', '😮', '🎉'].map(emoji => (
                            <Button
                              key={emoji}
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => handleReaction(message.id, emoji)}
                              title={`加上 ${emoji} 反應`}
                              className="h-7 w-7 rounded-full border px-0 text-xs transition-all hover:scale-105"
                              style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                        {/* 刪除按鈕 - 只有作者可以刪除 */}
                        {user?.id === message.author_id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="iconSm"
                            onClick={async () => {
                              if (confirm('確定要刪除這則訊息嗎？')) {
                                const { deleteMessage } = useWorkspaceStore.getState();
                                await deleteMessage(message.id);
                              }
                            }}
                            className="rounded-full border transition-all hover:scale-105"
                            style={{
                              borderColor: theme.colors.border,
                              color: theme.colors.destructive
                            }}
                            title="刪除訊息"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
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
                <div
                  className="w-64 shrink-0 border-l flex flex-col"
                  style={{ backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }}
                >
                  <div className="border-b px-4 py-3" style={{ borderColor: theme.colors.border }}
                  >
                    <h3 className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>成員列表</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-4">
                    <div className="text-center text-sm" style={{ color: theme.colors.textMuted }}>
                      載入成員列表中...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 輸入區域 */}
            <div
              className="shrink-0 transition-colors"
              style={{
                padding: theme.spacing.lg,
                borderTop: `1px solid ${theme.colors.border}`,
                backgroundColor: composerBackground
              }}
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
                        className="relative flex max-w-xs items-center gap-2 px-3 py-2"
                        style={{
                          borderRadius: theme.radius.md,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.surfaceElevated
                        }}
                      >
                        {isImage ? (
                          <ImageIcon size={16} style={{ color: theme.colors.accent }} className="shrink-0" />
                        ) : (
                          <FileText size={16} style={{ color: theme.colors.textMuted }} className="shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm" style={{ color: theme.colors.textPrimary }}>{file.name}</p>
                          <p className="text-xs" style={{ color: theme.colors.textMuted }}>{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          style={{ color: theme.colors.textMuted }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {(showThreadComposer || showPollComposer || showFileLibrary) && (
                <div className="mb-4 space-y-3">
                  {showThreadComposer && (
                    <Card
                      className="space-y-3"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceElevated
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MessageSquarePlus size={18} style={{ color: theme.colors.accent }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>建立討論串</p>
                            <p className="text-xs" style={{ color: theme.colors.textMuted }}>與頻道成員開啟專注討論</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowThreadComposer(false)}>關閉</Button>
                      </div>
                      <div className="grid gap-2">
                        <Input
                          placeholder="討論主題"
                          value={threadTitle}
                          onChange={(e) => setThreadTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="說明背景與需求..."
                          value={threadMessage}
                          onChange={(e) => setThreadMessage(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowThreadComposer(false);
                            setThreadTitle('');
                            setThreadMessage('');
                          }}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCreateThread}
                          disabled={!threadTitle.trim() && !threadMessage.trim()}
                        >
                          發布討論串
                        </Button>
                      </div>
                    </Card>
                  )}
                  {showPollComposer && (
                    <Card
                      className="space-y-3"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceElevated
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 size={18} style={{ color: theme.colors.accent }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>建立投票</p>
                            <p className="text-xs" style={{ color: theme.colors.textMuted }}>蒐集團隊意見</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowPollComposer(false)}>關閉</Button>
                      </div>
                      <div className="grid gap-2">
                        <Input
                          placeholder="投票主題"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                        />
                        {pollOptions.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            placeholder={`選項 ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(optionIndex, e.target.value)}
                          />
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addPollOption}
                          className="justify-start text-xs"
                        >
                          新增選項
                        </Button>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowPollComposer(false);
                            setPollQuestion('');
                            setPollOptions(['', '']);
                          }}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCreatePoll}
                          disabled={!pollQuestion.trim() || pollOptions.every(option => !option.trim())}
                        >
                          建立投票
                        </Button>
                      </div>
                    </Card>
                  )}
                  {showFileLibrary && (
                    <Card
                      className="space-y-3"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceElevated
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen size={18} style={{ color: theme.colors.accent }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>頻道檔案</p>
                            <p className="text-xs" style={{ color: theme.colors.textMuted }}>快速瀏覽近期分享</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowFileLibrary(false)}>關閉</Button>
                      </div>
                      <Input
                        placeholder="搜尋檔案..."
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                      />
                      <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                        {filteredChannelFiles.length === 0 ? (
                          <p className="py-6 text-center text-sm" style={{ color: theme.colors.textMuted }}>暫無檔案</p>
                        ) : (
                          filteredChannelFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between rounded-md border px-3 py-2"
                              style={{ borderColor: theme.colors.border }}
                            >
                              <div className="flex items-center gap-2">
                                <FileText size={16} style={{ color: theme.colors.textMuted }} />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{file.name}</span>
                                  <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                                    {formatFileSize(file.size)} · {file.owner}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="iconSm"
                                onClick={() => downloadFile(file.path, 'workspace-files', file.name)}
                                style={{ color: theme.colors.accent }}
                              >
                                <Download size={14} />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* 上傳進度條 */}
              {uploadingFiles && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-xs" style={{ color: theme.colors.textMuted }}>
                    <span>上傳檔案中...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: theme.colors.surfaceSubtle }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`,
                        backgroundColor: theme.colors.accent
                      }}
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
                    className="h-9 w-9 hover:bg-accent/10"
                    style={{ color: showQuickMenu ? theme.colors.accent : theme.colors.textMuted }}
                    onClick={() => setShowQuickMenu(!showQuickMenu)}
                  >
                    <Plus size={18} />
                  </Button>

                  {/* 快捷選單 */}
                  {showQuickMenu && (
                    <Card
                      ref={quickMenuRef}
                      className="absolute bottom-full left-0 mb-2 min-w-[260px] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                      style={{
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border,
                        boxShadow: theme.shadows.overlay
                      }}
                    >
                      <div
                        className="px-4 py-2 border-b"
                        style={{ borderColor: theme.colors.border }}
                      >
                        <p className={cn(theme.typography.label, 'tracking-[0.12em] text-[11px]')}>快捷操作</p>
                      </div>
                      <div className="flex flex-col py-1">
                        {quickMenuActions.map((action, index) => {
                          const Icon = action.icon;
                          const isLast = index === quickMenuActions.length - 1;
                          return (
                            <div key={action.id} className="flex flex-col">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={action.onSelect}
                                className="w-full justify-start gap-3 rounded-none px-4 py-3 text-left hover:bg-accent/5"
                                style={{ color: theme.colors.textPrimary }}
                              >
                                <span
                                  className="flex h-8 w-8 items-center justify-center rounded-md"
                                  style={{ backgroundColor: theme.colors.accentMuted }}
                                >
                                  <Icon size={16} style={{ color: action.iconColor }} />
                                </span>
                                <span className="flex flex-col items-start">
                                  <span className="text-sm font-medium">{action.label}</span>
                                  {action.description && (
                                    <span className="text-xs text-muted-foreground">{action.description}</span>
                                  )}
                                </span>
                              </Button>
                              {!isLast && <Separator className="mx-4" style={{ borderColor: theme.colors.border }} />}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
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
                    className="pr-10"
                    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    style={{ color: theme.colors.textMuted }}
                  >
                    <Smile size={16} />
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={(!messageText.trim() && attachedFiles.length === 0) || uploadingFiles}
                  style={{
                    backgroundColor: theme.colors.accent,
                    color: '#fff'
                  }}
                >
                  {uploadingFiles ? (
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
                    />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </form>

              {isDragging && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed"
                  style={{
                    borderColor: theme.colors.accent,
                    backgroundColor: theme.colors.accentMuted
                  }}
                >
                  <div className="text-center">
                    <Paperclip size={32} className="mx-auto mb-2" style={{ color: theme.colors.accent }} />
                    <p className="font-medium" style={{ color: theme.colors.accent }}>
                      放開以上傳檔案
                    </p>
                  </div>
                </div>
              )}
            </div>
        </ChannelTabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash size={48} className="mx-auto mb-4" style={{ color: theme.colors.textMuted, opacity: 0.4 }} />
              <p style={{ color: theme.colors.textMuted }}>選擇一個頻道開始對話</p>
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
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>頻道名稱</label>
              <Input
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
                placeholder="頻道名稱"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>頻道描述</label>
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
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>報價單編號</label>
              <Input placeholder="輸入報價單編號搜尋..." />
            </div>
            <div
              className="space-y-2 rounded-lg border p-3"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }}
            >
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>暫無報價單資料</p>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>提示：完整功能將連接報價單系統</p>
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
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>團號</label>
              <Input placeholder="輸入團號搜尋..." />
            </div>
            <div
              className="space-y-2 rounded-lg border p-3"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }}
            >
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>暫無團況資料</p>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>提示：完整功能將連接團況管理系統</p>
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
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>請款項目</label>
              <Input placeholder="輸入請款項目..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>請款金額</label>
              <Input type="number" placeholder="輸入請款金額..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>請款原因</label>
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
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>收款項目</label>
              <Input placeholder="輸入收款項目..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>收款金額</label>
              <Input type="number" placeholder="輸入收款金額..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>付款人</label>
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
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>任務標題</label>
              <Input placeholder="輸入任務標題..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>任務描述</label>
              <Input placeholder="輸入任務描述..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>指派給</label>
              <Input placeholder="輸入成員名稱..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>截止日期</label>
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
    </Card>
  );
}