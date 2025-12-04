import { ChatLayout } from '@/features/chat/components/ChatLayout'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/stores/types'
import type { Workspace, Channel } from '@/stores/workspace/types'

async function getInitialChatData(): Promise<{
  workspaces: Workspace[]
  channels: Channel[]
  user: User
}> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return redirect('/login')
  }

  // Fetch the full user profile from the employees table
  const { data: user, error: userError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    console.error('Error fetching user profile:', userError)
    // This case might need more robust handling, like signing the user out
    // because their auth record exists but their profile doesn't.
    return redirect('/login')
  }
  
  // Define a type for the workspace member query result
  type WorkspaceMemberWithWorkspace = {
    workspaces: Workspace | null
  }

  // Fetch the workspaces the user is a member of
  const { data: workspaceMembers, error: workspaceError } = await supabase
    .from('workspace_members')
    .select('workspaces (*)')
    .eq('user_id', user.id)

  if (workspaceError) {
    console.error('Error fetching workspaces:', workspaceError)
    return { workspaces: [], channels: [], user }
  }

  const workspaces: Workspace[] =
    workspaceMembers
      ?.flatMap(member => member.workspaces) // Use flatMap to handle nested arrays
      .filter((ws): ws is Workspace => ws !== null && typeof ws === 'object' && 'id' in ws) || []
      
  const currentWorkspace = workspaces[0]

  if (!currentWorkspace) {
    return { workspaces, channels: [], user }
  }

  // Fetch the channels for the current workspace
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', currentWorkspace.id)
    .order('name', { ascending: true })

  if (channelsError) {
    console.error('Error fetching channels:', channelsError)
    return { workspaces, channels: [], user }
  }

  return { workspaces, channels: channels || [], user }
}

export default async function Home() {
  const initialData = await getInitialChatData();

  return <ChatLayout initialData={initialData} />
}
