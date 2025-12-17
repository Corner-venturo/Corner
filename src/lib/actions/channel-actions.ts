'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getOrCreateDmChannel(otherUserId: string) {
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
    console.error('DM Action Auth Error:', authError)
    throw new Error('User not authenticated.')
  }

  // The workspace ID should be stored in the user's app_metadata or a related table.
  // Assuming it's in user_metadata for this example.
  // @ts-ignore
  const workspaceId = user.user_metadata?.workspace_id
  if (!workspaceId) {
    throw new Error('Workspace ID not found for the current user.')
  }

  // Call the RPC function
  const { data, error } = await supabase.rpc('get_or_create_dm_channel', {
    p_user_1_id: user.id,
    p_user_2_id: otherUserId,
    p_workspace_id: workspaceId,
  })

  if (error) {
    console.error('Error calling get_or_create_dm_channel RPC:', error)
    throw new Error('Could not get or create DM channel.')
  }

  // The RPC function returns an array with a single channel object
  const channel = data?.[0]

  if (!channel) {
    throw new Error('Failed to retrieve channel data after RPC call.')
  }

  // Revalidate the workspace path to ensure the new channel appears in the sidebar
  revalidatePath('/workspace')

  return channel
}
