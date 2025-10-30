/**
 * 清理所有重複的群組和頻道
 *
 * 清理策略：
 * 1. 保留最舊的「公司公告」群組和它的「總部辦公室」頻道
 * 2. 刪除其他重複的群組和頻道
 * 3. 如果重複的頻道有標記最愛，會把最愛標記移到保留的頻道上
 */

import { supabase } from '../src/lib/supabase/client'

async function cleanupAllDuplicates() {
  console.log('🔍 開始清理重複資料...\n')

  const DRY_RUN = false // 改成 false 才會真正刪除

  try {
    // 1. 查詢所有「公司公告」群組
    const { data: groups, error: groupsError } = await supabase
      .from('channel_groups')
      .select('*')
      .eq('name', '📢 公司公告')
      .order('created_at', { ascending: true })

    if (groupsError) {
      console.error('❌ 查詢群組失敗：', groupsError)
      return
    }

    if (!groups || groups.length === 0) {
      console.log('✅ 沒有找到「公司公告」群組')
      return
    }

    console.log(`📊 找到 ${groups.length} 個「公司公告」群組\n`)

    if (groups.length === 1) {
      console.log('✅ 只有一個群組，不需要清理')
      return
    }

    // 2. 保留最舊的群組
    const keepGroup = groups[0]
    const duplicateGroups = groups.slice(1)

    console.log('📌 將保留以下群組：')
    console.log(`   ID: ${keepGroup.id}`)
    console.log(`   名稱: ${keepGroup.name}`)
    console.log(`   建立時間: ${keepGroup.created_at}\n`)

    // 3. 查詢所有「總部辦公室」頻道
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('name', '🏢 總部辦公室')
      .order('created_at', { ascending: true })

    if (channelsError) {
      console.error('❌ 查詢頻道失敗：', channelsError)
      return
    }

    const keepChannel = channels?.find(c => c.group_id === keepGroup.id)
    const duplicateChannels = channels?.filter(c => c.group_id !== keepGroup.id) || []

    // 檢查是否有任何重複頻道標記為最愛
    const anyDuplicateIsFavorite = duplicateChannels.some(c => c.is_favorite)

    console.log('📌 將保留以下頻道：')
    console.log(`   ID: ${keepChannel?.id}`)
    console.log(`   名稱: ${keepChannel?.name}`)
    console.log(`   建立時間: ${keepChannel?.created_at}`)
    console.log(`   是否最愛: ${keepChannel?.is_favorite}\n`)

    // 如果有重複頻道是最愛，但保留的不是，需要更新
    if (anyDuplicateIsFavorite && !keepChannel?.is_favorite) {
      console.log('⭐ 偵測到重複頻道有最愛標記，將更新保留的頻道\n')
    }

    console.log(`🗑️  將刪除 ${duplicateGroups.length} 個重複群組：`)
    duplicateGroups.forEach((group, index) => {
      console.log(`   ${index + 1}. ID: ${group.id}`)
      console.log(`      建立時間: ${group.created_at}`)
    })

    console.log(`\n🗑️  將刪除 ${duplicateChannels.length} 個重複頻道：`)
    duplicateChannels.forEach((channel, index) => {
      console.log(`   ${index + 1}. ID: ${channel.id}`)
      console.log(`      建立時間: ${channel.created_at}`)
      console.log(`      群組 ID: ${channel.group_id}`)
      console.log(`      是否最愛: ${channel.is_favorite}`)
    })

    console.log('\n⚠️  請確認是否要執行刪除？')
    console.log('   如果要執行，請將 DRY_RUN 設為 false\n')

    if (DRY_RUN) {
      console.log('🔒 DRY RUN 模式 - 不會實際刪除資料')
      console.log('   將 DRY_RUN 改為 false 後重新執行以實際刪除\n')
      return
    }

    // 4. 執行清理
    console.log('\n🚀 開始清理...\n')

    // 4.1 如果需要，更新保留頻道的最愛狀態
    if (anyDuplicateIsFavorite && !keepChannel?.is_favorite && keepChannel?.id) {
      console.log('⭐ 更新保留頻道為最愛...')
      const { error: updateError } = await supabase
        .from('channels')
        .update({ is_favorite: true })
        .eq('id', keepChannel.id)

      if (updateError) {
        console.error('❌ 更新失敗：', updateError)
      } else {
        console.log('✅ 已更新保留頻道為最愛\n')
      }
    }

    // 4.2 刪除重複的頻道
    for (const channel of duplicateChannels) {
      const { error: deleteError } = await supabase.from('channels').delete().eq('id', channel.id)

      if (deleteError) {
        console.error(`❌ 刪除頻道失敗 (${channel.id}):`, deleteError)
      } else {
        console.log(`✅ 已刪除頻道: ${channel.name} (${channel.id})`)
      }
    }

    // 4.3 刪除重複的群組
    for (const group of duplicateGroups) {
      const { error: deleteError } = await supabase
        .from('channel_groups')
        .delete()
        .eq('id', group.id)

      if (deleteError) {
        console.error(`❌ 刪除群組失敗 (${group.id}):`, deleteError)
      } else {
        console.log(`✅ 已刪除群組: ${group.name} (${group.id})`)
      }
    }

    console.log('\n✅ 清理完成！')
    console.log(`   保留: 1 個群組 + 1 個頻道`)
    console.log(`   刪除: ${duplicateGroups.length} 個群組 + ${duplicateChannels.length} 個頻道\n`)

    // 5. 提示清理本地快取
    console.log('📝 後續步驟：')
    console.log('   1. 開啟瀏覽器開發者工具 (F12)')
    console.log('   2. Application → Storage → IndexedDB')
    console.log('   3. 刪除 venturo-db')
    console.log('   4. 重新整理頁面\n')
  } catch (error) {
    console.error('❌ 發生錯誤：', error)
  }
}

// 執行清理
cleanupAllDuplicates()
