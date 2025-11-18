/**
 * Workspace Permission Store
 * 管理跨分公司權限
 */

import { logger } from '@/lib/utils/logger'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import type {
  WorkspacePermission,
  WorkspacePermissionWithDetails,
  GrantWorkspaceAccessParams,
  UserWorkspaceAccess,
} from '@/types/workspace-permission.types'

interface WorkspacePermissionStore {
  // State
  permissions: WorkspacePermissionWithDetails[]
  userAccess: UserWorkspaceAccess[]
  loading: boolean
  error: string | null

  // Actions
  fetchAllPermissions: () => Promise<void>
  fetchUserAccess: (userId: string) => Promise<void>
  grantAccess: (params: GrantWorkspaceAccessParams) => Promise<string | null>
  revokeAccess: (userId: string, workspaceId: string) => Promise<boolean>
  clearError: () => void
}

export const useWorkspacePermissionStore = create<WorkspacePermissionStore>((set, get) => ({
  // Initial state
  permissions: [],
  userAccess: [],
  loading: false,
  error: null,

  // Fetch all permissions (for admin view)
  fetchAllPermissions: async () => {
    set({ loading: true, error: null })
    try {
      // @ts-ignore - Supabase select with joins
      const { data, error } = await (supabase as any)
        .from('user_workspace_permissions')
        .select(`
          *,
          workspace:workspaces(id, name),
          user:employees!user_workspace_permissions_user_id_fkey(id, name, user_id),
          granted_by_employee:employees!user_workspace_permissions_granted_by_fkey(id, name)
        `)
        .eq('is_active', true)
        .order('granted_at', { ascending: false })

      if (error) throw error

      const permissions: WorkspacePermissionWithDetails[] =
        data?.map((p: any) => ({
          ...p,
          workspace_name: p.workspace?.name || p.workspace_id,
          user_name: p.user?.name || 'Unknown User',
          granted_by_name: p.granted_by_employee?.name || null,
        })) || []

      set({ permissions, loading: false })
    } catch (error: any) {
      logger.error('[Workspace Permission] Fetch all failed:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Fetch specific user's cross-workspace access
  fetchUserAccess: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      // @ts-ignore - Supabase RPC function
      const { data, error } = await supabase.rpc('get_user_workspace_permissions', {
        p_user_id: userId,
      })

      if (error) throw error

      set({ userAccess: data || [], loading: false })
    } catch (error: any) {
      logger.error('[Workspace Permission] Fetch user access failed:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Grant cross-workspace access to user
  grantAccess: async (params: GrantWorkspaceAccessParams) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.rpc('grant_workspace_access' as any, {
        p_target_user_id: params.target_user_id,
        p_workspace_id: params.workspace_id,
        p_can_view: params.can_view ?? true,
        p_can_edit: params.can_edit ?? false,
        p_can_delete: params.can_delete ?? false,
        p_can_manage_finance: params.can_manage_finance ?? false,
        p_expires_at: params.expires_at ?? null,
        p_notes: params.notes ?? null,
      })

      if (error) throw error

      // Refresh permissions list
      await get().fetchAllPermissions()

      set({ loading: false })
      return (data as any) as string
    } catch (error: any) {
      logger.error('[Workspace Permission] Grant access failed:', error)
      set({ error: error.message, loading: false })
      return null
    }
  },

  // Revoke cross-workspace access
  revokeAccess: async (userId: string, workspaceId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.rpc('revoke_workspace_access' as any, {
        p_target_user_id: userId,
        p_workspace_id: workspaceId,
      }) as any

      if (error) throw error

      // Refresh permissions list
      await get().fetchAllPermissions()

      set({ loading: false })
      return (data as any) as boolean
    } catch (error: any) {
      logger.error('[Workspace Permission] Revoke access failed:', error)
      set({ error: error.message, loading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))
