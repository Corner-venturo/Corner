/**
 * 清理重複的夥伴頻道腳本
 *
 * 這個腳本會：
 * 1. 掃描「夥伴」群組中的所有頻道
 * 2. 找出同名的重複頻道
 * 3. 保留最早建立的頻道，刪除其他重複的
 */

import { openDB, DBSchema } from 'idb'

const DB_NAME = 'venturo-workspace-db'
const DB_VERSION = 1
const TEAM_GROUP_NAME = '夥伴'

interface VenturoWorkspaceDB extends DBSchema {
  channels: {
    key: string
    value: {
      id: string
      name: string
      workspace_id: string
      group_id: string | null
      type: string
      created_at: string
      created_by: string
    }
  }
  channel_groups: {
    key: string
    value: {
      id: string
      name: string
      workspace_id: string
    }
  }
  messages: {
    key: string
    value: {
      id: string
      channel_id: string
      content: string
    }
  }
}

async function cleanupDuplicateChannels() {
  console.log('🧹 開始清理重複的夥伴頻道...\n')

  // 開啟資料庫
  const db = await openDB<VenturoWorkspaceDB>(DB_NAME, DB_VERSION)

  // 1. 找到「夥伴」群組
  const groups = await db.getAll('channel_groups')
  const teamGroup = groups.find(g => g.name === TEAM_GROUP_NAME)

  if (!teamGroup) {
    console.log('⚠️ 找不到「夥伴」群組')
    return
  }

  console.log(`✓ 找到「夥伴」群組: ${teamGroup.id}\n`)

  // 2. 找到所有屬於「夥伴」群組的頻道
  const allChannels = await db.getAll('channels')
  const teamChannels = allChannels.filter(ch => ch.group_id === teamGroup.id)

  console.log(`✓ 「夥伴」群組中共有 ${teamChannels.length} 個頻道\n`)

  // 3. 按照名稱分組
  const channelsByName = new Map<string, typeof teamChannels>()
  teamChannels.forEach(ch => {
    if (!channelsByName.has(ch.name)) {
      channelsByName.set(ch.name, [])
    }
    channelsByName.get(ch.name)!.push(ch)
  })

  // 4. 找出重複的頻道並清理
  let totalDuplicates = 0
  let deletedCount = 0

  for (const [name, channels] of channelsByName.entries()) {
    if (channels.length > 1) {
      console.log(`\n👤 ${name}：找到 ${channels.length} 個重複頻道`)

      // 按建立時間排序，保留最早的
      channels.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      const toKeep = channels[0]
      const toDelete = channels.slice(1)

      console.log(`  ✓ 保留: ${toKeep.id.slice(0, 8)}... (建立於 ${toKeep.created_at})`)

      // 檢查每個要刪除的頻道
      for (const channel of toDelete) {
        // 檢查是否有訊息
        const messages = await db.getAllFromIndex('messages', 'channel_id', channel.id)

        if (messages && messages.length > 0) {
          console.log(`  ⚠️ 跳過: ${channel.id.slice(0, 8)}... (有 ${messages.length} 則訊息)`)
          continue
        }

        // 刪除空頻道
        try {
          await db.delete('channels', channel.id)
          deletedCount++
          console.log(`  ✓ 已刪除: ${channel.id.slice(0, 8)}... (無訊息)`)
        } catch (error) {
          console.error(`  ✗ 刪除失敗: ${channel.id}`, error)
        }
      }

      totalDuplicates += toDelete.length
    }
  }

  console.log(`\n\n📊 清理結果：`)
  console.log(`  • 找到 ${totalDuplicates} 個重複頻道`)
  console.log(`  • 成功刪除 ${deletedCount} 個空頻道`)
  console.log(`  • 跳過 ${totalDuplicates - deletedCount} 個有訊息的頻道`)
  console.log(`\n✅ 清理完成！`)

  db.close()
}

// 執行清理
cleanupDuplicateChannels().catch(console.error)
