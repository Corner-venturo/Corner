import { ChatLayout } from '@/features/chat/components/ChatLayout'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import type { User } from '@/stores/types'
import type { Workspace, Channel } from '@/stores/workspace/types'

// 驗證 token 並獲取用戶ID（支援 base64 和 JWT 格式）
async function getUserFromToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('auth-token')

  if (!authCookie?.value) {
    return null
  }

  const token = authCookie.value

  // 優先嘗試 base64 解碼（主要的 token 格式）
  try {
    const decoded = JSON.parse(atob(token))
    if (decoded.iss === 'venturo-app' && decoded.id) {
      // 檢查是否過期
      if (decoded.exp && Date.now() > decoded.exp) {
        return null
      }
      return decoded.id as string
    }
  } catch {
    // base64 解碼失敗，嘗試 JWT
  }

  // 嘗試 JWT 驗證
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'venturo_app_jwt_secret_key_change_in_production_2024')
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'venturo-app',
    })
    return payload.id as string
  } catch {
    return null
  }
}

async function getInitialChatData(): Promise<{
  workspaces: Workspace[]
  channels: Channel[]
  user: User
}> {
  // 先從JWT token獲取用戶ID
  const userId = await getUserFromToken()
  
  if (!userId) {
    return redirect('/login')
  }

  const supabase = await createSupabaseServerClient()

  // Fetch the full user profile from the employees table using JWT token user ID
  const { data: user, error: userError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
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
