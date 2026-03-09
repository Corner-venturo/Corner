/**
 * 測試頻道成員 API
 * 直接呼叫 Supabase 看看資料是否正確
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugChannelAPI() {
  try {
    console.log('🔍 測試頻道成員 API...\n')

    // 1. 取得頻道
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, workspace_id')
      .limit(1)
      .single()

    if (channelsError) throw channelsError

    console.log('📊 測試頻道:', {
      名稱: channels.name,
      頻道ID: channels.id,
      工作空間ID: channels.workspace_id,
    })

    // 2. 測試原本的查詢（模擬 API route）
    console.log('\n📡 測試 API 查詢（含 JOIN）...')
    const { data: members, error: membersError } = await supabase
      .from('channel_members')
      .select(
        `
          id,
          workspace_id,
          channel_id,
          employee_id,
          role,
          status,
          created_at,
          updated_at,
          employees:employee_id (
            id,
            display_name,
            english_name,
            personal_info,
            status
          )
        `
      )
      .eq('workspace_id', channels.workspace_id)
      .eq('channel_id', channels.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('❌ 查詢失敗:', membersError)
      throw membersError
    }

    console.log(`\n✅ 找到 ${members.length} 筆成員記錄\n`)

    // 3. 顯示每筆記錄
    members.forEach((member, index) => {
      console.log(`成員 ${index + 1}:`)
      console.log('  - ID:', member.id)
      console.log('  - Employee ID:', member.employee_id)
      console.log('  - Role:', member.role)
      console.log('  - Status:', member.status)
      console.log(
        '  - Profile:',
        member.employees
          ? {
              名稱: member.employees.display_name,
              英文名: member.employees.english_name,
              Email: member.employees.personal_info?.email,
              狀態: member.employees.status,
            }
          : '❌ 沒有 employees 資料'
      )
      console.log('')
    })

    // 4. 模擬 API response 格式
    const apiResponse = members.map(member => ({
      id: member.id,
      workspaceId: member.workspace_id,
      channelId: member.channel_id,
      employeeId: member.employee_id,
      role: member.role,
      status: member.status,
      invitedAt: null,
      joinedAt: member.created_at,
      lastSeenAt: member.updated_at,
      profile: member.employees
        ? {
            id: member.employees.id,
            displayName: member.employees.display_name,
            englishName: member.employees.english_name,
            email: member.employees.personal_info?.email,
            avatar: null,
            status: member.employees.status,
          }
        : null,
    }))

    console.log('📤 API Response 格式:')
    console.log(JSON.stringify({ members: apiResponse }, null, 2))
  } catch (error) {
    console.error('❌ 測試失敗:', error)
    process.exit(1)
  }
}

debugChannelAPI()
