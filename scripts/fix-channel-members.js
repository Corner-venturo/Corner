/**
 * 修復頻道成員
 * 將所有員工加入其 workspace 的所有頻道
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixChannelMembers() {
  try {
    console.log('🔄 開始修復頻道成員...\n')

    // 1. 取得所有員工
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, display_name, workspace_id')
      .in('status', ['active', 'probation'])

    if (employeesError) throw employeesError

    console.log(`📊 找到 ${employees.length} 位員工\n`)

    // 2. 取得所有頻道
    const { data: channels, error: channelsError } = await supabase.from('channels').select('id, name, workspace_id')

    if (channelsError) throw channelsError

    console.log(`📊 找到 ${channels.length} 個頻道\n`)

    // 3. 取得現有的頻道成員
    const { data: existingMembers, error: existingError } = await supabase
      .from('channel_members')
      .select('channel_id, employee_id')

    if (existingError) throw existingError

    // 建立已加入的 Set（用於快速查詢）
    const membershipSet = new Set(
      existingMembers.map(m => `${m.channel_id}:${m.employee_id}`)
    )

    console.log(`📊 現有 ${existingMembers.length} 筆成員記錄\n`)

    // 4. 找出需要新增的成員
    const membersToAdd = []

    for (const employee of employees) {
      if (!employee.workspace_id) {
        console.warn(`⚠️  ${employee.display_name} 沒有 workspace_id，跳過`)
        continue
      }

      // 找出該員工所屬 workspace 的所有頻道
      const workspaceChannels = channels.filter(c => c.workspace_id === employee.workspace_id)

      for (const channel of workspaceChannels) {
        const membershipKey = `${channel.id}:${employee.id}`

        if (!membershipSet.has(membershipKey)) {
          membersToAdd.push({
            workspace_id: employee.workspace_id,
            channel_id: channel.id,
            employee_id: employee.id,
            role: 'member',
            status: 'active',
          })
        }
      }
    }

    console.log(`📊 需要新增 ${membersToAdd.length} 筆成員記錄\n`)

    if (membersToAdd.length === 0) {
      console.log('✅ 所有員工都已加入頻道，無需修復')
      return
    }

    // 5. 批次新增成員（每次 100 筆）
    const batchSize = 100
    let addedCount = 0

    for (let i = 0; i < membersToAdd.length; i += batchSize) {
      const batch = membersToAdd.slice(i, i + batchSize)

      const { error: insertError } = await supabase.from('channel_members').insert(batch)

      if (insertError) {
        console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 新增失敗:`, insertError.message)
      } else {
        addedCount += batch.length
        console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1}: 新增 ${batch.length} 筆記錄`)
      }
    }

    console.log(`\n✅ 修復完成！共新增 ${addedCount} 筆成員記錄`)

    // 6. 顯示統計
    console.log('\n📊 最終統計：')
    const { data: finalMembers } = await supabase.from('channel_members').select('id', { count: 'exact', head: true })

    console.log(`   總成員記錄數: ${finalMembers?.length || 0}`)
  } catch (error) {
    console.error('❌ 修復失敗:', error)
    process.exit(1)
  }
}

fixChannelMembers()
