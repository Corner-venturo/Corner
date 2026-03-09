/**
 * 檢查頻道成員狀態
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkChannelMembers() {
  try {
    console.log('🔍 檢查頻道成員狀態...\n')

    // 1. 查看所有頻道
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, workspace_id, created_at')
      .order('created_at', { ascending: false })

    if (channelsError) throw channelsError

    console.log('📊 頻道列表：')
    console.table(
      channels.map(c => ({
        名稱: c.name,
        ID: c.id.substring(0, 8) + '...',
        workspace: c.workspace_id?.substring(0, 8) + '...',
        建立時間: new Date(c.created_at).toLocaleString('zh-TW'),
      }))
    )

    // 2. 查看所有頻道成員
    const { data: members, error: membersError } = await supabase
      .from('channel_members')
      .select('id, channel_id, employee_id, status, created_at')
      .order('created_at', { ascending: false })

    if (membersError) throw membersError

    console.log(`\n📊 頻道成員記錄：共 ${members.length} 筆`)

    if (members.length === 0) {
      console.log('⚠️  沒有任何頻道成員記錄！\n')
    } else {
      console.table(
        members.slice(0, 10).map(m => ({
          頻道ID: m.channel_id.substring(0, 8) + '...',
          員工ID: m.employee_id.substring(0, 8) + '...',
          狀態: m.status,
          建立時間: new Date(m.created_at).toLocaleString('zh-TW'),
        }))
      )
    }

    // 3. 查看所有員工
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, display_name, employee_number, workspace_id, status')
      .in('status', ['active', 'probation'])

    if (employeesError) throw employeesError

    console.log(`\n📊 員工列表：共 ${employees.length} 位`)
    console.table(
      employees.map(e => ({
        姓名: e.display_name,
        員工編號: e.employee_number,
        workspace: e.workspace_id?.substring(0, 8) + '...' || '無',
        狀態: e.status,
      }))
    )

    // 4. 檢查每個員工的頻道成員狀態
    console.log('\n📊 員工頻道成員狀態：')
    for (const employee of employees) {
      const employeeMembers = members.filter(m => m.employee_id === employee.id)
      const workspaceChannels = channels.filter(c => c.workspace_id === employee.workspace_id)

      console.log(`\n   ${employee.display_name} (${employee.employee_number}):`)
      console.log(`   - 所屬 workspace: ${employee.workspace_id?.substring(0, 8)}...`)
      console.log(`   - 該 workspace 的頻道數: ${workspaceChannels.length}`)
      console.log(`   - 已加入的頻道數: ${employeeMembers.length}`)

      if (employeeMembers.length < workspaceChannels.length) {
        console.log(
          `   ⚠️  缺少 ${workspaceChannels.length - employeeMembers.length} 個頻道成員記錄`
        )
      } else if (workspaceChannels.length === 0) {
        console.log(`   ⚠️  該 workspace 沒有任何頻道`)
      } else {
        console.log(`   ✅ 已加入所有頻道`)
      }
    }

    // 5. 查看是否有孤兒記錄（員工或頻道已刪除）
    console.log('\n📊 檢查孤兒記錄：')
    const employeeIds = new Set(employees.map(e => e.id))
    const channelIds = new Set(channels.map(c => c.id))

    const orphanMembers = members.filter(
      m => !employeeIds.has(m.employee_id) || !channelIds.has(m.channel_id)
    )

    if (orphanMembers.length > 0) {
      console.log(`   ⚠️  發現 ${orphanMembers.length} 筆孤兒記錄（員工或頻道已刪除）`)
    } else {
      console.log(`   ✅ 沒有孤兒記錄`)
    }
  } catch (error) {
    console.error('❌ 檢查失敗:', error)
    process.exit(1)
  }
}

checkChannelMembers()
