import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(filename: string) {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', filename)
  const sql = readFileSync(migrationPath, 'utf-8')

  console.log(`📝 執行 migration: ${filename}`)

  // Supabase 不直接支援執行 SQL，所以我們需要分段執行
  // 對於創建表格，我們可以用 REST API

  console.log('⚠️  請在 Supabase Dashboard 的 SQL Editor 中執行此 SQL：')
  console.log('🔗 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql')
  console.log('\n--- SQL ---\n')
  console.log(sql)
  console.log('\n--- END ---\n')
}

runMigration('20251025_create_channel_members.sql')
