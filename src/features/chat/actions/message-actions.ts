'use server'

import { revalidatePath } from 'next/cache'
import { getServerUser, getAuthenticatedSupabase } from '@/lib/auth/server-auth'

export async function sendMessageAction({
  channelId,
  content,
}: {
  channelId: string
  content: string
}) {
  // 使用統一的認證服務
  const auth = await getServerUser()

  if ('error' in auth) {
    return { error: auth.error }
  }

  const { user } = auth

  if (!content.trim()) {
    return { error: 'Message cannot be empty.' }
  }

  const supabase = await getAuthenticatedSupabase()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: user.id,
      content: content.trim(),
    })

  if (error) {
    return { error: 'Failed to send message: ' + error.message }
  }

  // Revalidate the page to show the new message
  // Note: For a real-time app, we will replace this with a direct client-side update
  // triggered by Supabase Realtime, but this is a good non-realtime fallback.
  revalidatePath('/')

  return { data }
}
