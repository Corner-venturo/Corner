'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useWorkspaceStore } from '@/stores/workspace-store';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const { createChannel } = useWorkspaceStore();
  const [channelName, setChannelName] = useState('');
  
  const handleCreate = () => {
    if (!channelName.trim()) return;
    
    const currentUserId = '1'; // TODO: 從 auth store 獲取
    
    createChannel({
      name: channelName.trim(),
      type: 'public', // 'custom' 不是有效類型，改為 'public'
      // isArchived: false, // Channel 類型不包含此屬性
      // members: [currentUserId], // Channel 類型不包含此屬性
      workspace_id: '', // TODO: 從 workspace store 獲取當前 workspace_id
      created_by: currentUserId,
    });
    
    setChannelName('');
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增私人頻道</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              頻道名稱
            </label>
            <Input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
              placeholder="輸入頻道名稱..."
              autoFocus
            />
          </div>
          
          <div className="text-sm text-morandi-secondary bg-morandi-container/10 p-3 rounded-lg">
            <p className="font-medium mb-1">ℹ️ 提示：</p>
            <ul className="text-xs space-y-1 ml-4">
              <li>• 私人頻道只有被邀請的成員才能看到</li>
              <li>• 創建後可以邀請其他成員加入</li>
              <li>• 旅遊團頻道會自動建立，無需手動建立</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!channelName.trim()}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            建立頻道
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
