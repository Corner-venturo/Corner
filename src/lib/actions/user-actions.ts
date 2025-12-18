'use server'

import { getServerAuth, getAuthenticatedSupabase } from '@/lib/auth/server-auth'

interface WorkspaceMember {
  id: string
  full_name: string
  avatar_url: string | null
}

interface ProfileData {
  name: string | null
  avatar_url: string | null
}

/**
 * Fetches all members of the current user's workspace, excluding the user themselves.
 *
 * This action retrieves the current user's session and workspace ID,
 * then queries for all employees in that workspace, joining with
 * the profiles table to get their public information.
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

  // Query for all employees in the workspace and join with their profiles
  const { data: members, error: queryError } = await supabase
    .from('employees')
    .select(`
      id,
      profiles (
        name,
        avatar_url
      )
    `)
    .eq('workspace_id', workspaceId)
    .neq('id', user.id) // Exclude the current user

  if (queryError) {
    console.error('Error fetching workspace members:', queryError)
    throw new Error('Could not fetch workspace members.')
  }

  // The data structure from the query will be nested, e.g., { id, profiles: [{ name, ... }] }
  // We'll flatten it for easier use in the UI.
  const formattedMembers: WorkspaceMember[] = (members || []).map(member => {
    // profiles is an array from the join, get first item
    const profilesArray = member.profiles as ProfileData[] | null
    const profile = profilesArray?.[0]
    return {
      id: member.id,
      full_name: profile?.name || 'Unnamed User',
      avatar_url: profile?.avatar_url || null,
    }
  })

  return formattedMembers
}
