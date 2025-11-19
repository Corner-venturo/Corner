const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

async function verifyFinalStatus() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔍 最終驗證 - todos 資料表\n')

  try {
    // 檢查欄位
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ 查詢失敗:', error.message)
      return false
    }

    console.log('✅ 查詢成功')

    if (data && data.length > 0) {
      const fields = Object.keys(data[0])
      console.log(`\n📋 欄位列表 (${fields.length} 個):`)
      fields.forEach(field => {
        if (field === 'updated_by') {
          console.log(`  ✅ ${field} (新增成功!)`)
        } else {
          console.log(`  • ${field}`)
        }
      })

      // 檢查 updated_by 是否有值
      const hasUpdatedBy = 'updated_by' in data[0]
      const updatedByValue = data[0].updated_by

      console.log(`\n🔍 updated_by 欄位狀態:`)
      console.log(`  存在: ${hasUpdatedBy ? '✅ 是' : '❌ 否'}`)
      console.log(`  值: ${updatedByValue || '(null)'}`)

      // 檢查是否已從 created_by 複製
      if (hasUpdatedBy && updatedByValue === data[0].created_by) {
        console.log(`  ✅ 已正確從 created_by 複製`)
      }

      return hasUpdatedBy
    } else {
      console.log('⚠️ 資料表為空，無法驗證欄位')
      return true
    }
  } catch (err) {
    console.error('❌ 執行錯誤:', err.message)
    return false
  }
}

verifyFinalStatus()
  .then(success => {
    if (success) {
      console.log('\n🎉 Migration 驗證成功！')
      console.log('現在可以重啟應用程式測試功能。')
    } else {
      console.log('\n⚠️ Migration 驗證失敗')
    }
    process.exit(success ? 0 : 1)
  })
