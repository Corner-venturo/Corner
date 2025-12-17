'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Fetches all members of the current user's workspace, excluding the user themselves.
 *
 * This action retrieves the current user's session and workspace ID,
 * then queries for all employees in that workspace, joining with
 * the profiles table to get their public information.
 */
export async function getWorkspaceMembers() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  )

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Get Members Action Auth Error:', authError)
    throw new Error('User not authenticated.')
  }

  // @ts-ignore
  const workspaceId = user.user_metadata?.workspace_id
  if (!workspaceId) {
    throw new Error('Workspace ID not found for the current user.')
  }

  // Query for all employees in the workspace and join with their profiles
  const { data: members, error: queryError } = await supabase
    .from('employees')
    .select(
      `
      id,
      profiles (
        full_name,
        avatar_url
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .neq('id', user.id) // Exclude the current user

  if (queryError) {
    console.error('Error fetching workspace members:', queryError)
    throw new Error('Could not fetch workspace members.')
  }

  // The data structure from the query will be nested, e.g., { id, profiles: { full_name, ... } }
  // We'll flatten it for easier use in the UI.
  const formattedMembers = members.map(member => ({
    id: member.id,
    // @ts-ignore
    full_name: member.profiles?.full_name || 'Unnamed User',
    // @ts-ignore
    avatar_url: member.profiles?.avatar_url || null,
  }))

  return formattedMembers
}
