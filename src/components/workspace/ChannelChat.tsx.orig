'use client';

import { UI_DELAYS } from '@/lib/constants/timeouts';
import { useState, useEffect } from 'react';
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
import { Hash, Users, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAutoCreateTourChannels } from '@/hooks/use-auto-create-tour-channels';
import { useCleanupOrphanChannels } from '@/hooks/use-cleanup-orphan-channels';
import { ChannelSidebar } from './ChannelSidebar';
import { ChannelTabs } from './ChannelTabs';
import { ShareAdvanceDialog } from './ShareAdvanceDialog';
import { ShareOrdersDialog } from './ShareOrdersDialog';
import { CreateReceiptDialog } from './CreateReceiptDialog';
import { CreatePaymentRequestDialog } from './CreatePaymentRequestDialog';
import {
  MessageList,
  MessageInput,
  MemberSidebar,
  useMessageOperations,
  useFileUpload,
  useScrollToBottom,
  theme
} from './chat';

export function ChannelChat() {
  const [messageText, setMessageText] = useState('');
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showShareQuoteDialog, setShowShareQuoteDialog] = useState(false);
  const [showShareTourDialog, setShowShareTourDialog] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showShareAdvanceDialog, setShowShareAdvanceDialog] = useState(false);
  const [showShareOrdersDialog, setShowShareOrdersDialog] = useState(false);
  const [showCreateReceiptDialog, setShowCreateReceiptDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<unknown>(null);
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState<unknown>(null);
  const [selectedAdvanceListId, setSelectedAdvanceListId] = useState<string>('');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');

  const {
    channels,
    currentWorkspace,
    loading,
    selectedChannel,
    selectChannel,
    loadChannels,
    updateChannel,
    deleteChannel,
    loadMessages,
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
        updateChannel: state.updateChannel,
        deleteChannel: state.deleteChannel,
        loadMessages: state.loadMessages,
        advanceLists: state.advanceLists,
        sharedOrderLists: state.sharedOrderLists,
        loadAdvanceLists: state.loadAdvanceLists,
        loadSharedOrderLists: state.loadSharedOrderLists,
        deleteAdvanceList: state.deleteAdvanceList,
        currentMessages: channelId ? state.channelMessages[channelId] ?? [] : [],
        messagesLoading: channelId ? state.messagesLoading[channelId] ?? false : false
      };
    }
  );

  const { handleSendMessage, handleReaction, handleDeleteMessage, user } = useMessageOperations();
  const { attachedFiles, setAttachedFiles, uploadingFiles, uploadProgress, uploadFiles, clearFiles } = useFileUpload();
  const { messagesEndRef } = useScrollToBottom(currentMessages.length);

  useAutoCreateTourChannels();
  useCleanupOrphanChannels();

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadChannels(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, loadChannels]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const defaultChannel = channels.find(c => c.name === '一般討論') || channels[0];
      selectChannel(defaultChannel);
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

  const onSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() && attachedFiles.length === 0) {
      return;
    }

    if (!selectedChannel) {
      return;
    }

    if (!user) {
      alert('請先登入才能發送訊息');
      return;
    }

    try {
      const uploadedAttachments = attachedFiles.length > 0
        ? await uploadFiles(selectedChannel.id)
        : undefined;

      await handleSendMessage(selectedChannel.id, messageText, uploadedAttachments);

      setMessageText('');
      clearFiles();
    } catch (error) {
      console.error('發送訊息失敗:', error);
      alert('發送訊息失敗，請稍後再試');
    }
  };

  const onReactionClick = (messageId: string, emoji: string) => {
    handleReaction(messageId, emoji, currentMessages);
  };

  const onDeleteMessageClick = async (messageId: string) => {
    await handleDeleteMessage(messageId);
  };

  if (loading && channels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex rounded-lg border border-border overflow-hidden bg-white">
      <ChannelSidebar
        selectedChannelId={selectedChannel?.id || null}
        onSelectChannel={(channel) => {
          if (selectedChannel?.id !== channel.id) {
            setIsSwitching(true);

            setTimeout(() => {
              selectChannel(channel);

              setTimeout(() => setIsSwitching(false), UI_DELAYS.FAST_FEEDBACK);
            }, 150);
          }
        }}
      />

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
            <div className="flex-1 flex min-h-0">
              <MessageList
                messages={currentMessages}
                advanceLists={advanceLists}
                sharedOrderLists={sharedOrderLists}
                channelName={selectedChannel.name}
                currentUserId={user?.id}
                isLoading={messagesLoading}
                onReaction={onReactionClick}
                onDeleteMessage={onDeleteMessageClick}
                onCreatePayment={(itemId, item) => {
                  setSelectedAdvanceItem(item);
                  setSelectedAdvanceListId(advanceLists.find(al => 
                    al.items?.some((i: any) => i.id === itemId)
                  )?.id || '');
                  setShowCreatePaymentDialog(true);
                }}
                onDeleteAdvanceList={deleteAdvanceList}
                onCreateReceipt={(orderId, order) => {
                  setSelectedOrder(order);
                  setShowCreateReceiptDialog(true);
                }}
                messagesEndRef={messagesEndRef}
                theme={theme}
              />

              <MemberSidebar isOpen={showMemberSidebar} />
            </div>

            <MessageInput
              channelName={selectedChannel.name}
              value={messageText}
              onChange={setMessageText}
              onSubmit={onSubmitMessage}
              attachedFiles={attachedFiles}
              onFilesChange={setAttachedFiles}
              uploadingFiles={uploadingFiles}
              uploadProgress={uploadProgress}
              onShowShareOrders={() => setShowShareOrdersDialog(true)}
              onShowShareQuote={() => setShowShareQuoteDialog(true)}
              onShowNewPayment={() => setShowNewPaymentDialog(true)}
              onShowNewReceipt={() => setShowNewReceiptDialog(true)}
              onShowShareAdvance={() => setShowShareAdvanceDialog(true)}
              onShowNewTask={() => setShowNewTaskDialog(true)}
            />
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
            // 更新訂單的收款狀態
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
              // 待實作: 分享報價單卡片
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
              // 待實作: 分享團況卡片
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
              // 待實作: 新增請款單
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
              // 待實作: 新增收款單
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
              // 待實作: 新增任務
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