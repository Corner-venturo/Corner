#!/usr/bin/env node

/**
 * 遷移腳本：將舊巢狀路徑的護照照片移到新的平坦路徑格式
 *
 * 背景：
 * - 舊格式：${workspaceId}/${orderId}/${filename}
 * - 新格式：passport_${timestamp}_${random}.jpg
 * - 原因：Signed URLs 對巢狀目錄支援不好（commit e1638463, 2026-02-27）
 *
 * 執行方式：
 * node scripts/migrate-passport-photos.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
})

const DRY_RUN = process.argv.includes('--dry-run')

// 生成新格式檔名
function generateNewFilename(oldPath) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const ext = oldPath.split('.').pop() || 'jpg'
  return `passport_${timestamp}_${random}.${ext}`
}

// 提取舊路徑中的完整路徑（去掉 public URL 前綴）
function extractStoragePath(url) {
  const publicPrefix =
    'https://pfqvdacxowpgfamuvnsn.supabase.co/storage/v1/object/public/passport-images/'
  if (url.startsWith(publicPrefix)) {
    return url.substring(publicPrefix.length)
  }
  return url
}

// 檢查是否為 data URL
function isDataURL(url) {
  return url && url.startsWith('data:')
}

// 從 data URL 解析出 buffer
function parseDataURL(dataUrl) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid data URL format')
  }
  const contentType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')
  return { buffer, contentType }
}

async function migratePhoto(member) {
  const isData = isDataURL(member.passport_image_url)
  const oldPath = isData ? 'data URL' : extractStoragePath(member.passport_image_url)
  const newFilename = generateNewFilename(isData ? 'passport.jpg' : oldPath)

  console.log(`\n[${member.id}] ${member.chinese_name || '(無名字)'}`)
  console.log(`  舊格式: ${isData ? 'data URL (base64)' : '巢狀路徑'}`)
  if (!isData) {
    console.log(`  舊路徑: ${oldPath}`)
  }
  console.log(`  新檔名: ${newFilename}`)

  if (DRY_RUN) {
    console.log('  ⏭️  Dry-run 模式，跳過實際操作')
    return { success: true, skipped: true }
  }

  try {
    let downloadData, contentType

    if (isData) {
      // 1a. 從 data URL 解析檔案
      console.log('  📋 解析 data URL...')
      const parsed = parseDataURL(member.passport_image_url)
      downloadData = parsed.buffer
      contentType = parsed.contentType
    } else {
      // 1b. 從舊路徑下載檔案
      console.log('  ⬇️  下載舊檔案...')
      const { data, error: downloadError } = await supabase.storage
        .from('passport-images')
        .download(oldPath)

      if (downloadError) {
        console.error(`  ❌ 下載失敗:`, downloadError.message)
        return { success: false, error: downloadError.message }
      }

      downloadData = data
      contentType = data.type || 'image/jpeg'
    }

    // 2. 上傳到新路徑
    console.log('  ⬆️  上傳到新路徑...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('passport-images')
      .upload(newFilename, downloadData, {
        contentType: contentType,
        upsert: false, // 不覆蓋已存在的檔案
      })

    if (uploadError) {
      console.error(`  ❌ 上傳失敗:`, uploadError.message)
      return { success: false, error: uploadError.message }
    }

    // 3. 更新資料庫 URL
    console.log('  💾 更新資料庫...')
    const { error: updateError } = await supabase
      .from('order_members')
      .update({ passport_image_url: newFilename })
      .eq('id', member.id)

    if (updateError) {
      console.error(`  ❌ 資料庫更新失敗:`, updateError.message)
      return { success: false, error: updateError.message }
    }

    // 4. 驗證新檔案可存取（生成 signed URL）
    console.log('  ✅ 驗證新檔案...')
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('passport-images')
      .createSignedUrl(newFilename, 60)

    if (signedUrlError) {
      console.error(`  ⚠️  Signed URL 生成失敗:`, signedUrlError.message)
    } else {
      console.log(`  🔗 Signed URL: ${signedUrlData.signedUrl.substring(0, 80)}...`)
    }

    // 5. 刪除舊檔案（可選，先保留以防萬一）
    // console.log('  🗑️  刪除舊檔案...');
    // await supabase.storage.from('passport-images').remove([oldPath]);

    console.log('  ✅ 遷移完成')
    return { success: true, newPath: newFilename }
  } catch (err) {
    console.error(`  ❌ 例外錯誤:`, err.message)
    return { success: false, error: err.message }
  }
}

async function main() {
  console.log('🔍 查詢需要遷移的記錄...\n')

  // 查詢所有需要遷移的照片：
  // 1. 巢狀路徑格式（workspaceId/orderId/filename）
  // 2. data URL 格式（data:image/...;base64,...）
  const { data: allMembers, error } = await supabase
    .from('order_members')
    .select('id, chinese_name, passport_image_url')
    .not('passport_image_url', 'is', null)

  if (error) {
    console.error('❌ 查詢失敗:', error)
    process.exit(1)
  }

  // 過濾出需要遷移的（排除已經是新格式的）
  const members = allMembers.filter(m => {
    const url = m.passport_image_url

    // data URL
    if (url.startsWith('data:')) return true

    // 提取檔名（從 URL 或路徑中）
    let filename
    if (url.includes('/')) {
      const parts = url.split('/')
      filename = parts[parts.length - 1].split('?')[0] // 去掉 query string
    } else {
      filename = url
    }

    // 判斷是否為舊格式：
    // 1. 檔名不是 passport_timestamp_random 格式
    // 2. 或路徑包含多層目錄（UUID/UUID/filename 格式）
    const isNewFormat = /^passport_\d+_[a-z0-9]+\.(jpg|png|jpeg)$/i.test(filename)
    const isNestedPath =
      url.includes('/') &&
      url
        .split('/')
        .filter(p => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p))
        .length > 0

    return !isNewFormat || isNestedPath
  })

  if (!members || members.length === 0) {
    console.log('✅ 沒有需要遷移的記錄')
    process.exit(0)
  }

  console.log(`找到 ${members.length} 筆需要遷移的記錄`)
  console.log(DRY_RUN ? '⚠️  DRY-RUN 模式（不會實際執行）\n' : '')

  const results = {
    total: members.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  for (const member of members) {
    const result = await migratePhoto(member)

    if (result.skipped) {
      results.skipped++
    } else if (result.success) {
      results.success++
    } else {
      results.failed++
      results.errors.push({
        id: member.id,
        name: member.chinese_name,
        error: result.error,
      })
    }
  }

  console.log('\n📊 遷移結果統計:')
  console.log(`  總數: ${results.total}`)
  if (DRY_RUN) {
    console.log(`  跳過: ${results.skipped} (dry-run 模式)`)
  } else {
    console.log(`  成功: ${results.success}`)
    console.log(`  失敗: ${results.failed}`)
  }

  if (results.errors.length > 0) {
    console.log('\n❌ 失敗記錄:')
    results.errors.forEach(err => {
      console.log(`  - [${err.id}] ${err.name}: ${err.error}`)
    })
  }

  if (!DRY_RUN && results.success > 0) {
    console.log('\n💡 提示: 舊檔案尚未刪除，確認一切正常後可手動清理')
  }

  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('💥 執行失敗:', err)
  process.exit(1)
})
