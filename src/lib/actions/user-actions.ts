'use server'

import { getServerAuth, getAuthenticatedSupabase } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'

interface WorkspaceMember {
  id: string
  full_name: string
  avatar_url: string | null
}

/**
 * Fetches all members of the current user's workspace, excluding the user themselves.
 *
 * This action retrieves the current user's session and workspace ID,
 * then queries for all employees in that workspace.
 */
export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  // 使用統一的認證服務
  const auth = await getServerAuth()

  if (!auth.success) {
    // User not authenticated yet, return empty array instead of throwing
    return []
  }

  const { user, workspaceId } = auth.data
  const supabase = await getAuthenticatedSupabase()

  // Query for all employees in the workspace
  const { data: members, error: queryError } = await supabase
    .from('employees')
    .select(`
      id,
      display_name,
      chinese_name,
      english_name,
      avatar_url
    `)
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .neq('id', user.id) // Exclude the current user

  if (queryError) {
    logger.error('Error fetching workspace members:', queryError)
    throw new Error('Could not fetch workspace members.')
  }

  // Format the members for the UI
  const formattedMembers: WorkspaceMember[] = (members || []).map(member => ({
    id: member.id,
    full_name: member.display_name || member.chinese_name || member.english_name || 'Unnamed User',
    avatar_url: member.avatar_url || null,
  }))

  return formattedMembers
}
