'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessageAction({
  channelId,
  content,
}: {
  channelId: string
  content: string
}) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to send a message.' }
  }

  if (!content.trim()) {
    return { error: 'Message cannot be empty.' }
  }

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
