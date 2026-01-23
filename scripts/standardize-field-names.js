/**
 * 執行欄位命名標準化 migration
 * Reference: docs/FIELD_NAMING_STANDARDS.md
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

const RENAMES = [
  { table: 'employees', from: 'birthday', to: 'birth_date' },
  { table: 'customers', from: 'date_of_birth', to: 'birth_date' },
  { table: 'customers', from: 'passport_expiry_date', to: 'passport_expiry' },
  { table: 'customers', from: 'passport_romanization', to: 'passport_name' },
  { table: 'suppliers', from: 'name_en', to: 'english_name' },
]

async function checkColumnExists(table, column) {
  const sql = `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${table}'
        AND column_name = '${column}'
    ) as exists
  `
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  if (error) {
    console.error(`  Error checking ${table}.${column}:`, error.message)
    return false
  }
  return data?.[0]?.exists === true
}

async function renameColumn(table, from, to) {
  const sql = `ALTER TABLE public.${table} RENAME COLUMN ${from} TO ${to};`
  const { error } = await supabase.rpc('exec_sql', { sql })
  if (error) {
    console.error(`  ✗ ${table}.${from} → ${to}: ${error.message}`)
    return false
  }
  console.log(`  ✓ ${table}.${from} → ${to}`)
  return true
}

async function main() {
  console.log('🚀 開始執行欄位命名標準化...\n')

  let successCount = 0
  let skipCount = 0
  let failCount = 0

  for (const { table, from, to } of RENAMES) {
    // 檢查舊欄位是否存在
    const oldExists = await checkColumnExists(table, from)
    const newExists = await checkColumnExists(table, to)

    if (newExists) {
      console.log(`  ⏭ ${table}.${to} 已存在，跳過`)
      skipCount++
      continue
    }

    if (!oldExists) {
      console.log(`  ⏭ ${table}.${from} 不存在，跳過`)
      skipCount++
      continue
    }

    // 執行改名
    const success = await renameColumn(table, from, to)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  // 處理 suppliers 的 note/notes 合併
  console.log('\n處理 suppliers.note → notes 合併...')
  const noteExists = await checkColumnExists('suppliers', 'note')
  const notesExists = await checkColumnExists('suppliers', 'notes')

  if (noteExists && notesExists) {
    // 合併後刪除
    const mergeSql = `
      UPDATE suppliers
      SET notes = COALESCE(notes, '') || CASE WHEN note IS NOT NULL AND note != '' THEN chr(10) || note ELSE '' END
      WHERE note IS NOT NULL AND note != '';
    `
    await supabase.rpc('exec_sql', { sql: mergeSql })

    const dropSql = `ALTER TABLE suppliers DROP COLUMN note;`
    const { error } = await supabase.rpc('exec_sql', { sql: dropSql })
    if (error) {
      console.log(`  ✗ 刪除 suppliers.note 失敗: ${error.message}`)
      failCount++
    } else {
      console.log(`  ✓ 已合併 suppliers.note 到 notes 並刪除 note 欄位`)
      successCount++
    }
  } else if (noteExists && !notesExists) {
    // 只有 note，改名為 notes
    const success = await renameColumn('suppliers', 'note', 'notes')
    if (success) successCount++
    else failCount++
  } else {
    console.log(`  ⏭ suppliers.note 不存在或已處理，跳過`)
    skipCount++
  }

  console.log('\n========================================')
  console.log(`✅ 成功: ${successCount}`)
  console.log(`⏭ 跳過: ${skipCount}`)
  console.log(`❌ 失敗: ${failCount}`)
  console.log('========================================')

  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('執行失敗:', err)
  process.exit(1)
})
