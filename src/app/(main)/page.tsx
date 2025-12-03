import { ChatLayout } from '@/features/chat/components/ChatLayout'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getInitialChatData() {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch the workspaces the user is a member of
  const { data: workspaceMembers, error: workspaceError } = await supabase
    .from('workspace_members')
    .select('workspaces (*)')
    .eq('user_id', user.id)

  if (workspaceError) {
    console.error('Error fetching workspaces:', workspaceError)
    return { workspaces: [], channels: [] }
  }

  const workspaces = workspaceMembers?.map(member => member.workspaces).filter(Boolean) || []
  const currentWorkspace = workspaces[0]

  if (!currentWorkspace) {
    return { workspaces, channels: [] }
  }

  // Fetch the channels for the current workspace
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', currentWorkspace.id)
    .order('name', { ascending: true })
  
  if (channelsError) {
    console.error('Error fetching channels:', channelsError)
    return { workspaces, channels: [] }
  }

  return { workspaces, channels, user }
}


export default async function Home() {
  const initialData = await getInitialChatData();

  return <ChatLayout initialData={initialData} />
}
