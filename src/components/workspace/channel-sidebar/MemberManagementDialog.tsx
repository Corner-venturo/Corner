'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ChannelMember } from '@/services/workspace-members'
import type { Channel, ChannelGroup } from '@/stores/workspace-store'

interface MemberManagementDialogProps {
  memberToRemove: ChannelMember | null
  isRemoveDialogOpen: boolean
  isRemovingMember: boolean
  onClose: () => void
  onRemove: () => Promise<void>
}

export function MemberManagementDialog({
  memberToRemove,
  isRemoveDialogOpen,
  isRemovingMember,
  onClose,
  onRemove,
}: MemberManagementDialogProps) {
  return (
    <Dialog
      open={isRemoveDialogOpen}
      onOpenChange={open => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移除頻道成員</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-morandi-secondary">
          確定要將「
          {memberToRemove?.profile?.displayName || memberToRemove?.profile?.englishName || '此成員'}
          」移出頻道嗎？
        </p>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} disabled={isRemovingMember}>
            取消
          </Button>
          <Button variant="destructive" onClick={onRemove} disabled={isRemovingMember}>
            {isRemovingMember ? '移除中...' : '移除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ChannelDeleteDialogProps {
  channelToDelete: Channel | null
  isDeleteDialogOpen: boolean
  isDeletingChannel: boolean
  onClose: () => void
  onDelete: () => Promise<void>
}

export function ChannelDeleteDialog({
  channelToDelete,
  isDeleteDialogOpen,
  isDeletingChannel,
  onClose,
  onDelete,
}: ChannelDeleteDialogProps) {
  return (
    <Dialog
      open={isDeleteDialogOpen}
      onOpenChange={open => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-morandi-primary">刪除頻道</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-morandi-secondary">
          確定要刪除頻道「{channelToDelete?.name}」嗎？此操作無法復原。
        </p>
        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isDeletingChannel}
            className="text-morandi-secondary hover:text-morandi-primary"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletingChannel}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeletingChannel ? '刪除中...' : '刪除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface GroupDeleteDialogProps {
  groupToDelete: ChannelGroup | null
  isDeleteDialogOpen: boolean
  isDeletingGroup: boolean
  onClose: () => void
  onDelete: () => Promise<void>
}

export function GroupDeleteDialog({
  groupToDelete,
  isDeleteDialogOpen,
  isDeletingGroup,
  onClose,
  onDelete,
}: GroupDeleteDialogProps) {
  const handleDelete = async () => {
    try {
      await onDelete()
    } catch (error) {
      // Error handled by parent
    }
  }

  return (
    <Dialog
      open={isDeleteDialogOpen}
      onOpenChange={open => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-morandi-primary">刪除群組</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-morandi-secondary">
            確定要刪除群組「{groupToDelete?.name}」嗎？
          </p>
          <p className="text-sm text-morandi-secondary">
            群組內的所有頻道將會移至「未分組」區域。此操作無法復原。
          </p>
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeletingGroup}
            className="text-morandi-secondary hover:text-morandi-primary"
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeletingGroup}
          >
            {isDeletingGroup ? '刪除中...' : '刪除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
