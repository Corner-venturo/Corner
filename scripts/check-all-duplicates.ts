/**
 * 檢查所有重複的頻道和群組
 */

import { supabase } from '../src/lib/supabase/client'

async function checkAllDuplicates() {
  console.log('🔍 開始檢查所有重複資料...\n')

  try {
    // 1. 檢查重複的頻道群組
    console.log('📂 檢查頻道群組 (channel_groups)...')
    const { data: groups, error: groupsError } = await supabase
      .from('channel_groups')
      .select('*')
      .order('name', { ascending: true })
      .order('created_at', { ascending: true })

    if (groupsError) {
      console.error('❌ 查詢失敗：', groupsError)
    } else {
      const groupsByName = new Map<string, any[]>()
      groups?.forEach(group => {
        if (!groupsByName.has(group.name)) {
          groupsByName.set(group.name, [])
        }
        groupsByName.get(group.name)!.push(group)
      })

      console.log(`\n找到 ${groups?.length || 0} 個群組：`)

      let duplicateGroupCount = 0
      groupsByName.forEach((groupList, name) => {
        if (groupList.length > 1) {
          duplicateGroupCount++
          console.log(`\n❌ 重複群組: "${name}" (${groupList.length} 個)`)
          groupList.forEach((group, index) => {
            console.log(`   ${index + 1}. ID: ${group.id}`)
            console.log(`      建立時間: ${group.created_at}`)
            console.log(`      workspace_id: ${group.workspace_id}`)
          })
        }
      })

      if (duplicateGroupCount === 0) {
        console.log('✅ 沒有重複的群組\n')
      } else {
        console.log(`\n⚠️  總共有 ${duplicateGroupCount} 個重複的群組\n`)
      }
    }

    // 2. 檢查重複的頻道
    console.log('\n📢 檢查頻道 (channels)...')
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .order('name', { ascending: true })
      .order('created_at', { ascending: true })

    if (channelsError) {
      console.error('❌ 查詢失敗：', channelsError)
    } else {
      const channelsByName = new Map<string, any[]>()
      channels?.forEach(channel => {
        if (!channelsByName.has(channel.name)) {
          channelsByName.set(channel.name, [])
        }
        channelsByName.get(channel.name)!.push(channel)
      })

      console.log(`\n找到 ${channels?.length || 0} 個頻道：`)

      let duplicateChannelCount = 0
      channelsByName.forEach((channelList, name) => {
        if (channelList.length > 1) {
          duplicateChannelCount++
          console.log(`\n❌ 重複頻道: "${name}" (${channelList.length} 個)`)
          channelList.forEach((channel, index) => {
            console.log(`   ${index + 1}. ID: ${channel.id}`)
            console.log(`      建立時間: ${channel.created_at}`)
            console.log(`      群組 ID: ${channel.group_id || '無群組'}`)
            console.log(`      是否最愛: ${channel.is_favorite}`)
          })
        }
      })

      if (duplicateChannelCount === 0) {
        console.log('✅ 沒有重複的頻道\n')
      } else {
        console.log(`\n⚠️  總共有 ${duplicateChannelCount} 個重複的頻道\n`)
      }
    }

    // 3. 顯示所有群組和頻道的結構
    console.log('\n📊 完整的頻道結構：\n')

    groups?.forEach(group => {
      console.log(`📂 群組: ${group.name} (ID: ${group.id})`)
      const groupChannels = channels?.filter(c => c.group_id === group.id) || []
      if (groupChannels.length > 0) {
        groupChannels.forEach(channel => {
          console.log(`   # ${channel.name}${channel.is_favorite ? ' ⭐' : ''}`)
        })
      } else {
        console.log(`   (沒有頻道)`)
      }
      console.log('')
    })

    // 未分組的頻道
    const ungroupedChannels = channels?.filter(c => !c.group_id) || []
    if (ungroupedChannels.length > 0) {
      console.log('📂 未分組的頻道：')
      ungroupedChannels.forEach(channel => {
        console.log(`   # ${channel.name}${channel.is_favorite ? ' ⭐' : ''}`)
      })
    }
  } catch (error) {
    console.error('❌ 發生錯誤：', error)
  }
}

// 執行檢查
checkAllDuplicates()
