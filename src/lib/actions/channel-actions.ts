'use server'

import { revalidatePath } from 'next/cache'
import { getServerAuth, getAuthenticatedSupabase } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'

export async function getOrCreateDmChannel(otherUserId: string) {
  // 使用統一的認證服務
  const auth = await getServerAuth()

  if (!auth.success) {
    throw new Error(auth.error.error)
  }

  const { workspaceId, employeeId } = auth.data
  const supabase = await getAuthenticatedSupabase()

  // Call the RPC function（使用 employeeId 而非 auth user.id）
  const { data, error } = await supabase.rpc('get_or_create_dm_channel', {
    p_user_1_id: employeeId,
    p_user_2_id: otherUserId,
    p_workspace_id: workspaceId,
  })

  if (error) {
    logger.error('Error calling get_or_create_dm_channel RPC:', {
      error,
      params: { p_user_1_id: employeeId, p_user_2_id: otherUserId, p_workspace_id: workspaceId }
    })
    throw new Error(`Could not get or create DM channel: ${error.message}`)
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
