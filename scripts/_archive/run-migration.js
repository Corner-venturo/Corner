#!/usr/bin/env node

const fs = require('fs')
const https = require('https')

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const sqlFile =
  process.argv[2] ||
  '/Users/william/Projects/venturo-new/supabase/migrations/20251025_create_tours_table.sql'

console.log('📝 讀取 SQL:', sqlFile)
const sql = fs.readFileSync(sqlFile, 'utf8')

// 使用 Supabase Database URL 直接執行
const url = new URL(SUPABASE_URL)
const dbUrl = `postgresql://postgres.pfqvdacxowpgfamuvnsn:${SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

console.log('🔄 嘗試透過 pg 模組執行...')

// 嘗試使用 pg
try {
  const { Client } = require('pg')

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })

  ;(async () => {
    try {
      await client.connect()
      console.log('✅ 已連接到資料庫')

      await client.query(sql)
      console.log('✅ SQL 執行成功！')

      await client.end()
      process.exit(0)
    } catch (err) {
      console.error('❌ 執行失敗:', err.message)

      console.log('\n📋 請手動執行:')
      console.log('1. 前往 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new')
      console.log('2. 複製貼上檔案內容:', sqlFile)
      console.log('3. 點擊 Run')

      process.exit(1)
    }
  })()
} catch (err) {
  console.log('⚠️  pg 模組未安裝')
  console.log('📦 正在安裝 pg...')

  const { execSync } = require('child_process')
  try {
    execSync('npm install pg', { stdio: 'inherit', cwd: '/Users/william/Projects/venturo-new' })
    console.log('✅ pg 安裝完成，請重新執行此腳本')
  } catch (installErr) {
    console.error('❌ 安裝失敗')
    console.log('\n📋 請手動執行:')
    console.log('1. npm install pg')
    console.log('2. 重新執行此腳本')
  }
}
