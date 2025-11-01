'use client'

import { useState, useCallback } from 'react'
import type { Channel, ChannelGroup } from '@/stores/workspace-store'
import type { ChannelMember } from '@/services/workspace-members'

export function useChannelState() {
  // Group dialog state
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // Member removal state
  const [memberToRemove, setMemberToRemove] = useState<ChannelMember | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)

  // Channel deletion state
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingChannel, setIsDeletingChannel] = useState(false)

  // Group deletion state
  const [groupToDelete, setGroupToDelete] = useState<ChannelGroup | null>(null)
  const [isGroupDeleteDialogOpen, setIsGroupDeleteDialogOpen] = useState(false)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

  // Create channel dialog state
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public')

  // Edit channel dialog state
  const [showEditChannelDialog, setShowEditChannelDialog] = useState(false)
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null)
  const [editChannelName, setEditChannelName] = useState('')
  const [editChannelDescription, setEditChannelDescription] = useState('')

  // Reset create channel dialog
  const resetCreateChannelDialog = useCallback(() => {
    setShowCreateChannelDialog(false)
    setNewChannelName('')
    setNewChannelDescription('')
    setNewChannelType('public')
  }, [])

  // Reset edit channel dialog
  const resetEditChannelDialog = useCallback(() => {
    setShowEditChannelDialog(false)
    setChannelToEdit(null)
    setEditChannelName('')
    setEditChannelDescription('')
  }, [])

  // Open delete channel dialog
  const openDeleteChannelDialog = useCallback((channel: Channel) => {
    setChannelToDelete(channel)
    setIsDeleteDialogOpen(true)
  }, [])

  // Close delete channel dialog
  const closeDeleteChannelDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setChannelToDelete(null)
  }, [])

  // Open delete group dialog
  const openDeleteGroupDialog = useCallback((group: ChannelGroup) => {
    setGroupToDelete(group)
    setIsGroupDeleteDialogOpen(true)
  }, [])

  // Close delete group dialog
  const closeDeleteGroupDialog = useCallback(() => {
    setIsGroupDeleteDialogOpen(false)
    setGroupToDelete(null)
  }, [])

  // Open edit channel dialog
  const openEditChannelDialog = useCallback((channel: Channel) => {
    setChannelToEdit(channel)
    setEditChannelName(channel.name)
    setEditChannelDescription(channel.description || '')
    setShowEditChannelDialog(true)
  }, [])

  // Open remove member dialog
  const openRemoveMemberDialog = useCallback((member: ChannelMember) => {
    setMemberToRemove(member)
    setIsRemoveDialogOpen(true)
  }, [])

  // Close remove member dialog
  const closeRemoveMemberDialog = useCallback(() => {
    setIsRemoveDialogOpen(false)
    setMemberToRemove(null)
  }, [])

  return {
    // Group dialog
    showNewGroupDialog,
    setShowNewGroupDialog,
    newGroupName,
    setNewGroupName,
    // Member removal
    memberToRemove,
    isRemoveDialogOpen,
    isRemovingMember,
    setIsRemovingMember,
    openRemoveMemberDialog,
    closeRemoveMemberDialog,
    // Channel deletion
    channelToDelete,
    isDeleteDialogOpen,
    isDeletingChannel,
    setIsDeletingChannel,
    openDeleteChannelDialog,
    closeDeleteChannelDialog,
    // Group deletion
    groupToDelete,
    isGroupDeleteDialogOpen,
    isDeletingGroup,
    setIsDeletingGroup,
    openDeleteGroupDialog,
    closeDeleteGroupDialog,
    // Create channel
    showCreateChannelDialog,
    setShowCreateChannelDialog,
    newChannelName,
    setNewChannelName,
    newChannelDescription,
    setNewChannelDescription,
    newChannelType,
    setNewChannelType,
    resetCreateChannelDialog,
    // Edit channel
    showEditChannelDialog,
    channelToEdit,
    editChannelName,
    setEditChannelName,
    editChannelDescription,
    setEditChannelDescription,
    openEditChannelDialog,
    resetEditChannelDialog,
  }
}
