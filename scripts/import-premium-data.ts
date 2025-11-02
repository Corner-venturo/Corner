/**
 * 匯入頂級旅遊資料腳本
 * 執行：tsx scripts/import-premium-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🚀 開始匯入頂級旅遊資料...')

  try {
    // 1. 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, 'seed-premium-database.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    // 2. 執行 SQL
    console.log('📝 執行 SQL...')

    // 注意：Supabase JS Client 不支援直接執行 SQL
    // 需要手動處理或使用 Postgres 連線
    console.log('⚠️  請使用以下指令執行 SQL：')
    console.log('')
    console.log('psql "postgresql://postgres.pfqvdacxowpgfamuvnsn:Corner@8520@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" < scripts/seed-premium-database.sql')
    console.log('')

    console.log('✅ 完成！')
  } catch (error) {
    console.error('❌ 錯誤：', error)
    process.exit(1)
  }
}

main()
