'use client'

import { useState } from 'react'

import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { useWorkspaceChannels } from '@/stores/workspace-store'

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const { createChannel } = useWorkspaceChannels()
  const [channelName, setChannelName] = useState('')

  const handleCreate = () => {
    if (!channelName.trim()) return

    const currentUserId = '1' // 從 auth store 獲取

    createChannel({
      name: channelName.trim(),
      type: 'public', // 'custom' 不是有效類型，改為 'public'
      // isArchived: false, // Channel 類型不包含此屬性
      // members: [currentUserId], // Channel 類型不包含此屬性
      workspace_id: '', // 從 workspace store 獲取當前 workspace_id
      created_by: currentUserId,
    })

    setChannelName('')
    onOpenChange(false)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="新增私人頻道"
      onSubmit={handleCreate}
      submitLabel="建立頻道"
      submitDisabled={!channelName.trim()}
      maxWidth="md"
    >
      <div>
        <label className="text-sm font-medium text-morandi-primary mb-2 block">頻道名稱</label>
        <Input
          value={channelName}
          onChange={e => setChannelName(e.target.value)}
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
    </FormDialog>
  )
}
