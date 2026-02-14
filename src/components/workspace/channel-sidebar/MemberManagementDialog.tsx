'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X, Trash2 } from 'lucide-react'
import type { ChannelMember } from '@/services/workspace-members'
import type { Channel, ChannelGroup } from '@/stores/workspace-store'
import { COMP_WORKSPACE_LABELS } from '../constants/labels'

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
      <DialogContent level={1}>
        <DialogHeader>
          <DialogTitle>{COMP_WORKSPACE_LABELS.LABEL_8217}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-morandi-secondary">
          {COMP_WORKSPACE_LABELS.CONFIRM_9167}
          {memberToRemove?.profile?.displayName || memberToRemove?.profile?.englishName || COMP_WORKSPACE_LABELS.此成員}
          」移出頻道嗎？
        </p>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} disabled={isRemovingMember} className="gap-1">
            <X size={16} />
            {COMP_WORKSPACE_LABELS.CANCEL}
          </Button>
          <Button variant="destructive" onClick={onRemove} disabled={isRemovingMember} className="gap-2">
            <Trash2 size={16} />
            {isRemovingMember ? COMP_WORKSPACE_LABELS.移除中 : COMP_WORKSPACE_LABELS.移除}
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
      <DialogContent level={1}>
        <DialogHeader>
          <DialogTitle className="text-morandi-primary">{COMP_WORKSPACE_LABELS.刪除頻道}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-morandi-secondary">
          確定要刪除頻道「{channelToDelete?.name}」嗎？此操作無法復原。
        </p>
        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isDeletingChannel}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary"
          >
            <X size={16} />
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletingChannel}
          >
            {isDeletingChannel ? COMP_WORKSPACE_LABELS.刪除中 : COMP_WORKSPACE_LABELS.刪除}
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
      <DialogContent level={1}>
        <DialogHeader>
          <DialogTitle className="text-morandi-primary">{COMP_WORKSPACE_LABELS.刪除群組}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-morandi-secondary">
            確定要刪除群組「{groupToDelete?.name}」嗎？
          </p>
          <p className="text-sm text-morandi-secondary">
            {COMP_WORKSPACE_LABELS.LABEL_8875}
          </p>
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeletingGroup}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary"
          >
            <X size={16} />
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeletingGroup}
          >
            {isDeletingGroup ? COMP_WORKSPACE_LABELS.刪除中 : COMP_WORKSPACE_LABELS.刪除}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
